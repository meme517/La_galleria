import React, { useState, useEffect } from 'react';
import { User, Message } from '../types';
import { motion } from 'framer-motion';
import { ClipboardDocumentListIcon, ClockIcon, CheckCircleIcon, DocumentTextIcon, EnvelopeIcon, EnvelopeOpenIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { io } from 'socket.io-client';
import { logout } from '../services/authService';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { useLanguage } from '../context/LanguageContext';

interface ServiceProviderPageProps {
  onNavigate: (page: string) => void;
}

const ServiceProviderPage: React.FC<ServiceProviderPageProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    status: 'present',
    absenceReason: '',
    notes: ''
  });
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [salaryInfo, setSalaryInfo] = useState<{ salary: number; payments: any[] }>({ salary: 0, payments: [] });
  const [salaryError, setSalaryError] = useState('');
  const { t } = useLanguage();

  async function fetchMessages() {
    try {
      const response = await apiService.getUserMessages();
      const msgs = response.messages || [];
      setMessages(msgs);
      setUnreadCount(msgs.filter((msg: Message) => !msg.read).length);
    } catch (error) {
      console.warn('Could not fetch messages:', error);
    }
  }

  async function fetchAttendanceHistory() {
    try {
      const history = await apiService.getAttendanceHistory();
      setAttendanceHistory(history);
    } catch (error) {
      console.warn('Could not fetch attendance history:', error);
    }
  }

  async function fetchTasks() {
    try {
      const taskList = await apiService.getTasks();
      setTasks(taskList);
    } catch (error) {
      console.warn('Could not fetch tasks:', error);
    }
  }

  async function fetchSalaryHistory() {
    try {
      const data = await apiService.getMySalaryHistory();
      setSalaryInfo({
        salary: data.salary || 0,
        payments: data.payments || []
      });
      setSalaryError('');
    } catch (error) {
      console.warn('Could not fetch salary history:', error);
      setSalaryError('Could not load salary history');
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchAttendanceHistory();
  }, []);

  // Fetch messages & tasks only when user.id is available
  useEffect(() => {
    if (!user?.id) return;

    fetchMessages();
    fetchTasks();
    fetchSalaryHistory();

    // Poll for new messages and tasks every 30 seconds
    const messageInterval = setInterval(fetchMessages, 30000);
    const taskInterval = setInterval(fetchTasks, 30000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(taskInterval);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Establish Socket.io connection
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    setSocket(newSocket);

    // Listen for new messages
    newSocket.on('newMessage', (data) => {
      console.log('New message received:', data);
      // Add the new message to the messages list
      setMessages(prevMessages => [data.message, ...prevMessages]);
      // Increment unread count
      setUnreadCount(prev => prev + 1);
    });

    // Join the user's room
    newSocket.emit('join', user.id);

    // Cleanup on unmount
    return () => {
      newSocket.off('newMessage');
      newSocket.disconnect();
    };
  }, [user?.id]);

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendanceHistory.find(att => att.date === today);
  };

  const getScheduledShifts = () => {
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);

    return attendanceHistory.filter(att => {
      const attDate = new Date(att.date);
      return attDate >= today && attDate <= weekFromNow && att.status === 'scheduled';
    });
  };

  const handleStartShift = async (attendanceId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await apiService.startShift();
      await fetchAttendanceHistory();
      alert('Shift started successfully!');
    } catch (error) {
      console.error('Failed to start shift:', error);
      alert('Failed to start shift. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndShift = async (attendanceId: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await apiService.endShift();
      await fetchAttendanceHistory();
      alert('Shift ended successfully!');
    } catch (error) {
      console.error('Failed to end shift:', error);
      alert('Failed to end shift. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendanceFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const attendanceData = {
        date: new Date().toISOString().split('T')[0],
        status: attendanceForm.status,
        absenceReason: attendanceForm.status === 'absent' ? attendanceForm.absenceReason : undefined,
        notes: attendanceForm.notes
      };
      await apiService.markAttendance(attendanceData);
      await fetchAttendanceHistory();
      setShowAttendanceForm(false);
      setAttendanceForm({ status: 'present', absenceReason: '', notes: '' });
      alert('Attendance marked successfully!');
    } catch (error) {
      console.error('Attendance operation failed:', error);
      alert('Failed to update attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Disconnect socket before logout
    if (socket) {
      socket.disconnect();
    }
    logout(onNavigate);
  };

  const handleViewTasks = () => {
    setShowTasksModal(true);
  };


  const updateTaskStatus = async (taskId: string, newStatus: string, completedNotes?: string) => {
    try {
      await apiService.updateTaskStatus(taskId, newStatus, completedNotes);
      await fetchTasks();
      alert('Task status updated successfully!');
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status. Please try again.');
    }
  };

  const formatTaskDue = (task: any) => {
    if (!task?.dueDate) {
      return task?.dueTime ? task.dueTime : 'No due date';
    }
    const parsed = new Date(task.dueDate);
    if (Number.isNaN(parsed.getTime())) {
      return task?.dueTime ? task.dueTime : 'No due date';
    }
    const datePart = parsed.toLocaleDateString();
    return task?.dueTime ? `${datePart} ${task.dueTime}` : datePart;
  };

  const handleViewMessages = () => {
    fetchMessages();
    setShowMessagesModal(true);
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await apiService.markUserMessageRead(messageId);
      setMessages(messages.map(message =>
        message.id === messageId ? { ...message, read: true } : message
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.warn('Could not mark message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await apiService.deleteUserMessage(messageId);
      setMessages(messages.filter(message => message.id !== messageId));
      setUnreadCount(prev => Math.max(0, prev - (messages.find(m => m.id === messageId && !m.read) ? 1 : 0)));
    } catch (error) {
      console.warn('Could not delete message:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'absent':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'scheduled':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'completed':
        return 'Completed';
      case 'scheduled':
        return 'Scheduled';
      default:
        return 'Unknown';
    }
  };

  const todayAttendance = getTodayAttendance();
  const scheduledShifts = getScheduledShifts();

  const quickActions = [
    {
      title: t('serviceProvider.markAttendance', 'Mark Attendance'),
      description: todayAttendance ? `Status: ${getStatusLabel(todayAttendance.status)}` : t('serviceProvider.markAttendance', 'Mark Attendance'),
      icon: DocumentTextIcon,
      action: () => setShowAttendanceForm(true),
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: t('serviceProvider.viewTasks', 'View Tasks'),
      description: t('serviceProvider.viewTasks', 'View Tasks'),
      icon: ClipboardDocumentListIcon,
      action: handleViewTasks,
      color: 'bg-emerald-600',
      hoverColor: 'hover:bg-emerald-700',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      title: t('serviceProvider.messages', 'Messages'),
      description: unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : t('serviceProvider.messages', 'Messages'),
      icon: unreadCount > 0 ? EnvelopeOpenIcon : EnvelopeIcon,
      action: handleViewMessages,
      color: unreadCount > 0 ? 'bg-red-600' : 'bg-indigo-600',
      hoverColor: unreadCount > 0 ? 'hover:bg-red-700' : 'hover:bg-indigo-700',
      bgColor: unreadCount > 0 ? 'bg-red-50' : 'bg-indigo-50',
      textColor: unreadCount > 0 ? 'text-red-700' : 'text-indigo-700'
    },
  ];

  return (
    <DashboardLayout onNavigate={onNavigate}>
      <div className="serviceprovider-theme space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="rounded-none border border-sky-100/70 dark:border-sky-900/40 bg-white/80 dark:bg-gray-900/70 backdrop-blur p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">{t('serviceProvider.title', 'Service Provider')}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mt-1">{t('serviceProvider.welcome', 'Welcome back, {{name}}', { name: user?.name || '' })}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t('serviceProvider.subtitle', 'Your daily actions, messages, and salary history in one place.')}</p>
        </div>

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/70 rounded-none border border-gray-200/60 dark:border-gray-800 backdrop-blur p-6 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('serviceProvider.goodDay', 'Good day!')}</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('serviceProvider.goodDayDesc', "You're logged in as a service provider. Use the quick actions below to manage your daily tasks.")}
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/90 dark:bg-gray-900/70 rounded-none shadow-sm p-6 transition-shadow hover:shadow-md cursor-pointer border border-gray-200/70 dark:border-gray-800"
              onClick={action.action}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-none ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{action.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{action.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Salary History */}
        <div className="bg-white/80 dark:bg-gray-900/70 rounded-none border border-gray-200/60 dark:border-gray-800 backdrop-blur shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('serviceProvider.salaryHistory', 'Salary History')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('serviceProvider.monthlySalary', 'Monthly salary')}: ${salaryInfo.salary.toFixed(2)}
          </p>
            </div>
            <button
              onClick={fetchSalaryHistory}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t('serviceProvider.refresh', 'Refresh')}
            </button>
          </div>

          {salaryError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-none">
              {salaryError}
            </div>
          )}

          {salaryInfo.payments.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              {t('serviceProvider.noPayments', 'No salary payments recorded yet.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {salaryInfo.payments.map((payment: any) => (
                    <tr key={payment._id || payment.id}>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                        ${Number(payment.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(payment.paidAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                        {payment.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

          {/* Attendance Form Modal */}
          {showAttendanceForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-none shadow-xl p-6 w-full max-w-md mx-4"
              >
                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Daily Attendance Check-in</h3>
                </div>

                <form onSubmit={handleAttendanceFormSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Attendance Status
                    </label>
                    <select
                      value={attendanceForm.status}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-gray-100"
                      required
                    >
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>

                  {attendanceForm.status === 'absent' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Absence Reason
                      </label>
                      <select
                        value={attendanceForm.absenceReason}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, absenceReason: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-gray-100"
                        required
                      >
                        <option value="">Select reason</option>
                        <option value="sick">Sick Leave</option>
                        <option value="personal">Personal Leave</option>
                        <option value="emergency">Emergency</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={attendanceForm.notes}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                      placeholder="Any additional notes about your attendance..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-900 dark:text-gray-100"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAttendanceForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-none text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-none text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Marking Attendance...' : 'Mark Attendance'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Tasks Modal */}
          {showTasksModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-none shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-green-600 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('serviceProvider.tasksTitle', 'My Tasks')}</h3>
                  </div>
                  <button
                    onClick={() => setShowTasksModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">{t('serviceProvider.noTasks', 'No tasks assigned yet')}</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task._id || task.id} className="border border-gray-200 dark:border-gray-700 rounded-none p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{String(task.title || '')}</h4>
                            {task.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{String(task.description)}</p>
                            )}
                            <div className="flex items-center mt-2 space-x-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                {task.priority} priority
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                {task.status}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Due: {formatTaskDue(task)}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {task.status !== 'completed' && (
                              <button
                                onClick={() => updateTaskStatus(task._id || task.id, 'completed')}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-none hover:bg-green-700"
                              >
                                {t('serviceProvider.markComplete', 'Mark Complete')}
                              </button>
                            )}
                            {task.status !== 'in-progress' && task.status !== 'completed' && (
                              <button
                                onClick={() => updateTaskStatus(task._id || task.id, 'in-progress')}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-none hover:bg-blue-700"
                              >
                                {t('serviceProvider.startTask', 'Start Task')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowTasksModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-none text-sm font-medium hover:bg-gray-700"
                  >
                    {t('serviceProvider.close', 'Close')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Messages Modal */}
          {showMessagesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-none shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-6 w-6 text-indigo-600 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Messages</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={fetchMessages}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                      title="Refresh messages"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowMessagesModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`border rounded-none p-4 ${!message.read ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {!message.read && <EnvelopeOpenIcon className="h-4 w-4 text-blue-600" />}
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{message.subject}</h4>
                              {!message.read && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-blue-100 text-blue-800">
                                  Unread
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{message.content}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>From: {message.sender}</span>
                              <span>{new Date(message.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="ml-4 flex flex-col gap-2">
                            {!message.read && (
                              <button
                                onClick={() => markMessageAsRead(message.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-none hover:bg-blue-700"
                              >
                                Mark as Read
                              </button>
                            )}
                            <button
                              onClick={() => deleteMessage(message.id)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded-none hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowMessagesModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-none text-sm font-medium hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

      </div>
    </DashboardLayout>
  );
};

export default ServiceProviderPage;

