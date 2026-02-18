const express = require('express');
const router = express.Router();
const {
  createPasswordEntry,
  getPasswordEntries,
  getPasswordEntry,
  getDecryptedPassword,
  updatePasswordEntry,
  deletePasswordEntry,
  getAccessLog
} = require('../controllers/passwordVaultController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create new password entry (admin only)
router.post('/', createPasswordEntry);

// Get all password entries (filtered by access level)
router.get('/', getPasswordEntries);

// Get specific password entry
router.get('/:id', getPasswordEntry);

// Get decrypted password (temporary access)
router.get('/:id/password', getDecryptedPassword);

// Update password entry (admin only)
router.put('/:id', updatePasswordEntry);

// Delete password entry (admin only)
router.delete('/:id', deletePasswordEntry);

// Get access log for entry (admin only)
router.get('/:id/access-log', getAccessLog);

module.exports = router;
