const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// User management
router.post('/users', adminController.createUser);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);
router.get('/stats', adminController.getStats);

// Messaging
router.post('/messages', adminController.sendMessage);
router.get('/messages', adminController.getMessages);
router.get('/messages/received', adminController.getReceivedMessages);
router.put('/messages/:id/read', adminController.markMessageRead);

// Attendance
router.get('/attendance', adminController.getAllAttendance);

module.exports = router;
