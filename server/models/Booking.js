const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
    default: 'pending'
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  linkedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  specialRequests: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
bookingSchema.index({ customer: 1, checkInDate: 1 });
bookingSchema.index({ room: 1, checkInDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
