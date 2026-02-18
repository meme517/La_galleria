import { useState, useEffect } from 'react';
import axios from 'axios';
import BookingForm from '../components/BookingForm';
import CustomerNavbar from '../components/CustomerNavbar';
import { useLanguage } from '../context/LanguageContext';

const BookingPage = ({ onNavigate }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('booking');
  const { t } = useLanguage();

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      alert('Please log in as a customer to access bookings.');
      if (onNavigate) onNavigate('login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'customer') {
        alert('Only customers can access the booking page.');
        if (onNavigate) onNavigate('home');
        return;
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
      if (onNavigate) onNavigate('login');
      return;
    }

    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/bookings/my-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to fetch bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = (newBooking) => {
    setBookings([newBooking, ...bookings]);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updated = response.data;
      setBookings(bookings.map(booking => booking._id === id ? updated : booking));
    } catch (err) {
      setError('Failed to delete booking');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <CustomerNavbar onNavigate={onNavigate} />
      <div className="container mx-auto px-4 py-8 max-w-7xl pt-24">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('booking.title', 'Stay & Dine')}</h1>
            <p className="text-gray-600">{t('booking.subtitle', 'Manage your room bookings and food orders')}</p>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            {t('booking.backHome', 'Back to Home')}
          </button>
        </div>

        {/* Booking / Orders Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'booking'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('booking')}
            >
              {t('booking.bookingTab', 'Booking')}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === 'orders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => onNavigate('orders')}
            >
              {t('booking.ordersTab', 'Orders')}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <BookingForm onBookingAdded={handleBookingSubmit} />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">{t('booking.yourBookings', 'Your Bookings')}</h2>
            {error && (
              <div className="mb-4">
                <p className="text-red-500 mb-2">{error}</p>
                <button
                  onClick={fetchBookings}
                  className="inline-block bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
                >
                  Retry
                </button>
              </div>
            )}
            {loading ? (
              <p>Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <p className="text-gray-500">{t('booking.none', 'No bookings yet.')}</p>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="font-bold">
                      {booking.room?.name || booking.room?.number || 'Room'} —{' '}
                      {new Date(booking.checkInDate).toLocaleDateString()} to{' '}
                      {new Date(booking.checkOutDate).toLocaleDateString()}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Guests: {booking.numberOfGuests} • Phone: {booking.phone}
                    </p>
                    {booking.specialRequests && (
                      <p className="text-gray-600 text-sm mt-1">{booking.specialRequests}</p>
                    )}
                    <button
                      onClick={() => handleDelete(booking._id)}
                      className="mt-3 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm"
                    >
                      {t('booking.cancel', 'Cancel Booking')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
