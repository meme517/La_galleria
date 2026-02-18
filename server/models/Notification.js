const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['order', 'booking', 'task', 'message', 'payment', 'system', 'alert'],
    required: true
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'serviceProvider', 'customer'],
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    // Can reference Order, Booking, Task, Message, etc.
  },
  relatedType: {
    type: String,
    enum: ['order', 'booking', 'task', 'message', 'payment']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientRole: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
