export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'serviceProvider' | 'admin';
  createdAt?: string;
}

export interface Trend {
  percentage: number;
  direction: 'up' | 'down' | 'neutral';
  comparison: string; // e.g., "vs yesterday", "vs last week"
}

export interface Stats {
  activeBookings: number;
  ordersToday: number;
  revenue: number;
  totalUsers: number;
  trends: {
    activeBookings: Trend;
    ordersToday: Trend;
    revenue: Trend;
    totalUsers: Trend;
  };
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  salary?: number;
  employeeId?: string;
  department?: 'Restaurant' | 'Bar' | 'Reception' | 'Housekeeping' | 'Kitchen';
  zones?: string[];
  shiftPattern?: 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible';
  permissions?: string[];
  plainPassword?: string;
  lastCheckIn?: string;
}

export interface SalaryPayment {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  paidAt: string;
  recordedBy?: {
    id: string;
    name: string;
    email: string;
  };
  notes?: string;
  createdAt?: string;
}

export interface Booking {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  room: {
    id: string;
    number: string;
    type: string;
    price: number;
  };
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  phone: string;
  linkedOrders: string[];
  specialRequests?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  menuItem: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  linkedBookingId?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: number;
  deliveryAddress?: string;
  requestedTime?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Attendance {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  date: string;
  shiftStartTime: string;
  shiftEndTime: string;
  status: 'scheduled' | 'present' | 'absent' | 'completed';
  notes?: string;
  absenceReason?: string;
  scheduledBy?: {
    id: string;
    name: string;
    email: string;
  };
  actualStartTime?: string;
  actualEndTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  status: 'available' | 'occupied' | 'maintenance';
  price: number;
}
