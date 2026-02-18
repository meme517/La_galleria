const express = require('express');
const menuController = require('../controllers/menuController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Public routes (for customers to view menu)
router.get('/public', menuController.getPublicMenuItems);
router.get('/categories', menuController.getMenuByCategory);

// All other routes require authentication
router.use(authenticateToken);

// Admin routes
router.post('/', authorizeRoles('admin'), menuController.createMenuItem);
router.get('/', authorizeRoles('admin'), menuController.getAllMenuItems);
router.put('/:id', authorizeRoles('admin'), menuController.updateMenuItem);
router.delete('/:id', authorizeRoles('admin'), menuController.deleteMenuItem);

// Shared routes
router.get('/:id', menuController.getMenuItem);

module.exports = router;
