import { useState, useEffect } from 'react';
import ScrollReveal from './ScrollReveal';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const RoomsPreview = ({ onNavigate }) => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  useEffect(() => {
    // Fetch real rooms so selection matches the Rooms tab/admin rooms
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError('');
        // Customer-friendly endpoint
        const response = await axios.get('http://localhost:5000/api/rooms/available');
        const payload = response.data || {};
        const list = payload.rooms || payload || [];
        setRooms(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
        setError(t('rooms.loadError', 'Failed to load rooms. Please try again.'));
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const handleBookNow = (room) => {
    // Check if user is logged in and is a customer
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      alert(t('rooms.loginCustomer', 'Please log in as a customer to book a room.'));
      if (onNavigate) onNavigate('login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'customer') {
        alert(t('rooms.onlyCustomer', 'Only customers can book rooms. Please log in with a customer account.'));
        if (onNavigate) onNavigate('login');
        return;
      }

      // Navigate to booking page
      if (onNavigate) {
        // Store selected room in sessionStorage for booking form
        sessionStorage.setItem('selectedRoom', JSON.stringify(room));
        onNavigate('booking');
      }
    } catch (err) {
      console.error('Error checking user role:', err);
      alert(t('rooms.login', 'Please log in to book a room.'));
      if (onNavigate) onNavigate('login');
    }
  };

  return (
    <section id="rooms" className="py-20 sm:py-24 lg:py-32 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('rooms.title', 'Our Rooms')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('rooms.subtitle', 'Choose a room that fits your style and comfort.')}
            </p>
          </div>
        </ScrollReveal>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-3xl mx-auto">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('rooms.loading', 'Loading rooms...')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {rooms.map((room, index) => (
            <ScrollReveal key={room.id || room._id || room.roomNumber || `room-${index}`} delay={index * 0.15}>
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
                whileHover={{ y: -8 }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="relative h-64 overflow-hidden">
                  <motion.img
                    src={room.image || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&h=400&fit=crop'}
                    alt={room.type || room.name || `Room ${room.roomNumber || ''}`}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-primary font-bold text-lg">
                      ${Number(room.price || 0).toFixed(0)}/night
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {room.type || room.name || `Room ${room.roomNumber || ''}`}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-6 space-y-1">
                    {room.roomNumber && <p>{t('rooms.roomNumber', 'Room Number')}: <span className="font-medium text-gray-800 dark:text-gray-200">{room.roomNumber}</span></p>}
                    {room.capacity && <p>{t('rooms.capacity', 'Capacity')}: <span className="font-medium text-gray-800 dark:text-gray-200">{room.capacity}</span></p>}
                    {room.description && <p className="line-clamp-2">{room.description}</p>}
                    {Array.isArray(room.amenities) && room.amenities.length > 0 && (
                      <p className="line-clamp-2">
                        {t('rooms.amenities', 'Amenities')}: <span className="font-medium text-gray-800 dark:text-gray-200">{room.amenities.join(', ')}</span>
                      </p>
                    )}
                  </div>
                  <motion.button
                    onClick={() => handleBookNow(room)}
                    className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                    whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(217, 119, 6, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('rooms.bookNow', 'Book Now')}
                  </motion.button>
                </div>
              </motion.div>
            </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RoomsPreview;

