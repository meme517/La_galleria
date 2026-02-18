import { useState, useEffect, useRef } from 'react';
import Home from './pages/Home';
import CheckinPage from './pages/CheckinPage';
import BookingPage from './pages/BookingPage';
import OrdersPage from './pages/OrdersPage';
import ContactPage from './pages/ContactPage';
import BarMenuPage from './pages/BarMenuPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage.tsx';
import ServiceProviderPage from './pages/ServiceProviderPage.tsx';
import { getCurrentUser, isAuthenticated, getUserRole } from './services/authService';
import './App.css';
import { Loader } from './components/Loader';
import { applyTheme, getTheme } from './services/themeService';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const previousPageRef = useRef('home');
  const [showLoader, setShowLoader] = useState(true);

  // Check authentication and enforce route protection
  const checkAuthAndProtectRoutes = () => {
    const authenticated = isAuthenticated();
    const currentUser = getCurrentUser();
    const userRole = getUserRole();
    
    setUser(currentUser);

    // Define protected routes by role
    const protectedRoutes = {
      admin: ['admin'],
      serviceProvider: ['serviceProvider'],
      customer: ['booking', 'orders']
    };

    const allProtectedRoutes = ['admin', 'serviceProvider', 'booking', 'orders'];
    const publicRoutes = ['home', 'login', 'register', 'checkin'];

    // If not authenticated, redirect protected routes to login
    if (!authenticated || !currentUser) {
      if (allProtectedRoutes.includes(currentPage)) {
        setCurrentPage('login');
        return;
      }
    } else {
      // User is authenticated - check role-based access
      if (allProtectedRoutes.includes(currentPage)) {
        // Check if user has access to this route
        const hasAccess = 
          (currentPage === 'admin' && userRole === 'admin') ||
          (currentPage === 'serviceProvider' && userRole === 'serviceProvider') ||
          ((currentPage === 'booking' || currentPage === 'orders') && userRole === 'customer');

        if (!hasAccess) {
          // Redirect to appropriate page based on role
          if (userRole === 'admin') {
            setCurrentPage('admin');
          } else if (userRole === 'serviceProvider') {
            setCurrentPage('serviceProvider');
          } else if (userRole === 'customer') {
            setCurrentPage('home');
          } else {
            setCurrentPage('login');
          }
          return;
        }
      }

      // Redirect authenticated users away from login/register pages
      if ((currentPage === 'login' || currentPage === 'register') && authenticated) {
        if (userRole === 'customer') {
          setCurrentPage('home');
        } else if (userRole === 'admin') {
          setCurrentPage('admin');
        } else if (userRole === 'serviceProvider') {
          setCurrentPage('serviceProvider');
        }
      }
    }
  };

  // Check authentication on mount and when page changes
  useEffect(() => {
    if (showLoader) return;
    checkAuthAndProtectRoutes();
  }, [currentPage, showLoader]);

  // Apply persisted theme on startup
  useEffect(() => {
    try {
      applyTheme(getTheme());
    } catch (e) {
      // ignore theme errors
    }
  }, []);

  // Initial branded loader sequence
  useEffect(() => {
    // Always start on home when the app/site loads.
    setCurrentPage('home');
    window.history.replaceState({ page: 'home' }, '', window.location.pathname);

    const timeoutId = setTimeout(() => {
      setShowLoader(false);
      setCurrentPage('home');
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, []);
  // Listen for storage changes (logout in other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token' || e.key === 'logout_event') {
        // Re-check authentication state
        const authenticated = isAuthenticated();
        const currentUser = getCurrentUser();
        
        setUser(currentUser);

        // If logged out, redirect to appropriate page
        if (!authenticated) {
          const protectedRoutes = ['admin', 'serviceProvider', 'booking', 'orders'];
          if (protectedRoutes.includes(currentPage)) {
            setCurrentPage('login');
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom logout events
    window.addEventListener('logout', () => {
      checkAuthAndProtectRoutes();
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logout', handleStorageChange);
    };
  }, [currentPage]);

  // Prevent browser back button from accessing protected routes after logout
  useEffect(() => {
    const handlePopState = (e) => {
      // Check if we're trying to navigate to a protected route without auth
      const authenticated = isAuthenticated();
      const protectedRoutes = ['admin', 'serviceProvider', 'booking', 'orders'];
      
      // Get the intended page from history state or URL
      // Since we're using state-based routing, we check current state
      if (!authenticated && protectedRoutes.includes(currentPage)) {
        // Prevent back navigation to protected route
        e.preventDefault();
        setCurrentPage('login');
        // Push login page to history to prevent further back navigation
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Store current page in history state to track navigation
    window.history.replaceState({ page: currentPage }, '', window.location.pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentPage]);

  // Protected navigation wrapper
  const handleNavigate = (page) => {
    const authenticated = isAuthenticated();
    const currentUser = getCurrentUser();
    const userRole = getUserRole();

    // Public routes
    const publicRoutes = ['home', 'login', 'register', 'checkin'];

    if (publicRoutes.includes(page)) {
      previousPageRef.current = currentPage;
      setCurrentPage(page);
      return;
    }

    // Protected routes require authentication
    if (!authenticated || !currentUser) {
      previousPageRef.current = currentPage;
      setCurrentPage('login');
      return;
    }

    // Role-based access control
    if (page === 'admin' && userRole !== 'admin') {
      alert('Access denied. Admin access required.');
      return;
    }

    if (page === 'serviceProvider' && userRole !== 'serviceProvider') {
      alert('Access denied. Service Provider access required.');
      return;
    }

    if ((page === 'booking' || page === 'orders') && userRole !== 'customer') {
      alert('Access denied. Customer access required.');
      return;
    }

    // Store previous page for potential back navigation prevention
    previousPageRef.current = currentPage;
    setCurrentPage(page);
    
    // Update history state to track navigation
    window.history.pushState({ page }, '', window.location.pathname);
  };

  return (
    <>
      {showLoader && <Loader />}
      {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
      {currentPage === 'checkin' && <CheckinPage onNavigate={handleNavigate} />}
      {currentPage === 'booking' && <BookingPage onNavigate={handleNavigate} />}
      {currentPage === 'orders' && <OrdersPage onNavigate={handleNavigate} />}
      {currentPage === 'contact' && <ContactPage onNavigate={handleNavigate} />}
      {currentPage === 'bar-menu' && <BarMenuPage onNavigate={handleNavigate} />}
      {currentPage === 'events' && <EventsPage onNavigate={handleNavigate} />}
      {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}
      {currentPage === 'register' && <RegisterPage onNavigate={handleNavigate} />}
      {currentPage === 'admin' && <AdminPage onNavigate={handleNavigate} />}
      {currentPage === 'serviceProvider' && <ServiceProviderPage onNavigate={handleNavigate} />}
    </>
  );
}

export default App;





