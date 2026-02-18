import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Modal } from '../shared/Modal';
import { DataTable } from '../shared/DataTable';

interface PasswordEntry {
  _id: string;
  title: string;
  username: string;
  url?: string;
  category: string;
  description?: string;
  tags: string[];
  accessLevel: string;
  createdBy: { name: string };
  createdAt: string;
  isActive: boolean;
}

const PasswordVaultManagement: React.FC = () => {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    category: 'other',
    description: '',
    tags: '',
    accessLevel: 'admin-only'
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await api.get('/password-vault');
      setEntries(response.data.entries || []);
    } catch (error) {
      console.error('Failed to fetch password entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      if (editingEntry) {
        await api.put(`/password-vault/${editingEntry._id}`, {
          ...formData,
          tags: tagsArray
        });
      } else {
        await api.post('/password-vault', {
          ...formData,
          tags: tagsArray
        });
      }

      setShowModal(false);
      setEditingEntry(null);
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Failed to save password entry:', error);
    }
  };

  const handleEdit = (entry: PasswordEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      username: entry.username,
      password: '', // Don't show existing password
      url: entry.url || '',
      category: entry.category,
      description: entry.description || '',
      tags: entry.tags.join(', '),
      accessLevel: entry.accessLevel
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this password entry?')) {
      try {
        await api.delete(`/password-vault/${id}`);
        fetchEntries();
      } catch (error) {
        console.error('Failed to delete password entry:', error);
      }
    }
  };

  const handleViewPassword = async (id: string) => {
    try {
      const response = await api.get(`/password-vault/${id}/password`);
      setShowPassword(response.data.password);
      // Auto-hide password after 30 seconds
      setTimeout(() => setShowPassword(null), 30000);
    } catch (error) {
      console.error('Failed to retrieve password:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      username: '',
      password: '',
      url: '',
      category: 'other',
      description: '',
      tags: '',
      accessLevel: 'admin-only'
    });
  };

  const columns = [
    { key: 'title', header: 'Title', sortable: true },
    { key: 'username', header: 'Username', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'accessLevel', header: 'Access Level', sortable: true },
    {
      key: 'actions',
      header: 'Actions',
      render: (entry: PasswordEntry) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewPassword(entry._id)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            View Password
          </button>
          <button
            onClick={() => handleEdit(entry)}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(entry._id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading password vault...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Password Vault</h2>
        <button
          onClick={() => {
            setEditingEntry(null);
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Password Entry
        </button>
      </div>

      {showPassword && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Temporary Password Access:</span>
            <button
              onClick={() => setShowPassword(null)}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 p-2 bg-white rounded border font-mono">
            {showPassword}
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            This password will be hidden in 30 seconds for security.
          </p>
        </div>
      )}

      <DataTable
        data={entries}
        columns={columns}
      />

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEntry(null);
          resetForm();
        }}
        title={editingEntry ? 'Edit Password Entry' : 'Add Password Entry'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required={!editingEntry}
              placeholder={editingEntry ? 'Leave blank to keep current password' : ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">URL (optional)</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="system">System</option>
              <option value="third-party">Third Party</option>
              <option value="emergency">Emergency</option>
              <option value="shared">Shared</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Access Level</label>
            <select
              value={formData.accessLevel}
              onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="admin-only">Admin Only</option>
              <option value="managers">Managers</option>
              <option value="all-staff">All Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., wifi, admin, backup"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingEntry(null);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingEntry ? 'Update' : 'Create'} Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PasswordVaultManagement;
