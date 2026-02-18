import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const API_BASE_URL = 'http://localhost:5000/api/checkins';

function CheckinPage({ onNavigate }) {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mood: '',
    energy: '',
    notes: ''
  });

  // Fetch all check-ins
  const fetchCheckins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_BASE_URL);
      setCheckins(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch check-ins');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.mood || !formData.energy) {
      setError('Mood and energy are required');
      return false;
    }
    if (formData.energy < 1 || formData.energy > 10) {
      setError('Energy must be between 1 and 10');
      return false;
    }
    return true;
  };

  // Create new check-in
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.post(API_BASE_URL, {
        ...formData,
        energy: parseInt(formData.energy)
      });
      setCheckins(prev => [response.data, ...prev]);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        mood: '',
        energy: '',
        notes: ''
      });
      setSuccess(t('checkin.created', 'Check-in created successfully!'));
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create check-in');
      console.error(err);
    }
  };

  // Start editing
  const handleEdit = (checkin) => {
    setEditingId(checkin._id);
    setFormData({
      date: new Date(checkin.date).toISOString().split('T')[0],
      mood: checkin.mood,
      energy: checkin.energy.toString(),
      notes: checkin.notes || ''
    });
  };

  // Update check-in
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.put(`${API_BASE_URL}/${editingId}`, {
        ...formData,
        energy: parseInt(formData.energy)
      });
      setCheckins(prev => prev.map(checkin =>
        checkin._id === editingId ? response.data : checkin
      ));
      setEditingId(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        mood: '',
        energy: '',
        notes: ''
      });
      setSuccess(t('checkin.updated', 'Check-in updated successfully!'));
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update check-in');
      console.error(err);
    }
  };

  // Delete check-in
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this check-in?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      setCheckins(prev => prev.filter(checkin => checkin._id !== id));
      setSuccess(t('checkin.deleted', 'Check-in deleted successfully!'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete check-in');
      console.error(err);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      mood: '',
      energy: '',
      notes: ''
    });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('checkin.title', 'Casual Check-in Tracker')}
          </h1>
          <button
            onClick={() => onNavigate('home')}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            ← {t('booking.backHome', 'Back to Home')}
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? t('checkin.edit', 'Edit Check-in') : t('checkin.add', 'Add New Check-in')}
          </h2>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mood
                </label>
                <select
                  name="mood"
                  value={formData.mood}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select mood</option>
                  <option value="happy">Happy</option>
                  <option value="sad">Sad</option>
                  <option value="neutral">Neutral</option>
                  <option value="excited">Excited</option>
                  <option value="tired">Tired</option>
                  <option value="anxious">Anxious</option>
                  <option value="calm">Calm</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Energy (1-10)
                </label>
                <input
                  type="number"
                  name="energy"
                  value={formData.energy}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {editingId ? t('checkin.update', 'Update Check-in') : t('checkin.add', 'Add Check-in')}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t('checkin.cancel', 'Cancel')}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Check-ins List */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b border-gray-200">
            {t('checkin.yours', 'Your Check-ins')}
          </h2>
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading check-ins...</div>
          ) : checkins.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No check-ins yet. Add your first one above!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mood
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Energy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {checkins.map((checkin) => (
                    <tr key={checkin._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(checkin.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {checkin.mood}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {checkin.energy}/10
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {checkin.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(checkin)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(checkin._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckinPage;
