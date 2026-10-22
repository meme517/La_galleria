const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// Register (for customers and admins)
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('securityWord').trim().isLength({ min: 3 }).withMessage('Security word must be at least 3 characters')
], authController.register);

// Forgot password (recover access using the account security word)
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('securityWord').trim().isLength({ min: 3 }).withMessage('Please enter your security word'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.forgotPassword);

// Login (for all roles)
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], authController.login);

// Logout (for all roles)
router.post('/logout', authController.logout);

module.exports = router;
