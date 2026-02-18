const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Customer routes
router.post('/', authorizeRoles('customer'), orderController.createOrder);
router.get('/my-orders', authorizeRoles('customer'), orderController.getCustomerOrders);

// Admin/Service provider routes
router.get('/', authorizeRoles('admin', 'serviceProvider'), orderController.getAllOrders);
router.put('/:id/status', authorizeRoles('admin', 'serviceProvider'), orderController.updateOrderStatus);

// Shared routes
router.get('/:id', orderController.getOrder);

module.exports = router;
