import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, ClockIcon, UserIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Attendance, Staff } from '../../types';
import { apiService } from '../../services/api';

const AttendanceTracking: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<Attendance | null>(null);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present' as 'scheduled' | 'present' | 'absent' | 'completed',
    absenceReason: '',
    actualStartTime: '',
    actualEndTime: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
    fetchStaffData();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAttendance();
      // Filter attendances by selected date
      const filteredAttendances = response.filter(attendance => {
        try {
          const attendanceDate = new Date(attendance.date).toISOString().split('T')[0];
          return attendanceDate === selectedDate;
        } catch (error) {
          console.error('Error parsing attendance date:', error);
          return false;
        }
      });
      setAttendances(filteredAttendances);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffData = async () => {
    try {
      const staffData = await apiService.getStaff();
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      setStaff([]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.date) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // Check if attendance already exists for this user on this date
      const existingAttendance = attendances.find(att => att.user.id === formData.userId);

      if (existingAttendance) {
        // Update existing attendance
        await apiService.updateAttendance(existingAttendance.id, {
          status: formData.status,
          absenceReason: formData.status === 'absent' ? formData.absenceReason : undefined,
          actualStartTime: formData.actualStartTime || undefined,
          actualEndTime: formData.actualEndTime || undefined,
          notes: formData.notes || undefined
        });
      } else {
        // Create new attendance record
        await apiService.markAttendance({
          date: formData.date,
          status: formData.status,
          absenceReason: formData.status === 'absent' ? formData.absenceReason : undefined,
          actualStartTime: formData.actualStartTime || undefined,
          actualEndTime: formData.actualEndTime || undefined,
          notes: formData.notes || undefined
        });
      }

      // Refresh data
      await fetchAttendanceData();
      setShowForm(false);
      setFormData({
        userId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        absenceReason: '',
        actualStartTime: '',
        actualEndTime: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSubmitting(false);
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

  const handleViewRecord = (attendance: Attendance) => {
    setViewingRecord(attendance);
  };

  const handleEditRecord = (attendance: Attendance) => {
    setEditingRecord(attendance);
    setFormData({
      userId: attendance.user.id,
      date: new Date(attendance.date).toISOString().split('T')[0],
      status: attendance.status,
      absenceReason: attendance.absenceReason || '',
      actualStartTime: attendance.actualStartTime || '',
      actualEndTime: attendance.actualEndTime || '',
      notes: attendance.notes || ''
    });
    setShowForm(true);
  };

  const handleCloseView = () => {
    setViewingRecord(null);
  };

  const handleCloseEdit = () => {
    setEditingRecord(null);
    setShowForm(false);
    setFormData({
      userId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      absenceReason: '',
      actualStartTime: '',
      actualEndTime: '',
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Tracking</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Mark Attendance
        </button>
      </div>

      {/* Attendance Marking Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Mark Attendance</h3>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Staff Selection */}
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                  Staff Member *
                </label>
                <select
                  id="userId"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select Staff Member</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              {/* Status Selection */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              {/* Absence Reason (conditional) */}
              {formData.status === 'absent' && (
                <div>
                  <label htmlFor="absenceReason" className="block text-sm font-medium text-gray-700">
                    Absence Reason
                  </label>
                  <input
                    type="text"
                    id="absenceReason"
                    value={formData.absenceReason}
                    onChange={(e) => setFormData({ ...formData, absenceReason: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Reason for absence"
                  />
                </div>
              )}

              {/* Actual Start Time */}
              <div>
                <label htmlFor="actualStartTime" className="block text-sm font-medium text-gray-700">
                  Actual Start Time
                </label>
                <input
                  type="time"
                  id="actualStartTime"
                  value={formData.actualStartTime}
                  onChange={(e) => setFormData({ ...formData, actualStartTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              {/* Actual End Time */}
              <div>
                <label htmlFor="actualEndTime" className="block text-sm font-medium text-gray-700">
                  Actual End Time
                </label>
                <input
                  type="time"
                  id="actualEndTime"
                  value={formData.actualEndTime}
                  onChange={(e) => setFormData({ ...formData, actualEndTime: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Additional notes..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Save Attendance'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Attendance Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Attendance Details</h3>
                <button
                  onClick={handleCloseView}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(viewingRecord.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{viewingRecord.user.name}</p>
                    <p className="text-sm text-gray-500">{viewingRecord.user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="text-sm text-gray-900">{new Date(viewingRecord.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewingRecord.status === 'present' ? 'bg-green-100 text-green-800' :
                      viewingRecord.status === 'absent' ? 'bg-red-100 text-red-800' :
                      viewingRecord.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusLabel(viewingRecord.status)}
                    </span>
                  </div>
                  {viewingRecord.actualStartTime && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time</label>
                      <p className="text-sm text-gray-900">{viewingRecord.actualStartTime}</p>
                    </div>
                  )}
                  {viewingRecord.actualEndTime && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time</label>
                      <p className="text-sm text-gray-900">{viewingRecord.actualEndTime}</p>
                    </div>
                  )}
                </div>
                {viewingRecord.absenceReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Absence Reason</label>
                    <p className="text-sm text-red-600">{viewingRecord.absenceReason}</p>
                  </div>
                )}
                {viewingRecord.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-600">{viewingRecord.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleCloseView}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Filter */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700">
              Filter by Date
            </label>
            <input
              type="date"
              id="dateFilter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Attendance for {new Date(selectedDate).toLocaleDateString()}
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="px-6 py-4 text-center text-gray-500">
              Loading attendance data...
            </div>
          ) : attendances.length === 0 ? (
            <div className="px-6 py-4 text-center text-gray-500">
              No attendance records found for this date.
            </div>
          ) : (
            attendances.map((attendance) => (
              <div key={attendance.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(attendance.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {attendance.user.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {attendance.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      attendance.status === 'present' ? 'bg-green-100 text-green-800' :
                      attendance.status === 'absent' ? 'bg-red-100 text-red-800' :
                      attendance.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusLabel(attendance.status)}
                    </span>
                    {attendance.actualStartTime && (
                      <span className="text-sm text-gray-500">
                        Start: {attendance.actualStartTime}
                      </span>
                    )}
                    {attendance.actualEndTime && (
                      <span className="text-sm text-gray-500">
                        End: {attendance.actualEndTime}
                      </span>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewRecord(attendance)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <UserIcon className="h-3 w-3 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditRecord(attendance)}
                        className="inline-flex items-center px-2 py-1 border border-transparent rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
                {attendance.notes && (
                  <p className="mt-2 text-sm text-gray-600">
                    Notes: {attendance.notes}
                  </p>
                )}
                {attendance.absenceReason && (
                  <p className="mt-2 text-sm text-red-600">
                    Absence Reason: {attendance.absenceReason}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracking;
