const express = require('express');
const taskController = require('../controllers/taskController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Admin: Create task
router.post('/', authorizeRoles('admin'), taskController.createTask);

// Get tasks (admin sees all, service provider sees assigned)
router.get('/', authorizeRoles('admin', 'serviceProvider'), taskController.getTasks);

// Get single task
router.get('/:id', authorizeRoles('admin', 'serviceProvider'), taskController.getTask);

// Service Provider: Update task status
router.put('/:id/status', authorizeRoles('serviceProvider', 'admin'), taskController.updateTaskStatus);

// Admin: Update task
router.put('/:id', authorizeRoles('admin'), taskController.updateTask);

// Admin: Delete task
router.delete('/:id', authorizeRoles('admin'), taskController.deleteTask);

module.exports = router;

