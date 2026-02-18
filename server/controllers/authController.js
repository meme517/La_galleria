const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper to sign token with id and role
function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// POST /api/auth/register (customers and admins)
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { name, email, password, role: requestedRole } = req.body;

    // Validate role - only allow customer and admin registration via public endpoint
    const allowedRoles = ['customer', 'admin'];
    const role = allowedRoles.includes(requestedRole) ? requestedRole : 'customer';

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashed, role });
    await user.save();

    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { email, password, role: requestedRole } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check if user is active
    if (user.status === 'inactive') return res.status(400).json({ message: 'Account is inactive' });

    // Validate role matches
    if (user.role !== requestedRole) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/logout
// Logout endpoint - invalidates the session on the server side
// Note: Since we're using stateless JWT tokens, we can't truly "invalidate" them
// on the server without maintaining a token blacklist. This endpoint serves as
// a signal that the client has logged out and can be used for logging/analytics.
exports.logout = async (req, res) => {
  try {
    // In a stateless JWT system, we can't invalidate tokens server-side
    // without maintaining a blacklist. However, we can:
    // 1. Log the logout event for analytics
    // 2. Return success to the client
    // 3. In a production system, you might want to implement token blacklisting
    
    // If you want to implement token blacklisting, you would:
    // - Store the token in a Redis cache or database with an expiration
    // - Check the blacklist in the authenticateToken middleware
    // - Remove from blacklist on logout
    
    // For now, we'll just return success
    // The client will handle clearing local storage
    
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
