const PasswordVault = require('../models/PasswordVault');
const User = require('../models/User');

// Create new password entry
const createPasswordEntry = async (req, res) => {
  try {
    const {
      title,
      username,
      password,
      url,
      category,
      description,
      tags,
      accessLevel
    } = req.body;

    // Check if user is admin for admin-only entries
    if (accessLevel === 'admin-only' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create admin-only entries' });
    }

    const passwordEntry = new PasswordVault({
      title,
      username,
      password,
      url,
      category,
      description,
      tags: tags || [],
      accessLevel: accessLevel || 'admin-only',
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    });

    await passwordEntry.save();

    res.status(201).json({
      message: 'Password entry created successfully',
      entry: {
        _id: passwordEntry._id,
        title: passwordEntry.title,
        username: passwordEntry.username,
        category: passwordEntry.category,
        accessLevel: passwordEntry.accessLevel,
        createdAt: passwordEntry.createdAt
      }
    });
  } catch (error) {
    console.error('Create password entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all password entries (filtered by access level)
const getPasswordEntries = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, accessLevel } = req.query;

    let query = { isActive: true };

    // Filter by access level based on user role
    if (req.user.role === 'admin') {
      // Admins can see all entries
      if (accessLevel) query.accessLevel = accessLevel;
    } else if (req.user.role === 'serviceProvider') {
      // Service providers can only see 'all-staff' entries
      query.accessLevel = 'all-staff';
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (category) query.category = category;

    const entries = await PasswordVault.find(query)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password'); // Don't send encrypted passwords

    const total = await PasswordVault.countDocuments(query);

    res.json({
      entries,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get password entries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get specific password entry
const getPasswordEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await PasswordVault.findById(id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .select('-password'); // Don't send encrypted password

    if (!entry || !entry.isActive) {
      return res.status(404).json({ message: 'Password entry not found' });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && entry.accessLevel === 'admin-only') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ entry });
  } catch (error) {
    console.error('Get password entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get decrypted password (temporary access)
const getDecryptedPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await PasswordVault.findById(id);

    if (!entry || !entry.isActive) {
      return res.status(404).json({ message: 'Password entry not found' });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && entry.accessLevel === 'admin-only') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Log access
    await entry.logAccess(req.user.id, 'viewed');

    res.json({ password: entry.password });
  } catch (error) {
    console.error('Get decrypted password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update password entry
const updatePasswordEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      username,
      password,
      url,
      category,
      description,
      tags,
      accessLevel
    } = req.body;

    const entry = await PasswordVault.findById(id);

    if (!entry || !entry.isActive) {
      return res.status(404).json({ message: 'Password entry not found' });
    }

    // Only admins can update admin-only entries
    if (entry.accessLevel === 'admin-only' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update admin-only entries' });
    }

    // Update fields
    entry.title = title || entry.title;
    entry.username = username || entry.username;
    if (password) entry.password = password;
    entry.url = url !== undefined ? url : entry.url;
    entry.category = category || entry.category;
    entry.description = description !== undefined ? description : entry.description;
    entry.tags = tags || entry.tags;
    entry.accessLevel = accessLevel || entry.accessLevel;
    entry.lastModifiedBy = req.user.id;

    await entry.save();

    res.json({
      message: 'Password entry updated successfully',
      entry: {
        _id: entry._id,
        title: entry.title,
        username: entry.username,
        category: entry.category,
        accessLevel: entry.accessLevel,
        updatedAt: entry.updatedAt
      }
    });
  } catch (error) {
    console.error('Update password entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete password entry
const deletePasswordEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await PasswordVault.findById(id);

    if (!entry || !entry.isActive) {
      return res.status(404).json({ message: 'Password entry not found' });
    }

    // Only admins can delete admin-only entries
    if (entry.accessLevel === 'admin-only' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete admin-only entries' });
    }

    entry.isActive = false;
    entry.lastModifiedBy = req.user.id;
    await entry.save();

    res.json({ message: 'Password entry deleted successfully' });
  } catch (error) {
    console.error('Delete password entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get access log for entry
const getAccessLog = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await PasswordVault.findById(id)
      .populate('accessLog.user', 'name email');

    if (!entry || !entry.isActive) {
      return res.status(404).json({ message: 'Password entry not found' });
    }

    // Only admins can view access logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view access logs' });
    }

    res.json({ accessLog: entry.accessLog });
  } catch (error) {
    console.error('Get access log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPasswordEntry,
  getPasswordEntries,
  getPasswordEntry,
  getDecryptedPassword,
  updatePasswordEntry,
  deletePasswordEntry,
  getAccessLog
};
