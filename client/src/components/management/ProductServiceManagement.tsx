import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DataTable } from '../shared/DataTable';
import { Modal } from '../shared/Modal';
import { MenuItem, Room } from '../../types';

interface TableItem {
  id: string;
  [key: string]: any;
}

interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

interface RoomFormData {
  number: string;
  type: string;
  status: string;
  price: number;
}

const ProductServiceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | Room | null>(null);
  const [menuFormData, setMenuFormData] = useState<MenuItemFormData>({
    name: '',
    description: '',
    price: 0,
    category: '',
    available: true,
  });
  const [roomFormData, setRoomFormData] = useState<RoomFormData>({
    number: '',
    type: '',
    status: 'available',
    price: 0,
  });

  // Mock data
  const menuItems: MenuItem[] = [
    { id: '1', name: 'Grilled Chicken', description: 'Juicy grilled chicken breast', price: 15.99, category: 'Main Course', available: true },
    { id: '2', name: 'Caesar Salad', description: 'Fresh romaine lettuce with caesar dressing', price: 8.99, category: 'Salad', available: true },
  ];

  const rooms: Room[] = [
    { id: '1', number: '101', type: 'Deluxe', status: 'available', price: 150 },
    { id: '2', number: '102', type: 'Standard', status: 'occupied', price: 100 },
  ];

  const menuColumns = [
    { key: 'name', header: 'Name' },
    { key: 'description', header: 'Description' },
    { key: 'price', header: 'Price', render: (value: number) => `$${value.toFixed(2)}` },
    { key: 'category', header: 'Category' },
    { key: 'available', header: 'Available', render: (value: boolean) => value ? 'Yes' : 'No' },
    { key: 'actions', header: 'Actions', render: (_: any, item: TableItem) => (
      <div className="flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(item);
          }}
          className="text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(item.id);
          }}
          className="text-red-600 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200"
        >
          Delete
        </button>
      </div>
    )},
  ];

  const roomColumns = [
    { key: 'number', header: 'Room Number' },
    { key: 'type', header: 'Type' },
    { key: 'status', header: 'Status', render: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value === 'available' ? 'bg-green-100 text-green-800' :
        value === 'occupied' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    )},
    { key: 'price', header: 'Price', render: (value: number) => `$${value.toFixed(2)}` },
    { key: 'actions', header: 'Actions', render: (_: any, item: TableItem) => (
      <div className="flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(item);
          }}
          className="text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(item.id);
          }}
          className="text-red-600 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200"
        >
          Delete
        </button>
      </div>
    )},
  ];

  const tabs = [
    { name: 'Menu Items', data: menuItems as TableItem[], columns: menuColumns },
    { name: 'Rooms', data: rooms as TableItem[], columns: roomColumns },
  ];

  const handleAdd = () => {
    setEditingItem(null);
    if (activeTab === 0) {
      setMenuFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        available: true,
      });
    } else {
      setRoomFormData({
        number: '',
        type: '',
        status: 'available',
        price: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleEdit = (item: TableItem) => {
    setEditingItem(item as MenuItem | Room);
    if (activeTab === 0) {
      const menuItem = item as MenuItem;
      setMenuFormData({
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        category: menuItem.category,
        available: menuItem.available,
      });
    } else {
      const room = item as Room;
      setRoomFormData({
        number: room.number,
        type: room.type,
        status: room.status,
        price: room.price,
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    // Mock delete functionality
    console.log('Delete item:', id);
  };

  const handleSave = () => {
    if (activeTab === 0) {
      // Save menu item
      console.log('Saving menu item:', menuFormData);
    } else {
      // Save room
      console.log('Saving room:', roomFormData);
    }
    setIsModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Product & Service Management</h2>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New
        </button>
      </div>

      <div className="w-full">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800/90 p-1 rounded-lg mb-6 border border-gray-200/70 dark:border-gray-700">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`w-full py-2.5 text-sm font-medium leading-5 rounded-md transition-colors ${
                activeTab === index
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-200 shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <DataTable
            data={tabs[activeTab].data}
            columns={tabs[activeTab].columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit ${tabs[activeTab].name.slice(0, -1)}` : `Add New ${tabs[activeTab].name.slice(0, -1)}`}
      >
        {activeTab === 0 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={menuFormData.name}
                onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter menu item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={menuFormData.description}
                onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={menuFormData.price}
                  onChange={(e) => setMenuFormData({ ...menuFormData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={menuFormData.category}
                  onChange={(e) => setMenuFormData({ ...menuFormData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Main Course"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="available"
                checked={menuFormData.available}
                onChange={(e) => setMenuFormData({ ...menuFormData, available: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="available" className="ml-2 text-sm text-gray-700">Available</label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/80"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                <input
                  type="text"
                  value={roomFormData.number}
                  onChange={(e) => setRoomFormData({ ...roomFormData, number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={roomFormData.type}
                  onChange={(e) => setRoomFormData({ ...roomFormData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="Standard">Standard</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={roomFormData.status}
                  onChange={(e) => setRoomFormData({ ...roomFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night</label>
                <input
                  type="number"
                  step="0.01"
                  value={roomFormData.price}
                  onChange={(e) => setRoomFormData({ ...roomFormData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/80"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default ProductServiceManagement;
