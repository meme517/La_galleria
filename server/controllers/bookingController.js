const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { createNotification, createNotificationForRole } = require('../utils/notificationHelper');

// Helper to parse date inputs
function parseDate(d) {
  const date = d ? new Date(d) : null;
  return isNaN(date) ? null : date;
}

// GET /api/bookings/ (admin/serviceProvider)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customer: { $type: 'objectId' },
      room: { $type: 'objectId' }
    })
      .populate('customer', 'name email')
      .populate('room', 'name number type price')
      .sort({ checkInDate: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    if (err && err.name === 'CastError') {
      return res.json([]);
    }
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/bookings/my-bookings (customer)
exports.getCustomerBookings = async (req, res) => {
  try {
    const customerId = req.user && req.user.id;
    if (!customerId) return res.status(401).json({ message: 'Authentication required' });
    const bookings = await Booking.find({ customer: customerId }).sort({ checkInDate: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching customer bookings:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/bookings/:id (shared)
exports.getBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid booking id' });
    const booking = await Booking.findById(id).populate('customer', 'name email').populate('room', 'name number type price');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // If customer role, ensure they own the booking
    if (req.user && req.user.role === 'customer' && booking.customer && booking.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(booking);
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/bookings/ (customer)
exports.createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const customerId = req.user && req.user.id;
    if (!customerId) return res.status(401).json({ message: 'Authentication required' });

    const { room, checkInDate, checkOutDate, numberOfGuests, phone, totalAmount, specialRequests } = req.body;
    const checkIn = parseDate(checkInDate);
    const checkOut = parseDate(checkOutDate);
    if (!checkIn || !checkOut) return res.status(400).json({ message: 'Invalid dates' });

    // Check overlapping booking for same room
    const overlapping = await Booking.findOne({
      room,
      $or: [
        { checkInDate: { $lt: checkOut, $gte: checkIn } },
        { checkOutDate: { $gt: checkIn, $lte: checkOut } },
        { $and: [{ checkInDate: { $lte: checkIn } }, { checkOutDate: { $gte: checkOut } }] }
      ]
    });
    if (overlapping) return res.status(409).json({ message: 'Room already booked for selected dates' });

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const booking = new Booking({
      customer: customerId,
      room,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests,
      phone,
      totalAmount: totalAmount || 0,
      specialRequests: specialRequests || ''
    });
    await booking.save();
    await booking.populate('customer', 'name email');
    await booking.populate('room', 'name number type price');

    // Notify admin about new booking
    await createNotificationForRole({
      title: 'New Booking Received',
      message: `New booking from ${booking.customer.name} - Room: ${booking.room.name || booking.room.number}, Check-in: ${new Date(booking.checkInDate).toLocaleDateString()}`,
      type: 'booking',
      recipientRole: 'admin',
      relatedId: booking._id,
      relatedType: 'booking'
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/bookings/:id/cancel (customer)
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid booking id' });

    const booking = await Booking.findById(id).populate('customer', 'name email').populate('room', 'name number type price');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.customer && booking.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    booking.status = 'cancelled';
    await booking.save();

    await createNotificationForRole({
      title: 'Booking Cancelled',
      message: `${booking.customer.name} cancelled a booking for ${booking.room.name || booking.room.number}.`,
      type: 'booking',
      recipientRole: 'admin',
      relatedId: booking._id,
      relatedType: 'booking'
    });

    res.json(booking);
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/bookings/:id (admin/serviceProvider)
exports.updateBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid booking id' });

  try {
    const update = {};
    const allowed = ['room', 'checkInDate', 'checkOutDate', 'numberOfGuests', 'totalAmount', 'specialRequests', 'status'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.checkInDate) update.checkInDate = parseDate(update.checkInDate);
    if (update.checkOutDate) update.checkOutDate = parseDate(update.checkOutDate);

    const booking = await Booking.findByIdAndUpdate(id, update, { new: true })
      .populate('customer', 'name email')
      .populate('room', 'name number type price');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Notify customer about booking update
    if (update.status) {
      await createNotification({
        title: 'Booking Status Updated',
        message: `Your booking status has been updated to: ${update.status}`,
        type: 'booking',
        recipientRole: 'customer',
        recipientId: booking.customer._id,
        relatedId: booking._id,
        relatedType: 'booking'
      });
    }

    res.json(booking);
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/bookings/:id (admin/serviceProvider)
exports.deleteBooking = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid booking id' });
  try {
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
