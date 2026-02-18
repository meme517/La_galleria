import React, { useState, useEffect } from 'react';
import { useStats } from '../hooks/useStats';
import { User } from '../types';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { StatsCards } from '../components/dashboard/StatsCards';
import { ManagementGrid } from '../components/dashboard/ManagementGrid';
import { StaffManagement } from '../components/management/StaffManagement';
import MessagingEmployees from '../components/management/MessagingEmployees';
import AttendanceTracking from '../components/management/AttendanceTracking';
import BookingManagement from '../components/management/BookingManagement';
import ProductServiceManagement from '../components/management/ProductServiceManagement';
import OrderManagement from '../components/management/OrderManagement';
import TaskManagement from '../components/management/TaskManagement';
import PasswordVaultManagement from '../components/management/PasswordVaultManagement';
import SalaryManagement from '../components/management/SalaryManagement';
import { logout } from '../services/authService';
import { useLanguage } from '../context/LanguageContext';

interface AdminPageProps {
    onNavigate: (page: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
    const { stats, isLoading, error, refresh } = useStats();
    const [user, setUser] = useState<User | null>(null);
    const [currentModule, setCurrentModule] = useState<string>('dashboard');
    const { t } = useLanguage();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        logout(onNavigate);
    };

    const handleCardClick = (type: 'bookings' | 'orders' | 'users') => {
        switch (type) {
            case 'bookings':
                setCurrentModule('bookings');
                break;
            case 'orders':
                setCurrentModule('orders');
                break;
            case 'users':
                setCurrentModule('staff');
                break;
        }
    };

    const handleModuleChange = (module: string) => {
        setCurrentModule(module);
    };

    const renderCurrentModule = () => {
        switch (currentModule) {
            case 'staff':
                return <StaffManagement />;
            case 'messaging':
                return <MessagingEmployees />;
            case 'attendance':
                return <AttendanceTracking />;
            case 'bookings':
                return <BookingManagement />;
            case 'products':
                return <ProductServiceManagement />;
            case 'orders':
                return <OrderManagement />;
            case 'tasks':
                return <TaskManagement />;
            case 'password-vault':
                return <PasswordVaultManagement />;
            case 'salaries':
                return <SalaryManagement />;
            case 'dashboard':
            default:
                return (
                    <div className="space-y-8">
                        {stats && <StatsCards stats={stats} onCardClick={handleCardClick} />}
                        <ManagementGrid onModuleClick={handleModuleChange} />
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            currentModule={currentModule}
            onModuleChange={handleModuleChange}
            onNavigate={onNavigate}
        >
            <div className="space-y-8 px-4 sm:px-6 lg:px-8">
                {/* Hero */}
                <div className="rounded-3xl border border-emerald-100/70 dark:border-emerald-900/40 bg-white/80 dark:bg-gray-900/70 backdrop-blur p-6 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">{t('admin.control', 'Admin Control')}</p>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">{t('admin.welcome', 'Welcome back, {{name}}!', { name: user?.name || '' })}</h1>
                            <p className="text-gray-600 dark:text-gray-300">{t('admin.subtitle', 'Monitor bookings, orders, staff activity, and payouts in real time.')}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
                                {t('admin.insights', 'Auto-updating insights')}
                            </div>
                            <div className="rounded-2xl bg-gray-900 text-white px-4 py-3 text-sm">
                                {t('admin.liveView', 'Live operational view')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
                        <div className="flex items-center justify-between gap-3">
                            <span>{error}</span>
                            <button
                                onClick={() => refresh()}
                                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Current Module Content */}
                {stats ? renderCurrentModule() : (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-4 text-amber-900 dark:text-amber-200">
                        Live stats are unavailable right now. Check backend/API connectivity and try again.
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminPage;
