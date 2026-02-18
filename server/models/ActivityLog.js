const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'view']
  },
  resource: {
    type: String,
    required: true,
    enum: ['user', 'attendance', 'menu', 'room', 'booking', 'order', 'message', 'report']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  details: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, resource: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
