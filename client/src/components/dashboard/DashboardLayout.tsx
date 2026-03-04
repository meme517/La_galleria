import React, { useState, useEffect } from 'react';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CalendarIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { logout } from '../../services/authService';
import { getTheme, toggleTheme } from '../../services/themeService';
import NotificationBell from '../shared/NotificationBell';
import { useLanguage } from '../../context/LanguageContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentModule?: string;
  onModuleChange?: (module: string) => void;
  onNavigate?: (page: string) => void;
}

export function DashboardLayout({ children, currentModule = 'dashboard', onModuleChange, onNavigate }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(getTheme());
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handler = () => setTheme(getTheme());
    window.addEventListener('theme-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('theme-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const navigationItems = [
    { id: 'dashboard', name: t('dashboard.dashboard', 'Dashboard'), icon: HomeIcon },
    { id: 'staff', name: t('dashboard.staff', 'Staff Management'), icon: UsersIcon },
    { id: 'messaging', name: t('dashboard.messaging', 'Messaging'), icon: ChatBubbleLeftRightIcon },
    { id: 'attendance', name: t('dashboard.attendance', 'Attendance'), icon: ClockIcon },
    { id: 'bookings', name: t('dashboard.bookings', 'Bookings'), icon: CalendarIcon },
    { id: 'products', name: t('dashboard.products', 'Products'), icon: CubeIcon },
    { id: 'orders', name: t('dashboard.orders', 'Orders'), icon: ClipboardDocumentListIcon },
    { id: 'salaries', name: t('dashboard.salaries', 'Salaries'), icon: BanknotesIcon },
    { id: 'password-vault', name: t('dashboard.passwordVault', 'Password Vault'), icon: ShieldCheckIcon },
  ];

  const handleLogout = () => {
    logout(onNavigate);
  };

  const handleModuleClick = (moduleId: string) => {
    onModuleChange?.(moduleId);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  return (
      <div className="flex flex-row min-h-screen w-100 bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 dark:text-gray-100">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </div>
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-r border-gray-200/60 dark:border-gray-800 shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-emerald-600 to-teal-600">
              <h1 className="text-xl font-bold text-white tracking-wide">La galleria Admin</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentModule === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleModuleClick(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                      ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900 border border-emerald-200 shadow-sm dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-100 dark:border-emerald-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                      }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            {/* Bottom section */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                {t('nav.logout', 'Logout')}
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top navigation */}
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200/60 dark:border-gray-800">
            <div className="flex items-center h-16 px-4 sm:px-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              <div className="flex-1" />
              <div className="flex items-center flex-wrap gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2 py-1 rounded-lg text-sm bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 border border-gray-200/60 dark:border-gray-700"
                  aria-label="Language"
                  title="Language"
                >
                  <option value="en">{t('lang.english', 'English')}</option>
                  <option value="rw">{t('lang.kinyarwanda', 'Kinyarwanda')}</option>
                </select>
                <button
                  onClick={() => setTheme(toggleTheme())}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>

                <button
                  onClick={() => onNavigate?.('home')}
                  className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium"
                >
                  {t('nav.viewPublicSite', 'View Public Site')}
                </button>

                <NotificationBell onNavigate={onNavigate} />
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1">
            <div className="py-6">
              <div className="w-full px-0">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
  );
}

