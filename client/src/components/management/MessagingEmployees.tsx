import React, { useState, useEffect } from 'react';
import { PaperAirplaneIcon, InboxIcon, PencilSquareIcon, UserIcon, EnvelopeOpenIcon, ClipboardDocumentListIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { Staff } from '../../types';
import { io } from 'socket.io-client';

interface Message {
    id: string;
    recipient: string;
    subject: string;
    content: string;
    sentAt: string;
    sender?: string;
    read?: boolean;
}

interface ReceivedMessage {
    id: string;
    sender: string;
    subject: string;
    content: string;
    sentAt: string;
    read: boolean;
}

interface Task {
    id: string;
    title: string;
    description: string;
    assignedTo: string;
    status: string;
    priority: string;
    dueDate: string;
    dueTime: string;
    createdAt: string;
    notes?: string;
}

const MessagingEmployees: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose' | 'tasks'>('inbox');
    const [sentMessages, setSentMessages] = useState<Message[]>([]);
    const [receivedMessages, setReceivedMessages] = useState<ReceivedMessage[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);

    const [newMessage, setNewMessage] = useState({
        recipientId: '',
        subject: '',
        content: '',
    });

    const [newTask, setNewTask] = useState({
        assignedTo: '',
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        dueTime: '',
        notes: ''
    });

    const loadTasks = async () => {
        try {
            const tasksData = await apiService.getTasks();
            const formattedTasks = tasksData.map((task: any) => ({
                id: task._id || task.id,
                title: task.title,
                description: task.description,
                assignedTo: task.assignedTo,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                dueTime: task.dueTime,
                createdAt: task.createdAt,
                notes: task.notes
            }));
            setTasks(formattedTasks);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        loadStaff();
        loadSentMessages();
        loadReceivedMessages();
        loadTasks();

        const taskInterval = setInterval(loadTasks, 30000);
        return () => clearInterval(taskInterval);
    }, []);

    useEffect(() => {
        // Socket.io integration for real-time messages
        if (user?.id) {
            const socket = io('http://localhost:5000');
            socket.emit('join', user.id);

            socket.on('newMessage', (message) => {
                if (message.recipient === user.id) {
                    loadReceivedMessages(); // Refresh received messages
                }
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [user?.id]);

    const loadStaff = async () => {
        try {
            const staffData = await apiService.getStaff();
            setStaff(staffData);
        } catch (error) {
            console.error('Failed to load staff:', error);
        }
    };

    const loadSentMessages = async () => {
        try {
            const messagesData = await apiService.getMessages();
            const formattedMessages = messagesData.map((msg: any) => ({
                id: msg.id || msg._id,
                recipient: msg.recipient?.name || msg.recipient,
                subject: msg.subject,
                content: msg.content,
                sentAt: new Date(msg.createdAt).toLocaleString(),
            }));
            setSentMessages(formattedMessages);
        } catch (error) {
            console.error('Failed to load sent messages:', error);
        }
    };

    const loadReceivedMessages = async () => {
        try {
            const messagesData = await apiService.getReceivedMessages();
            const formattedMessages = messagesData.map((msg: any) => ({
                id: msg.id || msg._id,
                sender: msg.sender?.name || msg.sender,
                subject: msg.subject,
                content: msg.content,
                sentAt: new Date(msg.createdAt).toLocaleString(),
                read: !!msg.read,
            }));
            setReceivedMessages(formattedMessages);
        } catch (error) {
            console.error('Failed to load received messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.recipientId || !newMessage.subject || !newMessage.content) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await apiService.sendMessage({
                recipientId: newMessage.recipientId,
                subject: newMessage.subject,
                content: newMessage.content,
            });

            alert('Message sent successfully!');
            setNewMessage({ recipientId: '', subject: '', content: '' });
            setActiveTab('sent');
            loadSentMessages(); // Refresh sent messages
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const markMessageAsRead = async (messageId: string) => {
        try {
            await apiService.markMessageRead(messageId);
            setReceivedMessages(receivedMessages.map(msg =>
                msg.id === messageId ? { ...msg, read: true } : msg
            ));
        } catch (error) {
            console.error('Failed to mark message as read:', error);
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            await apiService.updateTaskStatus(taskId, newStatus);
            await loadTasks();
            alert('Task status updated successfully!');
        } catch (error) {
            console.error('Failed to update task status:', error);
            alert('Failed to update task status. Please try again.');
        }
    };

    const handleCreateTask = async () => {
        if (!newTask.assignedTo || !newTask.title || !newTask.dueDate) {
            alert('Please fill in assignee, title, and due date');
            return;
        }

        setLoading(true);
        try {
            await apiService.createTask({
                assignedTo: newTask.assignedTo,
                title: newTask.title,
                description: newTask.description,
                priority: newTask.priority,
                dueDate: newTask.dueDate,
                dueTime: newTask.dueTime || undefined,
                notes: newTask.notes || undefined
            });
            setNewTask({
                assignedTo: '',
                title: '',
                description: '',
                priority: 'medium',
                dueDate: '',
                dueTime: '',
                notes: ''
            });
            await loadTasks();
            alert('Task created successfully!');
            setActiveTab('tasks');
        } catch (error) {
            console.error('Failed to create task:', error);
            alert('Failed to create task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStaffName = (staffId: any) => {
        if (!staffId) return 'Unknown';
        if (typeof staffId === 'object') {
            const name = staffId.name || staffId.fullName || staffId.email || staffId.id || staffId._id;
            return name ? String(name) : 'Unknown';
        }
        const match = staff.find((member) => member.id === staffId);
        return match ? `${match.name} - ${match.department}` : String(staffId);
    };

    const formatDue = (task: Task) => {
        if (!task.dueDate) {
            return task.dueTime ? task.dueTime : 'No due date';
        }
        const parsed = new Date(task.dueDate);
        if (Number.isNaN(parsed.getTime())) {
            return task.dueTime ? task.dueTime : 'No due date';
        }
        const datePart = parsed.toLocaleDateString();
        return task.dueTime ? `${datePart} ${task.dueTime}` : datePart;
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex flex-wrap gap-3 px-4 sm:px-6">
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'inbox'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <InboxIcon className="h-5 w-5 inline mr-2" />
                        Inbox ({receivedMessages.filter(m => !m.read).length})
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'sent'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <EnvelopeOpenIcon className="h-5 w-5 inline mr-2" />
                        Sent
                    </button>
                    <button
                        onClick={() => setActiveTab('compose')}
                        className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'compose'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <PencilSquareIcon className="h-5 w-5 inline mr-2" />
                        Compose
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'tasks'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <ClipboardDocumentListIcon className="h-5 w-5 inline mr-2" />
                        Tasks ({tasks.filter(t => t.status !== 'completed').length})
                    </button>
                </nav>
            </div>

            <div className="p-6">
                {activeTab === 'inbox' ? (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Received Messages</h3>
                        <div className="space-y-4">
                            {receivedMessages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`border border-gray-200 rounded-lg p-4 cursor-pointer ${!message.read ? 'bg-blue-50 border-blue-200' : ''}`}
                                    onClick={() => !message.read && markMessageAsRead(message.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">{message.subject}</h4>
                                            <p className="text-sm text-gray-500">From: {message.sender}</p>
                                            {!message.read && <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>}
                                        </div>
                                        <span className="text-xs text-gray-400">{message.sentAt}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-2">{message.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : activeTab === 'sent' ? (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Sent Messages</h3>
                        <div className="space-y-4">
                            {sentMessages.map((message) => (
                                <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">{message.subject}</h4>
                                            <p className="text-sm text-gray-500">To: {message.recipient}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">{message.sentAt}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-2">{message.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : activeTab === 'tasks' ? (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks</h3>
                        <div className="mb-6 rounded-lg border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Assign New Task</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Assign to</label>
                                    <select
                                        value={newTask.assignedTo}
                                        onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Select staff</option>
                                        {staff.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.name} - {employee.department}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Title</label>
                                    <input
                                        type="text"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Task title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Due date</label>
                                    <input
                                        type="date"
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Due time</label>
                                    <input
                                        type="time"
                                        value={newTask.dueTime}
                                        onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="What needs to be done?"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                                    <textarea
                                        value={newTask.notes}
                                        onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                                        rows={2}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Extra details for the service provider"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={handleCreateTask}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                                    {loading ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {tasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No tasks assigned yet</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-gray-900">{String(task.title || '')}</h4>
                                                <p className="text-xs text-gray-500 mt-1">Assigned to: {getStaffName(task.assignedTo)}</p>
                                                {task.description && (
                                                    <p className="text-xs text-gray-600 mt-1">{String(task.description)}</p>
                                                )}
                                                {task.notes && (
                                                    <p className="text-xs text-gray-500 mt-1">Notes: {String(task.notes)}</p>
                                                )}
                                                <div className="flex items-center mt-2 space-x-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {task.priority} priority
                                                    </span>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {task.status}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        Due: {formatDue(task)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                {task.status !== 'completed' && (
                                                    <button
                                                        onClick={() => updateTaskStatus(task.id, 'completed')}
                                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                                                    >
                                                        Mark Complete
                                                    </button>
                                                )}
                                                {task.status !== 'in-progress' && task.status !== 'completed' && (
                                                    <button
                                                        onClick={() => updateTaskStatus(task.id, 'in-progress')}
                                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                                    >
                                                        Start Task
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Compose New Message</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Recipient</label>
                                <select
                                    value={newMessage.recipientId}
                                    onChange={(e) => setNewMessage({ ...newMessage, recipientId: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">Select recipient</option>
                                    {staff.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name} - {employee.department}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <input
                                    type="text"
                                    value={newMessage.subject}
                                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Enter subject"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Message</label>
                                <textarea
                                    value={newMessage.content}
                                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                                    rows={6}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Enter your message"
                                />
                            </div>
                            <button
                                onClick={handleSendMessage}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagingEmployees;
