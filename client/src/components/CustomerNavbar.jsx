import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCurrentUser, logout } from '../services/authService';
import { getTheme, toggleTheme } from '../services/themeService';
import { useLanguage } from '../context/LanguageContext';

const CustomerNavbar = ({ onNavigate }) => {
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState('light');
    const { language, setLanguage, t } = useLanguage();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        setTheme(getTheme());
        const handler = () => setTheme(getTheme());
        window.addEventListener('theme-changed', handler);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener('theme-changed', handler);
            window.removeEventListener('storage', handler);
        };
    }, []);

    const handleLogout = () => {
        logout(onNavigate);
        setUser(null);
    };

    const navItems = [
        { name: t('nav.home', 'Home'), action: 'home', icon: '🏠' },
        { name: t('nav.barMenu', 'Bar Menu'), action: 'bar-menu', icon: '🍸' },
        { name: t('nav.myBookings', 'My Bookings'), action: 'booking', icon: '🏨' },
        { name: t('nav.myOrders', 'My Orders'), action: 'orders', icon: '🍽️' },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.25, 0, 1] }}
            className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center space-x-2"
                        whileHover={{ scale: 1.05 }}
                    >
                        <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">La</span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white"> galleria</span>
                    </motion.div>

                    {/* Navigation Items */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item, index) => (
                            <motion.button
                                key={item.name}
                                onClick={() => onNavigate(item.action)}
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.name}</span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="px-2 py-1 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                            aria-label="Language"
                            title="Language"
                        >
                            <option value="en">{t('lang.english', 'English')}</option>
                            <option value="rw">{t('lang.kinyarwanda', 'Kinyarwanda')}</option>
                        </select>
                        {/* Theme Toggle */}
                        <motion.button
                            onClick={() => setTheme(toggleTheme())}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label={t('nav.themeToggle', 'Toggle theme')}
                            title={t('nav.themeToggle', 'Toggle theme')}
                        >
                            {theme === 'dark' ? (
                                <svg className="w-5 h-5 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 2a.75.75 0 01.75.75V4a.75.75 0 01-1.5 0V2.75A.75.75 0 0110 2zm0 10a4 4 0 100-8 4 4 0 000 8zM4.22 4.22a.75.75 0 011.06 0L6.3 5.25a.75.75 0 11-1.06 1.06L4.22 5.28a.75.75 0 010-1.06zM2 10a.75.75 0 01.75-.75H4a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-gray-800 dark:text-gray-100" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                </svg>
                            )}
                        </motion.button>

                        {/* User Info & Logout */}
                        {user && (
                            <div className="flex items-center space-x-3">
                                <div className="hidden sm:block text-right">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {t('nav.welcome', 'Welcome, {{name}}', { name: user.name })}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                        {user.role}
                                    </div>
                                </div>
                                <motion.button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                                    whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(220, 38, 38, 0.3)' }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {t('nav.logout', 'Logout')}
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden pb-4">
                    <div className="flex flex-wrap gap-2">
                        {navItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => onNavigate(item.action)}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium text-sm"
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default CustomerNavbar;

