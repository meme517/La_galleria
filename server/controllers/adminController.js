const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PasswordVault = require('../models/PasswordVault');
const Attendance = require('../models/Attendance');
const DailyReport = require('../models/DailyReport');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const MenuItem = require('../models/MenuItem');
const Message = require('../models/Message');
const { sendCredentialsEmail } = require('../utils/emailService');
const { getAllAttendance } = require('./attendanceController');

// Create service provider or admin
const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      zones,
      shiftPattern,
      permissions,
      status,
      autoGeneratePassword,
      sendCredentials
    } = req.body;

    if (!['serviceProvider', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let finalPassword = password;

    // Auto-generate password if requested or for service providers
    if (role === 'serviceProvider' || autoGeneratePassword || !password) {
      if (role === 'serviceProvider') {
        // Generate password from name and email for service providers
        const namePart = name.split(' ')[0].toLowerCase();
        const emailPart = email.split('@')[0];
        finalPassword = namePart + emailPart + '123!';
      } else {
        finalPassword = Math.random().toString(36).slice(-12) + 'A1!'; // Generate secure password
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(finalPassword, salt);

    // Generate employee ID for service providers
    let employeeId = null;
    if (role === 'serviceProvider') {
      const lastUser = await User.findOne({ role: 'serviceProvider' }).sort({ employeeId: -1 });
      employeeId = lastUser && lastUser.employeeId ? lastUser.employeeId + 1 : 1001;
    }

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      plainPassword: role === 'serviceProvider' ? finalPassword : undefined,
      role,
      employeeId,
      department: role === 'serviceProvider' ? department : undefined,
      zones: role === 'serviceProvider' ? zones : [],
      shiftPattern: role === 'serviceProvider' ? shiftPattern : undefined,
      permissions: role === 'serviceProvider' ? permissions : [],
      status: status || 'active'
    });

    await user.save();

    // Automatically save generated password to PasswordVault for service providers
    if (role === 'serviceProvider' && finalPassword) {
      try {
        // Build comprehensive description with all staff details
        let description = `Staff Account: ${name}\n`;
        description += `Email: ${email}\n`;
        description += `Role: ${role}\n`;
        description += `Status: ${status || 'active'}\n`;

        if (department) description += `Department: ${department}\n`;
        if (zones && zones.length > 0) description += `Zones: ${zones.join(', ')}\n`;
        if (shiftPattern) description += `Shift Pattern: ${shiftPattern}\n`;
        if (permissions && permissions.length > 0) description += `Permissions: ${permissions.join(', ')}\n`;

        description += `Auto-generated password created on ${new Date().toLocaleDateString()}`;

        const passwordEntry = new PasswordVault({
          title: `${name} - ${department || 'Staff'} Account`,
          username: email,
          password: finalPassword,
          url: '', // Could add company website if available
          category: 'admin',
          description: description,
          tags: [
            'staff',
            'auto-generated',
            role,
            department || 'general',
            ...(zones || []),
            ...(permissions || [])
          ].filter(tag => tag), // Remove empty tags
          accessLevel: 'admin-only',
          createdBy: req.user.id,
          lastModifiedBy: req.user.id
        });
        await passwordEntry.save();
        console.log(`Comprehensive staff profile saved to vault for ${email}`);
      } catch (vaultError) {
        console.error('Failed to save password to vault:', vaultError);
        // Don't fail user creation if vault save fails
      }
    }

    // Send credentials via email if requested
    if (sendCredentials) {
      try {
        await sendCredentialsEmail(email, finalPassword, name, role);
        console.log(`Credentials email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send credentials email:', emailError);
        // Don't fail the user creation if email fails
      }
    }

    res.status(201).json({
      message: `${role} created successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        zones: user.zones,
        shiftPattern: user.shiftPattern,
        permissions: user.permissions,
        status: user.status
      },
      generatedPassword: role === 'serviceProvider' || autoGeneratePassword ? finalPassword : null
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;

    let query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Add plainPassword to service provider users for admin visibility
    const usersWithPasswords = users.map(user => {
      const userObj = user.toObject();
      if (user.role === 'serviceProvider') {
        userObj.plainPassword = user.plainPassword;
      }
      return userObj;
    });

    const total = await User.countDocuments(query);

    res.json({
      users: usersWithPasswords,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      department,
      zones,
      shiftPattern,
      permissions,
      status
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent changing own role
    if (id === req.user.id && user.role !== role) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.status = status || user.status;

    // Update work assignment fields for service providers
    if (role === 'serviceProvider' || user.role === 'serviceProvider') {
      user.department = department || user.department;
      user.zones = zones || user.zones;
      user.shiftPattern = shiftPattern || user.shiftPattern;
      user.permissions = permissions || user.permissions;
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        zones: user.zones,
        shiftPattern: user.shiftPattern,
        permissions: user.permissions,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalServiceProviders = await User.countDocuments({ role: 'serviceProvider' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const totalBookings = await Booking.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRooms = await Room.countDocuments();
    const totalMenuItems = await MenuItem.countDocuments();

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    // Recent reports
    const recentReports = await DailyReport.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    res.json({
      stats: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          serviceProviders: totalServiceProviders,
          admins: totalAdmins
        },
        business: {
          bookings: totalBookings,
          orders: totalOrders,
          rooms: totalRooms,
          menuItems: totalMenuItems
        },
        attendance: {
          today: todayAttendance
        }
      },
      recentReports
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get stats for dashboard cards
const getStats = async (req, res) => {
  try {
    // Current date calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Active bookings (checked-in + confirmed for today)
    const activeBookings = await Booking.countDocuments({
      $or: [
        { status: 'checked-in' },
        { status: 'confirmed', checkInDate: { $gte: today, $lt: tomorrow } }
      ]
    });

    // Yesterday's active bookings for comparison
    const yesterdayActiveBookings = await Booking.countDocuments({
      $or: [
        { status: 'checked-in' },
        { status: 'confirmed', checkInDate: { $gte: yesterday, $lt: today } }
      ]
    });

    // Orders today (created today, not cancelled)
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: today },
      status: { $ne: 'cancelled' }
    });

    // Yesterday's orders for comparison
    const yesterdayOrders = await Order.countDocuments({
      createdAt: { $gte: yesterday, $lt: today },
      status: { $ne: 'cancelled' }
    });

    // Revenue today (sum of completed orders today)
    const todayOrders = await Order.find({
      createdAt: { $gte: today },
      status: 'delivered'
    }).select('totalAmount');
    const revenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Yesterday's revenue for comparison
    const yesterdayOrderDocs = await Order.find({
      createdAt: { $gte: yesterday, $lt: today },
      status: 'delivered'
    }).select('totalAmount');
    const yesterdayRevenue = yesterdayOrderDocs.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Total users
    const totalUsers = await User.countDocuments();

    // Last week's users for comparison
    const lastWeekUsers = await User.countDocuments({
      createdAt: { $lt: lastWeek }
    });

    // Calculate trends
    const calculateTrend = (current, previous) => {
      if (previous === 0) return { percentage: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'neutral' };
      const change = ((current - previous) / previous) * 100;
      return {
        percentage: Math.abs(change),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
      };
    };

    const activeBookingsTrend = calculateTrend(activeBookings, yesterdayActiveBookings);
    const ordersTrend = calculateTrend(ordersToday, yesterdayOrders);
    const revenueTrend = calculateTrend(revenue, yesterdayRevenue);
    const usersTrend = calculateTrend(totalUsers, lastWeekUsers);

    res.json({
      activeBookings,
      ordersToday,
      revenue,
      totalUsers,
      trends: {
        activeBookings: {
          ...activeBookingsTrend,
          comparison: 'vs yesterday'
        },
        ordersToday: {
          ...ordersTrend,
          comparison: 'vs yesterday'
        },
        revenue: {
          ...revenueTrend,
          comparison: 'vs yesterday'
        },
        totalUsers: {
          ...usersTrend,
          comparison: 'vs last week'
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch live stats' });
  }
};

// Send message to user
const sendMessage = async (req, res) => {
  try {
    const { recipientId, subject, content } = req.body;

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const message = new Message({
      sender: req.user.id,
      recipient: recipientId,
      subject,
      content
    });

    await message.save();
    await message.populate('sender', 'name email');
    await message.populate('recipient', 'name email');

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get sent messages for admin
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const messages = await Message.find({ sender: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('recipient', 'name email');

    const total = await Message.countDocuments({ sender: req.user.id });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get received messages for admin (inbox)
const getReceivedMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const messages = await Message.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('sender', 'name email role');

    const total = await Message.countDocuments({ recipient: req.user.id });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get received messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark message as read
const markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findOne({
      _id: id,
      recipient: req.user.id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getDashboardStats,
  getStats,
  sendMessage,
  getMessages,
  getReceivedMessages,
  markMessageRead,
  getAllAttendance
};
