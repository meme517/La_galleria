const mongoose = require('mongoose');
require('dotenv').config();

async function checkAttendance() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const Attendance = require('./models/Attendance');
    const count = await Attendance.countDocuments();
    console.log('Total attendance records:', count);

    const recent = await Attendance.find()
      .sort({ date: -1 })
      .limit(5)
      .populate('user', 'name email');

    console.log('Recent records:');
    recent.forEach(r => {
      console.log(`- ${r.user?.name || 'Unknown'}: ${r.date.toISOString().split('T')[0]} - Status: ${r.status} - Start: ${r.actualStartTime || 'N/A'} - End: ${r.actualEndTime || 'N/A'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAttendance();
