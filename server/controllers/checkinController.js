const Checkin = require('../models/Checkin');
const { validationResult } = require('express-validator');

// Get all checkins
exports.getAllCheckins = async (req, res) => {
  try {
    const checkins = await Checkin.find().sort({ date: -1 });
    res.json(checkins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new checkin
exports.createCheckin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, mood, energy, notes } = req.body;
    const newCheckin = new Checkin({
      date: date || new Date(),
      mood,
      energy,
      notes
    });

    const savedCheckin = await newCheckin.save();
    res.status(201).json(savedCheckin);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a checkin
exports.updateCheckin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { date, mood, energy, notes } = req.body;

    const updatedCheckin = await Checkin.findByIdAndUpdate(
      id,
      { date, mood, energy, notes },
      { new: true, runValidators: true }
    );

    if (!updatedCheckin) {
      return res.status(404).json({ message: 'Checkin not found' });
    }

    res.json(updatedCheckin);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a checkin
exports.deleteCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCheckin = await Checkin.findByIdAndDelete(id);

    if (!deletedCheckin) {
      return res.status(404).json({ message: 'Checkin not found' });
    }

    res.json({ message: 'Checkin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
