import React from 'react';
import { UsersIcon, ChatBubbleLeftRightIcon, ClockIcon, CalendarIcon, CubeIcon, ClipboardDocumentListIcon, ShieldCheckIcon, ListBulletIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface ManagementGridProps {
    onModuleClick: (module: string) => void;
}

export const ManagementGrid: React.FC<ManagementGridProps> = ({ onModuleClick }) => {
    const modules = [
        {
            id: 'staff',
            title: 'Staff Management',
            description: 'Manage employees, roles, and permissions',
            icon: UsersIcon,
            color: 'bg-blue-500',
        },
        {
            id: 'messaging',
            title: 'Messaging Employees',
            description: 'Send messages and announcements to staff',
            icon: ChatBubbleLeftRightIcon,
            color: 'bg-green-500',
        },
        {
            id: 'attendance',
            title: 'Attendance Tracking',
            description: 'Monitor staff attendance and working hours',
            icon: ClockIcon,
            color: 'bg-purple-500',
        },
        {
            id: 'bookings',
            title: 'Booking Management',
            description: 'Handle reservations and room assignments',
            icon: CalendarIcon,
            color: 'bg-orange-500',
        },
        {
            id: 'products',
            title: 'Product & Service Management',
            description: 'Manage menu items, rooms, and services',
            icon: CubeIcon,
            color: 'bg-red-500',
        },
        {
            id: 'orders',
            title: 'Order Management',
            description: 'Process and track customer orders',
            icon: ClipboardDocumentListIcon,
            color: 'bg-indigo-500',
        },
        {
            id: 'tasks',
            title: 'Task Management',
            description: 'Create and assign tasks to service providers',
            icon: ListBulletIcon,
            color: 'bg-teal-500',
        },
        {
            id: 'salaries',
            title: 'Salary Management',
            description: 'Set salaries and record payments',
            icon: BanknotesIcon,
            color: 'bg-emerald-600',
        },
        {
            id: 'password-vault',
            title: 'Password Vault',
            description: 'Securely store and manage passwords',
            icon: ShieldCheckIcon,
            color: 'bg-yellow-500',
        },
    ];

    return (
        <div className="bg-white/80 dark:bg-gray-900/70 rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-800 backdrop-blur p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Management Modules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {modules.map((module) => {
                    const IconComponent = module.icon;
                    return (
                        <div
                            key={module.id}
                            onClick={() => onModuleClick(module.id)}
                            className="bg-white/90 dark:bg-gray-900/70 hover:bg-white dark:hover:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all duration-200 border border-gray-200/70 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 shadow-sm"
                        >
                            <div className="flex items-center mb-4">
                                <div className={`p-3 rounded-xl ${module.color} text-white mr-4`}>
                                    <IconComponent className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{module.title}</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">{module.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ManagementGrid;
