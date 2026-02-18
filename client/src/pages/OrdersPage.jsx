import { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerNavbar from '../components/CustomerNavbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

const OrdersPage = ({ onNavigate }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [groupedMenu, setGroupedMenu] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [orderType, setOrderType] = useState('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [location, setLocation] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { t } = useLanguage();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      alert('Please log in as a customer to place orders.');
      if (onNavigate) onNavigate('login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'customer') {
        alert('Only customers can place orders. Please log in with a customer account.');
        if (onNavigate) onNavigate('login');
        return;
      }
      setUser(userData);
    } catch (err) {
      console.error('Error parsing user data:', err);
      if (onNavigate) onNavigate('login');
      return;
    }

    fetchMenuItems();
    fetchOrders();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/menu/public');
      const items = Array.isArray(response.data) ? response.data : (response.data.menuItems || []);
      setMenuItems(items);

      // Group menu items by category
      const grouped = items
        .filter(item => item.available)
        .reduce((acc, item) => {
          const category = item.category || 'general';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item);
          return acc;
        }, {});

      setGroupedMenu(grouped);

      // Check for pre-selected menu item from FeaturedMenu after menu items are loaded
      const selectedItem = sessionStorage.getItem('selectedMenuItem');
      if (selectedItem) {
        try {
          const item = JSON.parse(selectedItem);
          // Find the matching menu item from the fetched list
          const menuItem = items.find(m =>
            m._id === item.id || m._id === item._id || m.id === item.id || m.id === item._id ||
            m.name === item.name
          );
          if (menuItem) {
            addToCart({
              id: menuItem._id || menuItem.id,
              name: menuItem.name,
              price: menuItem.price || parseFloat(item.price?.replace('$', '') || '0'),
              quantity: 1,
              category: menuItem.category || 'general'
            });
          }
          sessionStorage.removeItem('selectedMenuItem');
        } catch (err) {
          console.error('Error parsing selected menu item:', err);
        }
      }
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
      setError('Failed to load menu items');
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both array and object response formats
      setOrders(response.data.orders || response.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load order history');
    }
  };

  const addToCart = (item) => {
    setCart(prevCart => {
      const existing = prevCart.find(i => i.id === item.id);
      if (existing) {
        return prevCart.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, change) => {
    setCart(prevCart => {
      const updated = prevCart.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      );
      return updated.filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  };

  const getCategoryDisplayName = (category) => {
    const categoryMap = {
      'food': 'Food',
      'drink': 'Drinks',
      'beverage': 'Drinks',
      'beverages': 'Drinks',
      'appetizer': 'Appetizers',
      'main': 'Main Course',
      'main-course': 'Main Course',
      'dessert': 'Desserts',
      'general': 'All Items'
    };
    return categoryMap[category?.toLowerCase()] || category || 'All Items';
  };

  const getFilteredMenuItems = () => {
    if (activeCategory === 'all') {
      return menuItems.filter(item => item.available);
    }
    return (groupedMenu[activeCategory] || []).filter(item => item.available);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (cart.length === 0) {
      setError('Please add items to your cart');
      setLoading(false);
      return;
    }

    if (orderType === 'dine-in' && !tableNumber) {
      setError('Please enter a table number for dine-in orders');
      setLoading(false);
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress) {
      setError('Please enter a delivery address');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const locationNote = location ? `Location: ${location}` : '';
      const combinedInstructions = [locationNote, specialInstructions]
        .filter(Boolean)
        .join(' | ');
      const response = await axios.post(
        'http://localhost:5000/api/orders',
        {
          items: cart.map(item => ({
            menuItem: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          orderType,
          tableNumber: orderType === 'dine-in' ? parseInt(tableNumber) : undefined,
          deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
          requestedTime: requestedTime || undefined,
          specialInstructions: combinedInstructions
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Order placed successfully!');
      setCart([]);
      setTableNumber('');
      setDeliveryAddress('');
      setSpecialInstructions('');
      setLocation('');
      setRequestedTime('');
      setOrderType('dine-in');
      fetchOrders();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Object.keys(groupedMenu).sort()];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <CustomerNavbar onNavigate={onNavigate} />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('orders.title', 'Food & Drinks')}</h1>
            <p className="text-gray-600">{t('orders.subtitle', 'Order from featured and bar menu selections')}</p>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← {t('orders.backHome', 'Back to Home')}
          </button>
        </div>

        {/* Booking / Orders Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-2">
            <button
              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
              onClick={() => onNavigate('booking')}
            >
              {t('booking.bookingTab', 'Booking')}
            </button>
            <button
              className="px-4 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600 whitespace-nowrap"
            >
              {t('booking.ordersTab', 'Orders')}
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items Section */}
          <div className="lg:col-span-2">
            {/* Category Tabs */}
            <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-4">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {getCategoryDisplayName(category)}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            {getFilteredMenuItems().length === 0 ? (
              <div className="bg-white p-12 rounded-lg shadow-md text-center">
                <p className="text-gray-500 text-lg">No items available in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getFilteredMenuItems().map(item => (
                  <div
                    key={item._id || item.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {item.image && (
                      <div className="h-48 bg-gray-200 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-xl text-gray-900">{item.name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {getCategoryDisplayName(item.category)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <p className="text-orange-600 font-bold text-xl">${(item.price || 0).toFixed(2)}</p>
                        <button
                          onClick={() => addToCart({
                            id: item._id || item.id,
                            name: item.name,
                            price: item.price,
                            category: item.category || 'general'
                          })}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart & Order Form Sidebar */}
          <div className="lg:col-span-1">
            {/* Cart */}
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{t('orders.cart', 'Your Cart')}</h2>
                {cart.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-gray-500">{t('orders.emptyCart', 'Your cart is empty')}</p>
                  <p className="text-gray-400 text-sm mt-1">{t('orders.addItems', 'Add items from the menu to get started')}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            ${(item.price || 0).toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2 text-red-500 hover:text-red-700 p-1"
                            aria-label="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                      <span>{t('orders.total', 'Total')}:</span>
                      <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Order Form */}
                  <form onSubmit={handleSubmitOrder} className="space-y-4">
                    {user && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                          <input
                            type="text"
                            value={user.name || ''}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
                          <input
                            type="email"
                            value={user.email || ''}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order Type *</label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="dine-in">🍽️ Dine In</option>
                        <option value="takeaway">🥡 Takeaway</option>
                        <option value="delivery">🚚 Delivery</option>
                      </select>
                    </div>

                    {orderType === 'dine-in' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Table Number *</label>
                        <input
                          type="number"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          placeholder="Enter table number"
                        />
                      </div>
                    )}

                    {orderType === 'delivery' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address *</label>
                        <textarea
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                          placeholder="Enter your delivery address"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time to reach (optional)
                      </label>
                      <input
                        type="time"
                        value={requestedTime}
                        onChange={(e) => setRequestedTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Example: when you want the order delivered or ready.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location (optional)
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Room number or area (e.g. Poolside, Lobby)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions (Optional)</label>
                      <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        placeholder="Any special requests?"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {success}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
                    >
                      {loading ? 'Placing Order...' : t('orders.placeOrder', 'Place Order')}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Order History */}
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">{t('orders.recentOrders', 'Recent Orders')}</h2>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No orders yet</p>
                  <p className="text-gray-400 text-sm mt-1">Your order history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order._id || order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Order #{String(order._id || order.id).slice(-6).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                          }`}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                        </span>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <p className="text-sm text-gray-600 mb-2">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </p>
                      )}
                      <p className="text-lg font-bold text-gray-900">
                        ${(order.totalAmount || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrdersPage;
