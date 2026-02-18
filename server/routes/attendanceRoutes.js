const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All attendance routes require authentication
router.use(authenticateToken);

// Service provider routes
router.post('/checkin', authorizeRoles('serviceProvider'), attendanceController.checkIn);
router.post('/checkout', authorizeRoles('serviceProvider'), attendanceController.checkOut);
router.post('/mark', authorizeRoles('serviceProvider'), attendanceController.markAttendance);
router.post('/start', authorizeRoles('serviceProvider'), attendanceController.startShift);
router.post('/end', authorizeRoles('serviceProvider'), attendanceController.endShift);
router.get('/history', authorizeRoles('serviceProvider'), attendanceController.getAttendanceHistory);

// Admin routes
router.post('/schedule', authorizeRoles('admin'), attendanceController.scheduleShift);
router.get('/all', authorizeRoles('admin'), attendanceController.getAllAttendance);
router.put('/:id', authorizeRoles('admin'), attendanceController.updateAttendance);
router.delete('/:id', authorizeRoles('admin'), attendanceController.deleteAttendance);
router.get('/export', authorizeRoles('admin'), attendanceController.exportAttendance);

module.exports = router;
