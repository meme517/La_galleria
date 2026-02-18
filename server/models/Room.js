const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  name: { type: String },
  type: { type: String, enum: ['single', 'double', 'suite', 'deluxe'], default: 'single' },
  price: { type: Number, required: true, min: 0 },
  description: { type: String },
  amenities: [String],
  capacity: { type: Number, default: 1 },
  available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
