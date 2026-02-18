/**
 * Centralized authentication service
 * Handles login, logout, and authentication state management
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'serviceProvider' | 'admin';
}

const AUTH_STORAGE_KEY = 'user';
const TOKEN_STORAGE_KEY = 'token';

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Get current auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user = getCurrentUser();
  return !!(token && user);
};

/**
 * Get user role
 */
export const getUserRole = (): 'customer' | 'serviceProvider' | 'admin' | null => {
  const user = getCurrentUser();
  return user?.role || null;
};

/**
 * Clear all authentication data from storage
 */
const clearAuthData = (): void => {
  // Clear localStorage
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  
  // Clear sessionStorage (used for booking/order data)
  sessionStorage.removeItem('selectedMenuItem');
  sessionStorage.removeItem('selectedRoom');
  
  // Clear any other auth-related session data
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach(key => {
    if (key.startsWith('auth_') || key.startsWith('user_')) {
      sessionStorage.removeItem(key);
    }
  });
};

/**
 * Broadcast logout event to other tabs/windows
 */
const broadcastLogout = (): void => {
  try {
    // Set and immediately remove to trigger storage event in other tabs
    localStorage.setItem('logout_event', Date.now().toString());
    localStorage.removeItem('logout_event');
    
    // Also dispatch a custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent('logout'));
  } catch (error) {
    console.error('Error broadcasting logout event:', error);
  }
};

/**
 * Get role-based redirect path after logout
 */
const getLogoutRedirectPath = (role: 'customer' | 'serviceProvider' | 'admin' | null): string => {
  switch (role) {
    case 'customer':
      return 'home'; // Public homepage
    case 'serviceProvider':
      return 'login'; // Login page
    case 'admin':
      return 'login'; // Login page (could be 'admin-login' if separate)
    default:
      return 'home'; // Default to homepage
  }
};

/**
 * Comprehensive logout function
 * Clears all auth data, resets state, and redirects based on role
 * 
 * @param onNavigate - Navigation callback function
 * @param forceRedirect - Force redirect even if onNavigate is not provided
 */
export const logout = (
  onNavigate?: (page: string) => void,
  forceRedirect: boolean = true
): void => {
  // Get user role before clearing data
  const userRole = getUserRole();
  
  // Clear all authentication data
  clearAuthData();
  
  // Broadcast logout to other tabs/windows
  broadcastLogout();
  
  // Reset in-memory state by triggering a storage event
  // This helps components that listen to storage changes
  window.dispatchEvent(new StorageEvent('storage', {
    key: AUTH_STORAGE_KEY,
    oldValue: localStorage.getItem(AUTH_STORAGE_KEY),
    newValue: null,
    storageArea: localStorage
  }));
  
  // Determine redirect path based on role
  const redirectPath = getLogoutRedirectPath(userRole);
  
  // Navigate to appropriate page
  if (onNavigate) {
    onNavigate(redirectPath);
  } else if (forceRedirect) {
    // Fallback: use window.location if no navigation callback
    if (redirectPath === 'home') {
      window.location.href = '/';
    } else {
      window.location.href = `/${redirectPath}`;
    }
  }
  
  // Prevent browser back button from accessing protected pages
  // This is handled by the route guards in App.jsx, but we can also
  // add a history entry to make it harder to go back
  if (typeof window !== 'undefined' && window.history) {
    // Replace current history entry to prevent back navigation
    window.history.replaceState(null, '', window.location.pathname);
  }
};

/**
 * Handle forced logout (e.g., token expiration, role mismatch)
 */
export const forceLogout = (
  reason: string = 'Session expired',
  onNavigate?: (page: string) => void
): void => {
  console.warn('Forced logout:', reason);
  logout(onNavigate, true);
  
  // Optionally show a message to the user
  // This could be done via a toast notification system if available
  if (typeof window !== 'undefined') {
    // Small delay to ensure state is cleared before showing alert
    setTimeout(() => {
      alert(reason + '. Please log in again.');
    }, 100);
  }
};
