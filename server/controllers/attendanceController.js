const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { createNotificationForRole } = require('../utils/notificationHelper');

// Admin: Schedule a shift for a service provider
const scheduleShift = async (req, res) => {
  try {
    const { userId, date, shiftStartTime, shiftEndTime, notes } = req.body;

    // Validate required fields
    if (!userId || !date || !shiftStartTime || !shiftEndTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists and is a service provider
    const user = await User.findById(userId);
    if (!user || user.role !== 'serviceProvider') {
      return res.status(400).json({ message: 'Invalid user or not a service provider' });
    }

    // Check if shift already exists for this user on this date
    const existingShift = await Attendance.findOne({
      user: userId,
      date: new Date(date)
    });

    if (existingShift) {
      return res.status(400).json({ message: 'Shift already scheduled for this date' });
    }

    const attendance = new Attendance({
      user: userId,
      date: new Date(date),
      shiftStartTime,
      shiftEndTime,
      status: 'scheduled',
      notes: notes || '',
      scheduledBy: req.user.id
    });

    await attendance.save();
    await attendance.populate('user', 'name email');
    await attendance.populate('scheduledBy', 'name email');

    res.status(201).json({
      message: 'Shift scheduled successfully',
      attendance
    });
  } catch (error) {
    console.error('Schedule shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Service Provider: Mark attendance (present/absent)
const markAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, status, absenceReason, actualStartTime, actualEndTime, notes } = req.body;

    // Find the scheduled shift for today
    const attendance = await Attendance.findOne({
      user: userId,
      date: new Date(date)
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No shift scheduled for this date' });
    }

    // Update attendance status
    attendance.status = status; // 'present', 'absent', or 'completed'
    if (status === 'absent' && absenceReason) {
      attendance.absenceReason = absenceReason;
    }
    if (actualStartTime) {
      attendance.actualStartTime = actualStartTime;
    }
    if (actualEndTime) {
      attendance.actualEndTime = actualEndTime;
    }
    if (notes) {
      attendance.notes = notes;
    }

    await attendance.save();
    await attendance.populate('user', 'name email');
    await attendance.populate('scheduledBy', 'name email');

    // Notify admins about attendance update
    await createNotificationForRole({
      title: 'Attendance Updated',
      message: `${attendance.user.name} marked ${status} for ${new Date(attendance.date).toLocaleDateString()}`,
      type: 'task',
      recipientRole: 'admin',
      relatedId: attendance._id,
      relatedType: 'attendance'
    });

    res.json({
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Service Provider: Start shift (record actual start time)
const startShift = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No shift scheduled for today' });
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    attendance.actualStartTime = currentTime;
    attendance.status = 'present';

    await attendance.save();
    await attendance.populate('user', 'name email');

    await createNotificationForRole({
      title: 'Shift Started',
      message: `${attendance.user.name} started their shift at ${currentTime}`,
      type: 'task',
      recipientRole: 'admin',
      relatedId: attendance._id,
      relatedType: 'attendance'
    });

    res.json({
      message: 'Shift started successfully',
      attendance
    });
  } catch (error) {
    console.error('Start shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Service Provider: End shift (record actual end time)
const endShift = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No shift scheduled for today' });
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    attendance.actualEndTime = currentTime;
    attendance.status = 'completed';

    await attendance.save();
    await attendance.populate('user', 'name email');

    await createNotificationForRole({
      title: 'Shift Completed',
      message: `${attendance.user.name} completed their shift at ${currentTime}`,
      type: 'task',
      recipientRole: 'admin',
      relatedId: attendance._id,
      relatedType: 'attendance'
    });

    res.json({
      message: 'Shift ended successfully',
      attendance
    });
  } catch (error) {
    console.error('End shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's attendance history
const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const attendance = await Attendance.find({ user: userId })
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email')
      .populate('scheduledBy', 'name email');

    const total = await Attendance.countDocuments({ user: userId });

    res.json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all attendance records
const getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, user, date, status } = req.query;

    let query = {};
    if (user) query.user = user;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }
    if (status) query.status = status;

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email role')
      .populate('scheduledBy', 'name email');

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update attendance record
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, absenceReason, notes, actualStartTime, actualEndTime } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (status) attendance.status = status;
    if (absenceReason !== undefined) attendance.absenceReason = absenceReason;
    if (notes !== undefined) attendance.notes = notes;
    if (actualStartTime !== undefined) attendance.actualStartTime = actualStartTime;
    if (actualEndTime !== undefined) attendance.actualEndTime = actualEndTime;

    await attendance.save();
    await attendance.populate('user', 'name email');
    await attendance.populate('scheduledBy', 'name email');

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete attendance record
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await Attendance.findByIdAndDelete(id);

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const json2csv = require('json2csv').Parser;

// Service Provider: Check in (backward compatibility - maps to startShift)
const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No shift scheduled for today' });
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    attendance.actualStartTime = currentTime;
    attendance.status = 'present';

    await attendance.save();
    await attendance.populate('user', 'name email');

    res.json({
      message: 'Checked in successfully',
      attendance
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Service Provider: Check out (backward compatibility - maps to endShift)
const checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No shift scheduled for today' });
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    attendance.actualEndTime = currentTime;
    attendance.status = 'completed';

    await attendance.save();
    await attendance.populate('user', 'name email');

    res.json({
      message: 'Checked out successfully',
      attendance
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Export attendance data to CSV
const exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate, user } = req.query;

    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (user) query.user = user;

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('user', 'name email role')
      .populate('scheduledBy', 'name email');

    const fields = [
      { label: 'User Name', value: 'user.name' },
      { label: 'User Email', value: 'user.email' },
      { label: 'Role', value: 'user.role' },
      { label: 'Date', value: 'date' },
      { label: 'Scheduled Start', value: 'shiftStartTime' },
      { label: 'Scheduled End', value: 'shiftEndTime' },
      { label: 'Actual Start', value: 'actualStartTime' },
      { label: 'Actual End', value: 'actualEndTime' },
      { label: 'Status', value: 'status' },
      { label: 'Absence Reason', value: 'absenceReason' },
      { label: 'Notes', value: 'notes' },
      { label: 'Scheduled By', value: 'scheduledBy.name' }
    ];

    const json2csvParser = new json2csv({ fields });
    const csv = json2csvParser.parse(attendance);

    res.header('Content-Type', 'text/csv');
    res.attachment('attendance_export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  scheduleShift,
  markAttendance,
  startShift,
  endShift,
  getAttendanceHistory,
  getAllAttendance,
  updateAttendance,
  deleteAttendance,
  exportAttendance,
  checkIn,
  checkOut
};
