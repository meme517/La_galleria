const mongoose = require('mongoose');
require('dotenv').config();

async function seedAttendance() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const Attendance = require('./models/Attendance');
    const User = require('./models/User');

    // Clear existing attendance data
    await Attendance.deleteMany({});
    console.log('Cleared existing attendance records');

    // Get admin user for scheduling
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found. Please create an admin first.');
      return;
    }

    // Get service providers
    const serviceProviders = await User.find({ role: 'serviceProvider' });
    if (serviceProviders.length === 0) {
      console.log('No service providers found. Please create some service providers first.');
      return;
    }

    // Create records for December 31, 2025 (the date shown in admin dashboard)
    const targetDate = new Date('2025-12-31');
    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const attendanceData = [];

    // Create attendance records for the target date (12/31/2025)
    for (const provider of serviceProviders.slice(0, 4)) { // Use first 4 providers
      // Yesterday's attendance - completed
      attendanceData.push({
        user: provider._id,
        date: yesterday,
        shiftStartTime: '09:00',
        shiftEndTime: '17:00',
        status: 'completed',
        actualStartTime: '09:15',
        actualEndTime: '17:30',
        notes: 'Completed shift successfully',
        scheduledBy: admin._id
      });

      // Target date attendance - mix of statuses
      const statuses = ['scheduled', 'present', 'completed', 'absent'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const record = {
        user: provider._id,
        date: targetDate,
        shiftStartTime: '08:30',
        shiftEndTime: '16:30',
        status: status,
        scheduledBy: admin._id
      };

      if (status === 'present') {
        record.actualStartTime = '08:45';
        record.notes = 'Currently working';
      } else if (status === 'completed') {
        record.actualStartTime = '08:30';
        record.actualEndTime = '16:45';
        record.notes = 'Shift completed successfully';
      } else if (status === 'absent') {
        record.absenceReason = 'sick';
        record.notes = 'Called in sick';
      } else {
        record.notes = 'Morning shift scheduled';
      }

      attendanceData.push(record);
    }

    await Attendance.insertMany(attendanceData);
    console.log(`Created ${attendanceData.length} attendance records`);

    // Show created records
    const records = await Attendance.find().populate('user', 'name email').populate('scheduledBy', 'name');
    console.log('Created records:');
    records.forEach(record => {
      console.log(`- ${record.user.name}: ${record.date.toISOString().split('T')[0]} - ${record.status} - Start: ${record.actualStartTime || 'N/A'} - End: ${record.actualEndTime || 'N/A'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding attendance:', error);
    process.exit(1);
  }
}

seedAttendance();
