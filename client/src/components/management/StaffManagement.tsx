import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useStaff } from '../../hooks/useStaff';
import { Staff } from '../../types';
import { DataTable } from '../shared/DataTable';
import { Modal } from '../shared/Modal';

export function StaffManagement() {
  const { staff, isLoading, updateStaff, createStaff, deleteStaff } = useStaff();
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'add'>('edit');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (value: string, item: Staff) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-100">
              {value.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'zones',
      header: 'Zones/Areas',
      render: (value: string[]) => (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {value && value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.slice(0, 2).map((zone, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                  {zone}
                </span>
              ))}
              {value.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-300">+{value.length - 2} more</span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-300">None</span>
          )}
        </div>
      ),
    },
    {
      key: 'shiftPattern',
      header: 'Shift',
      sortable: true,
      render: (value: string) => {
        const shiftHours = {
          morning: 'Morning (6AM - 2PM)',
          afternoon: 'Afternoon (2PM - 10PM)',
          evening: 'Evening (4PM - 12AM)',
          night: 'Night (10PM - 6AM)',
          flexible: 'Flexible'
        };
        return (
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {value ? shiftHours[value as keyof typeof shiftHours] || value : ''}
          </span>
        );
      },
    },
    {
      key: 'plainPassword',
      header: 'Password',
      render: (value: string, item: Staff) => (
        <div className="text-sm">
          {value ? (
            <div className="flex items-center space-x-2">
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono text-gray-800 dark:text-gray-100">
                {value}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(value)}
                className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 text-xs"
                title="Copy password"
              >
                📋
              </button>
            </div>
          ) : (
            <span></span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, item: Staff) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(item)}
            className="text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 p-1"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="text-red-600 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200 p-1"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleEdit = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedStaff(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleDelete = async (staffMember: Staff) => {
    if (window.confirm(`Are you sure you want to delete ${staffMember.name}?`)) {
      try {
        await deleteStaff(staffMember.id);
        // The useStaff hook will automatically refresh the data
      } catch (error) {
        console.error('Failed to delete staff member:', error);
        alert('Failed to delete staff member. Please try again.');
      }
    }
  };

  const handleSave = async (formData: Partial<Staff> & { autoGeneratePassword?: boolean; sendCredentials?: boolean }) => {
    try {
      if (modalMode === 'add') {
        const result = await createStaff(formData);
        if (result.generatedPassword) {
          setGeneratedPassword(result.generatedPassword);
          // Show password in alert for now - you can replace with a better UI
          alert(`Staff created successfully! Generated password: ${result.generatedPassword}`);
        }
      } else if (selectedStaff) {
        // For updates, only pass the Staff properties, not the extra fields
        const { autoGeneratePassword, sendCredentials, ...staffData } = formData;
        await updateStaff(selectedStaff.id, staffData);
      }
      setIsModalOpen(false);
      setSelectedStaff(null);
    } catch (error) {
      console.error('Failed to save staff member:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Staff Management</h1>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Add Staff
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900/70 shadow rounded-lg border border-gray-200/60 dark:border-gray-800">
        <DataTable
          data={staff}
          columns={columns}
          loading={isLoading}
          emptyMessage="No staff members found"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'edit' ? 'Edit Staff Member' : 'Add Staff Member'}
      >
        <StaffForm
          staff={selectedStaff}
          mode={modalMode}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </motion.div>
  );
}

interface StaffFormProps {
  staff: Staff | null;
  mode: 'edit' | 'add';
  onSave: (data: Partial<Staff> & { autoGeneratePassword?: boolean; sendCredentials?: boolean }) => void;
  onCancel: () => void;
}

function StaffForm({ staff, mode, onSave, onCancel }: StaffFormProps) {
  const [formData, setFormData] = useState<Partial<Staff>>({
    name: staff?.name || '',
    email: staff?.email || '',
    role: staff?.role || 'serviceProvider',
    status: staff?.status || 'active',
    department: staff?.department || undefined,
    zones: staff?.zones || [],
    shiftPattern: staff?.shiftPattern || undefined,
    permissions: staff?.permissions || [],
  });

  const [autoGeneratePassword, setAutoGeneratePassword] = useState(false);
  const [sendCredentials, setSendCredentials] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const departmentZones = {
    Restaurant: ['Dining Room', 'Kitchen', 'Bar Area', 'Outdoor Seating'],
    Bar: ['Main Bar', 'Lounge', 'VIP Area', 'Outdoor Bar'],
    Reception: ['Front Desk', 'Lobby', 'Concierge', 'Check-in Counter'],
    Housekeeping: ['Guest Rooms', 'Public Areas', 'Laundry', 'Storage'],
    Kitchen: ['Main Kitchen', 'Prep Area', 'Storage', 'Dishwashing']
  };

  const departmentPermissions = {
    Restaurant: ['process_orders', 'manage_inventory', 'view_reports'],
    Bar: ['process_orders', 'manage_inventory', 'view_reports'],
    Reception: ['check_in_guests', 'manage_bookings', 'view_reports'],
    Housekeeping: ['manage_inventory', 'view_reports'],
    Kitchen: ['process_orders', 'manage_inventory', 'view_reports']
  };

  const handleDepartmentChange = (department: Staff['department']) => {
    setFormData({
      ...formData,
      department,
      zones: [],
      permissions: department ? departmentPermissions[department as keyof typeof departmentPermissions] || [] : []
    });
  };

  const handleZoneToggle = (zone: string) => {
    const currentZones = formData.zones || [];
    const newZones = currentZones.includes(zone)
      ? currentZones.filter(z => z !== zone)
      : [...currentZones, zone];
    setFormData({ ...formData, zones: newZones });
  };

  const handlePermissionToggle = (permission: string) => {
    const currentPermissions = formData.permissions || [];
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (formData.role === 'serviceProvider' && !formData.department) {
      newErrors.department = 'Department is required for service providers.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave({
        ...formData,
        autoGeneratePassword,
        sendCredentials
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'serviceProvider' })}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    formData.role === 'serviceProvider'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Service Provider
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Restaurant staff, housekeeping, etc.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    formData.role === 'admin'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-200'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Admin
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Management access</div>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Staff['status'] })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Assignment Section - Only for Service Providers */}
      {formData.role === 'serviceProvider' && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900">Work Assignment & Access</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.keys(departmentZones).map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => handleDepartmentChange(dept as Staff['department'])}
                  className={`p-3 border rounded-lg text-sm font-medium ${
                    formData.department === dept
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {formData.department && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Zones/Areas</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {formData.department && departmentZones[formData.department as keyof typeof departmentZones].map((zone) => (
                    <label key={zone} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(formData.zones || []).includes(zone)}
                        onChange={() => handleZoneToggle(zone)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{zone}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {formData.department && departmentPermissions[formData.department as keyof typeof departmentPermissions].map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(formData.permissions || []).includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Shift Pattern</label>
                <select
                  value={formData.shiftPattern || ''}
                  onChange={(e) => setFormData({ ...formData, shiftPattern: e.target.value as Staff['shiftPattern'] })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select shift pattern</option>
                  <option value="morning">Morning (6AM - 2PM)</option>
                  <option value="afternoon">Afternoon (2PM - 10PM)</option>
                  <option value="evening">Evening (4PM - 12AM)</option>
                  <option value="night">Night (10PM - 6AM)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}

      {/* Credentials Section - Only for Add mode */}
      {mode === 'add' && (
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900">Credentials & Communication</h3>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoGeneratePassword}
                onChange={(e) => setAutoGeneratePassword(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-generate secure password</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={sendCredentials}
                onChange={(e) => setSendCredentials(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Send credentials via email</span>
            </label>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {mode === 'edit' ? 'Update' : 'Create'} Staff
        </button>
      </div>
    </form>
  );
}
