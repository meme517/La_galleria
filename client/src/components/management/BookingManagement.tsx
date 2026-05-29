import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, ListBulletIcon, UserIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Booking } from '../../types';
import { apiService } from '../../services/api';

const BookingManagement: React.FC = () => {
    const [view, setView] = useState<'calendar' | 'list'>('list');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const data = await apiService.getBookings();
                setBookings(data);
            } catch (err) {
                setError('Failed to load bookings');
                console.error('Error fetching bookings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter(booking => {
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        const term = searchTerm.toLowerCase();
        const customerName = booking.customer?.name?.toLowerCase() || '';
        const customerEmail = booking.customer?.email?.toLowerCase() || '';
        const roomNumber = booking.room?.number?.toLowerCase() || '';
        const matchesSearch = searchTerm === '' ||
            customerName.includes(term) ||
            customerEmail.includes(term) ||
            roomNumber.includes(term);
        return matchesStatus && matchesSearch;
    });

    const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status']) => {
        try {
            await apiService.updateBookingStatus(bookingId, newStatus);
            setBookings(prev => prev.map(booking =>
                booking.id === bookingId ? { ...booking, status: newStatus } : booking
            ));
        } catch (err) {
            console.error('Failed to update booking status:', err);
            setError('Failed to update booking status');
        }
    };

    const getStatusColor = (status: Booking['status']) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'checked-in': return 'bg-green-100 text-green-800';
            case 'checked-out': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white/80 dark:bg-gray-900/70 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-sm backdrop-blur">
            <div className="p-6 border-b border-gray-200/60 dark:border-gray-800">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Booking Management</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">Handle reservations and room assignments</p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setView('calendar')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'calendar'
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700'
                                }`}
                        >
                            <CalendarDaysIcon className="h-4 w-4 inline mr-2" />
                            Calendar
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'list'
                                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700'
                                }`}
                        >
                            <ListBulletIcon className="h-4 w-4 inline mr-2" />
                            List
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-300">Loading bookings...</div>
                ) : (
                view === 'calendar' ? (
                    <div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Select Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredBookings.map((booking) => (
                                <div key={booking.id} className="bg-white/90 dark:bg-gray-900/80 rounded-xl p-4 border border-gray-200/60 dark:border-gray-800 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.customer?.name || 'Unknown Guest'}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-300">Room {booking.room?.number || 'N/A'}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                                            <ClockIcon className="h-3 w-3 mr-1" />
                                            Check-in: {new Date(booking.checkInDate).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                                            <ClockIcon className="h-3 w-3 mr-1" />
                                            Check-out: {new Date(booking.checkOutDate).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                                            <UserIcon className="h-3 w-3 mr-1" />
                                            {booking.numberOfGuests} guests
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {filteredBookings.length === 0 && (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-300">
                                <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                <p>No bookings for this date</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="mb-6 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or room number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Status</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="checked-in">Checked In</option>
                                    <option value="checked-out">Checked Out</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800/90">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                            Room/Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                            Check-in
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                            Check-out
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                            Guests
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900/70 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {booking.id.slice(-8)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-300 mr-2" />
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.customer?.name || 'Unknown Guest'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {booking.phone}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {booking.customer?.email || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <MapPinIcon className="h-4 w-4 text-gray-400 dark:text-gray-300 mr-2" />
                                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                                        {booking.room?.number || 'N/A'} - {booking.room?.type || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {new Date(booking.checkInDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {new Date(booking.checkOutDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {booking.numberOfGuests}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                ${booking.totalAmount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200"
                                                    >
                                                        Edit
                                                    </button>
                                                    <select
                                                        value={booking.status}
                                                        onChange={(e) => handleStatusUpdate(booking.id, e.target.value as Booking['status'])}
                                                        className="text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1"
                                                    >
                                                        <option value="confirmed">Confirm</option>
                                                        <option value="checked-in">Check In</option>
                                                        <option value="checked-out">Check Out</option>
                                                        <option value="cancelled">Cancel</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
                )}

                {/* Edit Booking Modal */}
                {showEditModal && selectedBooking && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-900">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Edit Booking</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedBooking.customer?.name || 'Unknown Guest'}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">{selectedBooking.customer?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Room</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedBooking.room?.number || 'N/A'} - {selectedBooking.room?.type || 'N/A'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Check-in</label>
                                            <p className="text-sm text-gray-900 dark:text-gray-100">{new Date(selectedBooking.checkInDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Check-out</label>
                                            <p className="text-sm text-gray-900 dark:text-gray-100">{new Date(selectedBooking.checkOutDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Special Requests</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedBooking.specialRequests || 'None'}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-6">
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-100 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingManagement;
