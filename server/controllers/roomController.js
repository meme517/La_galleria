const Room = require('../models/Room');

// Create new room
const createRoom = async (req, res) => {
  try {
    const { roomNumber, type, price, description, amenities, capacity } = req.body;

    // Check if room number already exists
    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const room = new Room({
      roomNumber,
      type,
      price,
      description,
      amenities,
      capacity
    });

    await room.save();

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all rooms
const getAllRooms = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, available } = req.query;

    let query = {};
    if (type) query.type = type;
    if (available !== undefined) query.available = available === 'true';

    const rooms = await Room.find(query)
      .sort({ roomNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Room.countDocuments(query);

    res.json({
      rooms,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get all rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single room
const getRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update room
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, type, price, description, amenities, capacity, available } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if new room number conflicts
    if (roomNumber && roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ roomNumber });
      if (existingRoom) {
        return res.status(400).json({ message: 'Room number already exists' });
      }
    }

    room.roomNumber = roomNumber || room.roomNumber;
    room.type = type || room.type;
    room.price = price !== undefined ? price : room.price;
    room.description = description || room.description;
    room.amenities = amenities || room.amenities;
    room.capacity = capacity || room.capacity;
    room.available = available !== undefined ? available : room.available;

    await room.save();

    res.json({
      message: 'Room updated successfully',
      room
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete room
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await Room.findByIdAndDelete(id);

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available rooms for booking
const getAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, type } = req.query;

    let query = { available: true };
    if (type) query.type = type;

    // TODO: Add booking conflict check based on dates
    // This would require checking against existing bookings

    const rooms = await Room.find(query).sort({ roomNumber: 1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createRoom,
  getAllRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms
};
