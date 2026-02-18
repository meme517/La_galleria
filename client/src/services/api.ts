import axios from 'axios';
import { User, Stats, Staff, Booking, Order, Message, Attendance, MenuItem, Room } from '../types';
import { getAuthToken, forceLogout } from './authService';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export { api };

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors and trigger logout on auth failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (Unauthorized) and 403 (Forbidden) errors
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Authentication failed';
      
      if (status === 401 || status === 403) {
        // Token expired or invalid - force logout
        // Use a small delay to avoid navigation issues during render
        setTimeout(() => {
          forceLogout(
            status === 401 
              ? 'Your session has expired. Please log in again.' 
              : 'Access denied. Please log in again.',
            undefined // Navigation will be handled by App.jsx route guards
          );
        }, 100);
      }
    } else if (error.request && !error.response) {
      // Network error - don't logout, just log it
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API functions
export const apiService = {
  // Stats
  getStats: async (): Promise<Stats> => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Staff
  getStaff: async (): Promise<Staff[]> => {
    try {
      const response = await api.get('/admin/users?role=serviceProvider');
      const users = response.data.users || [];
      // Normalize id field for frontend consumers
      return users.map((u: any) => ({
        ...u,
        id: u.id || u._id,
      }));
    } catch (error) {
      // Do not fall back to mock data in production flows
      throw error;
    }
  },

  updateStaff: async (id: string, data: Partial<Staff>): Promise<Staff> => {
    try {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data.user;
    } catch (error) {
      throw error;
    }
  },

  createStaff: async (data: Partial<Staff> & { autoGeneratePassword?: boolean; sendCredentials?: boolean }): Promise<{ user: Staff; generatedPassword?: string }> => {
    try {
      const response = await api.post('/admin/users', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteStaff: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/users/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Bookings
  getBookings: async (): Promise<Booking[]> => {
    try {
      const response = await api.get('/bookings');
      const bookings = response.data || [];
      return bookings.map((b: any) => ({
        ...b,
        id: b.id || b._id,
        customer: b.customer ? { ...b.customer, id: b.customer.id || b.customer._id } : b.customer,
        room: b.room ? { ...b.room, id: b.room.id || b.room._id, number: b.room.number || b.room.roomNumber } : b.room
      }));
    } catch (error) {
      throw error;
    }
  },

  updateBooking: async (id: string, data: Partial<Booking>): Promise<Booking> => {
    try {
      const response = await api.put(`/bookings/${id}`, data);
      const b = response.data;
      return {
        ...b,
        id: b.id || b._id,
        customer: b.customer ? { ...b.customer, id: b.customer.id || b.customer._id } : b.customer,
        room: b.room ? { ...b.room, id: b.room.id || b.room._id, number: b.room.number || b.room.roomNumber } : b.room
      };
    } catch (error) {
      throw error;
    }
  },

  updateBookingStatus: async (id: string, status: Booking['status']): Promise<Booking> => {
    try {
      const response = await api.put(`/bookings/${id}`, { status });
      const b = response.data;
      return {
        ...b,
        id: b.id || b._id,
        customer: b.customer ? { ...b.customer, id: b.customer.id || b.customer._id } : b.customer,
        room: b.room ? { ...b.room, id: b.room.id || b.room._id, number: b.room.number || b.room.roomNumber } : b.room
      };
    } catch (error) {
      throw error;
    }
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    try {
      const response = await api.get('/orders');
      const payload = response.data || {};
      const orders = payload.orders || payload || [];
      return (orders as any[]).map((o: any) => ({
        ...o,
        id: o.id || o._id,
        customer: o.customer ? { ...o.customer, id: o.customer.id || o.customer._id } : o.customer,
        items: (o.items || []).map((it: any) => ({
          ...it,
          menuItem: it.menuItem ? { ...it.menuItem, id: it.menuItem.id || it.menuItem._id } : it.menuItem
        })),
        requestedTime: o.requestedTime || ''
      }));
    } catch (error) {
      throw error;
    }
  },

  updateOrder: async (id: string, data: Partial<Order>): Promise<Order> => {
    try {
      const response = await api.put(`/orders/${id}/status`, { status: data.status });
      const o = response.data.order || response.data;
      return {
        ...o,
        id: o.id || o._id,
        customer: o.customer ? { ...o.customer, id: o.customer.id || o.customer._id } : o.customer,
        items: (o.items || []).map((it: any) => ({
          ...it,
          menuItem: it.menuItem ? { ...it.menuItem, id: it.menuItem.id || it.menuItem._id } : it.menuItem
        })),
        requestedTime: o.requestedTime || ''
      };
    } catch (error) {
      throw error;
    }
  },

  // Messages
  getMessages: async (): Promise<Message[]> => {
    try {
      const response = await api.get('/admin/messages');
      const messages = response.data.messages || response.data || [];
      // Normalize id + recipient display
      return messages.map((m: any) => ({
        ...m,
        id: m.id || m._id,
        recipient: m.recipient?.name || m.recipient,
        sender: m.sender?.name || m.sender,
      }));
    } catch (error) {
      throw error;
    }
  },

  sendMessage: async (data: { recipientId: string; subject: string; content: string }): Promise<Message> => {
    try {
      const response = await api.post('/admin/messages', data);
      const msg = response.data.messageData || response.data;
      return {
        ...msg,
        id: msg.id || msg._id,
        recipient: msg.recipient?.name || msg.recipient,
        sender: msg.sender?.name || msg.sender,
      };
    } catch (error) {
      throw error;
    }
  },

  getReceivedMessages: async (): Promise<Message[]> => {
    try {
      const response = await api.get('/admin/messages/received');
      const messages = response.data.messages || response.data || [];
      return messages.map((m: any) => ({
        ...m,
        id: m.id || m._id,
        recipient: m.recipient?.name || m.recipient,
        sender: m.sender?.name || m.sender,
      }));
    } catch (error) {
      throw error;
    }
  },

  markMessageRead: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.put(`/admin/messages/${id}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Attendance
  getAttendance: async (): Promise<Attendance[]> => {
    try {
      const response = await api.get('/admin/attendance');
      const attendances = response.data.attendance || [];
      return attendances.map((a: any) => ({
        ...a,
        id: a.id || a._id,
        user: a.user ? { ...a.user, id: a.user.id || a.user._id } : a.user
      }));
    } catch (error) {
      throw error;
    }
  },

  // Admin: Schedule shift for service provider
  scheduleShift: async (shiftData: { userId: string; date: string; shiftStartTime: string; shiftEndTime: string; notes?: string }): Promise<{ message: string; attendance: any }> => {
    try {
      const response = await api.post('/attendance/schedule', shiftData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Update attendance record
  updateAttendance: async (id: string, data: Partial<Attendance>): Promise<{ message: string; attendance: any }> => {
    try {
      const response = await api.put(`/attendance/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Delete attendance record
  deleteAttendance: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/attendance/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Service Provider: Mark attendance (present/absent)
  markAttendance: async (attendanceData: { date: string; status: string; absenceReason?: string; actualStartTime?: string; actualEndTime?: string; notes?: string }): Promise<{ message: string; attendance: any }> => {
    try {
      const response = await api.post('/attendance/mark', attendanceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Service Provider: Start shift
  startShift: async (): Promise<{ message: string; attendance: any }> => {
    try {
      const response = await api.post('/attendance/start');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Service Provider: End shift
  endShift: async (): Promise<{ message: string; attendance: any }> => {
    try {
      const response = await api.post('/attendance/end');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAttendanceHistory: async (): Promise<any[]> => {
    try {
      const response = await api.get('/attendance/history');
      const attendances = response.data.attendance || [];
      return attendances.map((a: any) => ({
        ...a,
        id: a.id || a._id,
        user: a.user ? { ...a.user, id: a.user.id || a.user._id } : a.user
      }));
    } catch (error) {
      throw error;
    }
  },

  // Menu Items
  getMenuItems: async (): Promise<MenuItem[]> => {
    try {
      const response = await api.get('/menu');
      const payload = response.data || {};
      const items = payload.menuItems || payload || [];
      return items.map((m: any) => ({
        ...m,
        id: m.id || m._id
      }));
    } catch (error) {
      throw error;
    }
  },

  updateMenuItem: async (id: string, data: Partial<MenuItem>): Promise<MenuItem> => {
    try {
      const response = await api.put(`/menu/${id}`, data);
      const item = response.data.menuItem || response.data;
      return { ...item, id: item.id || item._id };
    } catch (error) {
      throw error;
    }
  },

  // Rooms
  getRooms: async (): Promise<Room[]> => {
    try {
      const response = await api.get('/rooms');
      const rooms = response.data.rooms || response.data || [];
      return rooms.map((r: any) => ({ ...r, id: r.id || r._id }));
    } catch (error) {
      throw error;
    }
  },

  updateRoom: async (id: string, data: Partial<Room>): Promise<Room> => {
    try {
      const response = await api.put(`/rooms/${id}`, data);
      const room = response.data.room || response.data;
      return { ...room, id: room.id || room._id };
    } catch (error) {
      throw error;
    }
  },

  // General Messages (for service providers)
  getUserMessages: async (): Promise<{ messages: Message[]; totalPages: number; currentPage: number }> => {
    try {
      const response = await api.get('/messages');
      const payload = response.data || {};
      const messages = (payload.messages || []).map((m: any) => ({
        ...m,
        id: m.id || m._id,
        sender: m.sender?.name || m.sender,
        recipient: m.recipient?.name || m.recipient,
      }));
      return {
        ...payload,
        messages,
      };
    } catch (error) {
      throw error;
    }
  },

  getUserSentMessages: async (): Promise<{ messages: Message[]; totalPages: number; currentPage: number }> => {
    try {
      const response = await api.get('/messages/sent');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markUserMessageRead: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.put(`/messages/${id}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteUserMessage: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/messages/${id}`);
    return response.data;
  },

  sendUserMessage: async (data: { recipientId: string; subject: string; content: string }): Promise<{ message: string; messageData: Message }> => {
    try {
      const response = await api.post('/messages', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Tasks
  getTasks: async (): Promise<any[]> => {
    try {
      const response = await api.get('/tasks');
      const tasks = response.data.tasks || [];
      return tasks.map((t: any) => ({
        ...t,
        id: t.id || t._id,
      }));
    } catch (error) {
      throw error;
    }
  },

  createTask: async (data: { assignedTo: string; title: string; description?: string; priority?: string; dueDate: string; dueTime?: string; notes?: string }): Promise<any> => {
    try {
      const response = await api.post('/tasks', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTaskStatus: async (id: string, status: string, completedNotes?: string): Promise<any> => {
    try {
      const response = await api.put(`/tasks/${id}/status`, { status, completedNotes });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTask: async (id: string, data: any): Promise<any> => {
    try {
      const response = await api.put(`/tasks/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (id: string): Promise<void> => {
    try {
      await api.delete(`/tasks/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Notifications
  getNotifications: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<{ notifications: any[]; totalPages: number; currentPage: number; unreadCount: number }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
      
      const response = await api.get(`/notifications?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markNotificationAsRead: async (id: string): Promise<{ message: string; notification: any }> => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAllNotificationsAsRead: async (): Promise<{ message: string }> => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteNotification: async (id: string): Promise<void> => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // Salaries
  getSalaryOverview: async (): Promise<any> => {
    const response = await api.get('/salaries');
    return response.data;
  },

  setSalary: async (userId: string, salary: number): Promise<any> => {
    const response = await api.put(`/salaries/${userId}`, { salary });
    return response.data;
  },

  recordSalaryPayment: async (userId: string, data: { amount?: number; paidAt?: string; notes?: string }): Promise<any> => {
    const response = await api.post(`/salaries/${userId}/pay`, data);
    return response.data;
  },

  getSalaryHistory: async (userId: string): Promise<any> => {
    const response = await api.get(`/salaries/${userId}/history`);
    return response.data;
  },

  getMySalaryHistory: async (): Promise<any> => {
    const response = await api.get('/salaries/my');
    return response.data;
  },

};
