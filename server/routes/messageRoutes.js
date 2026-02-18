const express = require('express');
const messageController = require('../controllers/messageController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All message routes require authentication
router.use(authenticateToken);

// Send a message
router.post('/', messageController.sendMessage);

// Inbox
router.get('/', messageController.getMessages);

// Sent messages
router.get('/sent', messageController.getSentMessages);

// Mark as read
router.put('/:id/read', messageController.markMessageRead);

// Delete
router.delete('/:id', messageController.deleteMessage);

// Send department message (admin only)
router.post('/department', authorizeRoles('admin'), messageController.sendDepartmentMessage);

module.exports = router;
