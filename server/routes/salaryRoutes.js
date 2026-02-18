const express = require('express');
const salaryController = require('../controllers/salaryController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Service provider routes
router.get('/my', authorizeRoles('serviceProvider'), salaryController.getMySalaryHistory);

// Admin routes
router.get('/', authorizeRoles('admin'), salaryController.getSalaryOverview);
router.put('/:userId', authorizeRoles('admin'), salaryController.setSalary);
router.post('/:userId/pay', authorizeRoles('admin'), salaryController.recordPayment);
router.get('/:userId/history', authorizeRoles('admin'), salaryController.getSalaryHistory);

module.exports = router;
