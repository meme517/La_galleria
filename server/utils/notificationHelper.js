const Notification = require('../models/Notification');
const User = require('../models/User');
const { io } = require('../server');

/**
 * Create a notification and emit it via Socket.IO
 * @param {Object} options - Notification options
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} options.type - Notification type (order, booking, task, message, payment, system, alert)
 * @param {String} options.recipientRole - Role of recipient (admin, serviceProvider, customer)
 * @param {String} options.recipientId - User ID of recipient
 * @param {String} options.relatedId - Related entity ID (optional)
 * @param {String} options.relatedType - Related entity type (optional)
 */
const createNotification = async (options) => {
  try {
    const {
      title,
      message,
      type,
      recipientRole,
      recipientId,
      relatedId,
      relatedType
    } = options;

    // Validate required fields
    if (!title || !message || !type || !recipientRole || !recipientId) {
      console.error('Missing required notification fields');
      return null;
    }

    // Create notification
    const notification = new Notification({
      title,
      message,
      type,
      recipientRole,
      recipientId,
      relatedId,
      relatedType
    });

    await notification.save();

    // Emit real-time notification to specific user
    io.to(recipientId.toString()).emit('newNotification', {
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        recipientRole: notification.recipientRole,
        recipientId: notification.recipientId,
        relatedId: notification.relatedId,
        relatedType: notification.relatedType,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      }
    });

    // Also emit to role-based room for broadcast notifications
    io.to(`role:${recipientRole}`).emit('notificationUpdate', {
      type: 'new',
      notificationId: notification._id
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Create notifications for all users with a specific role
 * @param {Object} options - Notification options
 */
const createNotificationForRole = async (options) => {
  try {
    const {
      title,
      message,
      type,
      recipientRole,
      relatedId,
      relatedType
    } = options;

    // Find all users with the specified role
    const users = await User.find({ role: recipientRole, status: 'active' });

    // Create notification for each user
    const notifications = await Promise.all(
      users.map(user =>
        createNotification({
          title,
          message,
          type,
          recipientRole,
          recipientId: user._id,
          relatedId,
          relatedType
        })
      )
    );

    return notifications.filter(n => n !== null);
  } catch (error) {
    console.error('Error creating role-based notifications:', error);
    return [];
  }
};

module.exports = {
  createNotification,
  createNotificationForRole
};
