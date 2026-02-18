const express = require('express');
const roomController = require('../controllers/roomController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Public routes (for customers to view available rooms)
router.get('/available', roomController.getAvailableRooms);

// All other routes require authentication
router.use(authenticateToken);

// Admin routes
router.post('/', authorizeRoles('admin'), roomController.createRoom);
router.get('/', authorizeRoles('admin'), roomController.getAllRooms);
router.put('/:id', authorizeRoles('admin'), roomController.updateRoom);
router.delete('/:id', authorizeRoles('admin'), roomController.deleteRoom);

// Shared routes
router.get('/:id', roomController.getRoom);

module.exports = router;
