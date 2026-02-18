const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  note: { type: String, trim: true },
  tasks: [{ type: String }],
  hoursWorked: { type: Number, min: 0 },
  performance: { type: String, enum: ['excellent', 'good', 'average', 'poor'], default: 'good' }
}, {
  timestamps: true
});

// Ensure one report per user per day
dailyReportSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
