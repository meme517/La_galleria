const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mood: {
    type: String,
    required: true,
    enum: ['happy', 'sad', 'neutral', 'excited', 'tired', 'anxious', 'calm', 'other']
  },
  energy: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  notes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Checkin', checkinSchema);
