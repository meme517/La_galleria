const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  shiftStartTime: {
    type: String, // HH:MM format
    required: true
  },
  shiftEndTime: {
    type: String, // HH:MM format
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'present', 'absent', 'completed'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true
  },
  absenceReason: {
    type: String,
    trim: true
  },
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actualStartTime: {
    type: String // HH:MM format, when they actually started
  },
  actualEndTime: {
    type: String // HH:MM format, when they actually ended
  }
}, {
  timestamps: true
});

// Ensure one attendance per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
