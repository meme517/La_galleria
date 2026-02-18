import { useState, useEffect } from 'react';
import axios from 'axios';

const BookingForm = ({ onBookingAdded, onBookingSubmit }) => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: 1,
    roomId: '',
    specialRequests: ''
  });

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Get logged-in user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || ''
        }));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }

    const fetchData = async () => {
      try {
      const roomsResponse = await axios.get('http://localhost:5000/api/rooms/available');
      const rawRooms = roomsResponse.data.rooms || roomsResponse.data || [];
      const normalized = rawRooms.map((r) => ({
        ...r,
        number: r.number || r.roomNumber
      }));
      setRooms(normalized);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  // Auto-fill room selection when customer clicked a room card
  useEffect(() => {
    if (!rooms || rooms.length === 0) return;
    const selectedRoomRaw = sessionStorage.getItem('selectedRoom');
    if (!selectedRoomRaw) return;

    try {
      const selected = JSON.parse(selectedRoomRaw);
      // Try to match by backend _id, or by roomNumber/type/name if coming from older mock structures
      const match = rooms.find((r) => {
        const rId = r._id || r.id;
        const selId = selected._id || selected.id;
        if (selId && rId && String(rId) === String(selId)) return true;
        if (selected.roomNumber && r.roomNumber && String(r.roomNumber) === String(selected.roomNumber)) return true;
        if (selected.type && r.type && String(r.type).toLowerCase() === String(selected.type).toLowerCase()) return true;
        if (selected.name && r.name && String(r.name).toLowerCase() === String(selected.name).toLowerCase()) return true;
        return false;
      });

      if (match) {
        setFormData((prev) => ({
          ...prev,
          roomId: match._id || match.id || ''
        }));
      }
    } catch (err) {
      console.error('Error parsing selected room:', err);
    } finally {
      // One-time auto-fill
      sessionStorage.removeItem('selectedRoom');
    }
  }, [rooms]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfGuests' ? parseInt(value) || 1 : value
    }));
  };



  const calculateTotalAmount = () => {
    const room = rooms.find(r => r._id === formData.roomId);
    return room ? room.price * calculateNights() : 0;
  };

  const calculateNights = () => {
    if (!formData.checkInDate || !formData.checkOutDate) return 0;
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to create a booking');
        setLoading(false);
        return;
      }

      const locationNote = formData.location ? `Location: ${formData.location}` : '';
      const combinedSpecialRequests = [locationNote, formData.specialRequests]
        .filter(Boolean)
        .join(' | ');

      const bookingData = {
        phone: formData.phone,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        numberOfGuests: formData.numberOfGuests,
        room: formData.roomId,
        totalAmount: calculateTotalAmount(),
        specialRequests: combinedSpecialRequests
      };

      const response = await axios.post('http://localhost:5000/api/bookings', bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Booking created successfully!');
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        location: '',
        checkInDate: '',
        checkOutDate: '',
        numberOfGuests: 1,
        roomId: '',
        specialRequests: ''
      });
      if (onBookingAdded) onBookingAdded(response.data);
      if (onBookingSubmit) onBookingSubmit(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Make a Booking</h2>
      <p className="text-sm text-gray-500 mb-4">
        Choose your room and set your location (e.g. lobby, room number).
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              readOnly={!!user?.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              readOnly={!!user?.email}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter your phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location (optional)
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Room number or area (e.g. Poolside, Lobby)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
            <input
              type="date"
              name="checkInDate"
              value={formData.checkInDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
            <input
              type="date"
              name="checkOutDate"
              value={formData.checkOutDate}
              onChange={handleChange}
              required
              min={formData.checkInDate || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
            <select
              name="numberOfGuests"
              value={formData.numberOfGuests}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1} Guest{i !== 0 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
            <select
              name="roomId"
              value={formData.roomId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select a room</option>
              {rooms.filter(room => room.available !== false).map(room => (
                <option key={room._id} value={room._id}>
                  {room.number || room.roomNumber} - {room.type} (${room.price}/night)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests (Optional)</label>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Any special requests or notes"
          />
        </div>

        {formData.roomId && formData.checkInDate && formData.checkOutDate && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Summary</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                Room:{' '}
                {rooms.find(r => r._id === formData.roomId)?.number || rooms.find(r => r._id === formData.roomId)?.roomNumber} -{' '}
                {rooms.find(r => r._id === formData.roomId)?.type}
              </p>
              <p>Nights: {calculateNights()}</p>
              <p>Room Cost: ${rooms.find(r => r._id === formData.roomId)?.price * calculateNights()}</p>
              <p className="font-medium text-gray-900">Total: ${calculateTotalAmount().toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
          >
            {loading ? 'Creating Booking...' : 'Book Room'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}
      </form>


    </div>
  );
};

export default BookingForm;
