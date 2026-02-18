const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-please-change';

/**
 * Generate (and create if missing) a JWT for the given email.
 * - If the user does not exist, creates an admin when the email contains "admin",
 *   otherwise creates a customer with a temporary password.
 * - Assumes a Mongoose connection is already established by the caller.
 * @param {string} email
 * @returns {Promise<string>} JWT token
 */
/**
 * generateTokenForEmail(email, role?)
 * If role is provided and user doesn't exist, the created user will use that role.
 */
async function generateTokenForEmail(email, roleHint) {
  if (!email) throw new Error('email required');

  let user = await User.findOne({ email });
  if (!user) {
    const role = roleHint || (email.toLowerCase().includes('admin') ? 'admin' : 'customer');
    const name = role === 'admin' ? 'Admin' : 'AutoUser';
    // create with a temporary password; bcrypt hashing is handled by User model pre-save if implemented
    user = await User.create({
      name,
      email,
      password: 'TempPass123!',
      role,
      department: role === 'serviceProvider' ? 'Restaurant' : undefined
    });
  }

  const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  return token;
}

module.exports = { generateTokenForEmail };
