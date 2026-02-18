const express = require('express');
const dailyReportController = require('../controllers/dailyReportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Service provider routes
router.post('/', authorizeRoles('serviceProvider'), dailyReportController.createOrUpdateReport);
router.get('/my-reports', authorizeRoles('serviceProvider'), dailyReportController.getMyReports);

// Admin routes
router.get('/all', authorizeRoles('admin'), dailyReportController.getAllReports);
router.get('/:id', authorizeRoles('admin'), dailyReportController.getReport);

module.exports = router;
