import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCurrentUser, logout } from '../services/authService';
import { getTheme, toggleTheme } from '../services/themeService';
import { useLanguage } from '../context/LanguageContext';

const Navbar = ({ onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check authentication state
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    };

    // Check on mount
    checkAuth();

    // Listen for storage changes (logout in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom logout events
    window.addEventListener('logout', checkAuth);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logout', checkAuth);
    };
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
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: t('nav.home', 'Home'), href: '#home' },
    { name: t('nav.menu', 'Menu'), href: '#menu' },
    { name: t('nav.rooms', 'Rooms'), href: '#rooms' },
    { name: t('nav.about', 'About'), href: '#about' },
    { name: t('nav.contact', 'Contact'), action: 'contact' },
    { name: t('nav.barMenu', 'Bar Menu'), action: 'bar-menu' },
    { name: t('nav.events', 'Events'), action: 'events' },
    { name: t('nav.booking', 'Booking'), action: 'booking' },
    { name: t('nav.checkin', 'Check-in'), action: 'checkin' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.25, 0, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-white/95 dark:bg-gray-900/90 backdrop-blur-md shadow-lg py-3'
          : 'bg-transparent py-5'
        }`}
    >
      <div className="container mx-auto max-w-[1700px] px-4 sm:px-6 lg:px-8 overflow-x-hidden md:overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3 lg:gap-4 flex-nowrap min-w-max">
          <motion.a
            href="#home"
            className="text-2xl font-bold text-gray-900 dark:text-white shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-primary">La</span>
            <span className="text-gray-900 dark:text-white"> galleria</span>
          </motion.a>

          <div className="hidden md:flex items-center gap-3 lg:gap-4 whitespace-nowrap shrink-0 px-1 md:px-2 py-1">
            {navLinks.map((link) => (
              link.action ? (
                <motion.button
                  key={link.name}
                  onClick={() => onNavigate(link.action)}
                  className="text-xs lg:text-sm text-gray-700 dark:text-gray-200 hover:text-primary transition-colors font-medium whitespace-nowrap"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  {link.name}
                </motion.button>
              ) : (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className="text-xs lg:text-sm text-gray-700 dark:text-gray-200 hover:text-primary transition-colors font-medium whitespace-nowrap"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  {link.name}
                </motion.a>
              )
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0 whitespace-nowrap">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-28 lg:w-32 px-2 py-1 rounded-lg text-sm bg-white/60 dark:bg-gray-800/60 text-gray-800 dark:text-gray-100 border border-gray-200/60 dark:border-gray-700"
              aria-label="Language"
              title="Language"
            >
              <option value="en">{t('lang.english', 'English')}</option>
              <option value="rw">{t('lang.kinyarwanda', 'Kinyarwanda')}</option>
            </select>
            <motion.button
              onClick={() => setTheme(toggleTheme())}
              className="p-2 rounded-lg bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 transition-colors"
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
            {user ? (
              <>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium whitespace-nowrap max-w-[220px] truncate">{t('nav.welcome', 'Welcome, {{name}}', { name: user.name })}</span>
                {user.role === 'customer' && (
                  <>
                    <motion.button
                      onClick={() => onNavigate('booking')}
                      className="text-sm text-gray-700 dark:text-gray-200 hover:text-primary transition-colors font-medium whitespace-nowrap"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {t('nav.myBookings', 'My Bookings')}
                    </motion.button>
                    <motion.button
                      onClick={() => onNavigate('orders')}
                      className="text-sm text-gray-700 dark:text-gray-200 hover:text-primary transition-colors font-medium whitespace-nowrap"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {t('nav.myOrders', 'My Orders')}
                    </motion.button>
                  </>
                )}
                <motion.button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 lg:px-5 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(220, 38, 38, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('nav.logout', 'Logout')}
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  onClick={() => onNavigate('login')}
                  className="text-gray-700 dark:text-gray-200 hover:text-primary transition-colors font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('nav.login', 'Login')}
                </motion.button>
                <motion.button
                  onClick={() => onNavigate('register')}
                  className="bg-primary text-white px-4 lg:px-5 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors whitespace-nowrap"
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(217, 119, 6, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('nav.register', 'Register')}
                </motion.button>
              </>
            )}
          </div>

          <button
            className={`md:hidden ml-auto focus:outline-none transition-colors ${isMobileMenuOpen ? 'text-primary' : 'text-gray-900 dark:text-white'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-3 space-y-3 rounded-2xl border border-primary/30 bg-gray-950/95 backdrop-blur-xl shadow-2xl px-3 py-4 text-gray-100 max-h-[calc(100vh-6.5rem)] overflow-y-auto overscroll-contain touch-pan-y"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-200">{t('nav.themeToggle', 'Toggle theme')}</span>
              <button
                onClick={() => setTheme(toggleTheme())}
                className="px-3 py-2 rounded-lg bg-gray-900 text-gray-100 border border-primary/30 hover:bg-primary/20 transition-colors"
              >
                {theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-200">{t('lang.label', 'Language')}</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 rounded-lg bg-gray-900 text-gray-100 border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="en">{t('lang.english', 'English')}</option>
                <option value="rw">{t('lang.kinyarwanda', 'Kinyarwanda')}</option>
              </select>
            </div>
            {navLinks.map((link) => (
              link.action ? (
                <button
                  key={link.name}
                  onClick={() => {
                    onNavigate(link.action);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full rounded-lg px-2 py-1.5 text-gray-100 hover:text-primary hover:bg-white/5 transition-colors font-medium text-left"
                >
                  {link.name}
                </button>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="block w-full rounded-lg px-2 py-1.5 text-gray-100 hover:text-primary hover:bg-white/5 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              )
            ))}
            <div className="pt-4 border-t border-white/10 space-y-3">
              {user ? (
                <>
                  <div className="text-gray-100 font-medium mb-2">{t('nav.welcome', 'Welcome, {{name}}', { name: user.name })}</div>
                  {user.role === 'customer' && (
                    <>
                      <button
                        onClick={() => {
                          onNavigate('booking');
                          setIsMobileMenuOpen(false);
                        }}
                        className="block rounded-lg px-2 py-1.5 text-gray-100 hover:text-primary hover:bg-white/5 transition-colors font-medium text-left w-full"
                      >
                        {t('nav.myBookings', 'My Bookings')}
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('orders');
                          setIsMobileMenuOpen(false);
                        }}
                        className="block rounded-lg px-2 py-1.5 text-gray-100 hover:text-primary hover:bg-white/5 transition-colors font-medium text-left w-full"
                      >
                        {t('nav.myOrders', 'My Orders')}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                    }}
                    className="w-full bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    {t('nav.logout', 'Logout')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onNavigate('login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="block rounded-lg px-2 py-1.5 text-gray-100 hover:text-primary hover:bg-white/5 transition-colors font-medium text-left"
                  >
                    {t('nav.login', 'Login')}
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('register');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                  >
                    {t('nav.register', 'Register')}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;

