const Message = require('../models/Message');
const User = require('../models/User');
const { io } = require('../server');
const { createNotification } = require('../utils/notificationHelper');

// Send message
const sendMessage = async (req, res) => {
  try {
    const { recipientId, subject, content } = req.body;

    const message = new Message({
      sender: req.user.id,
      recipient: recipientId,
      subject,
      content
    });

    await message.save();
    await message.populate('sender', 'name email');
    await message.populate('recipient', 'name email role');

    // Emit real-time event to recipient (by user ID)
    io.to(recipientId.toString()).emit('newMessage', {
      message: {
        id: message._id,
        sender: message.sender.name,
        recipient: message.recipient.name,
        subject: message.subject,
        content: message.content,
        read: message.read,
        createdAt: message.createdAt
      },
      notification: `New message from ${message.sender.name}`
    });

    // Create notification for recipient
    await createNotification({
      title: 'New Message',
      message: `You have a new message from ${message.sender.name}: ${message.subject}`,
      type: 'message',
      recipientRole: message.recipient.role,
      recipientId: message.recipient._id,
      relatedId: message._id,
      relatedType: 'message'
    });

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get messages for user
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const messages = await Message.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('sender', 'name email');

    const total = await Message.countDocuments({ recipient: req.user.id });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get sent messages
const getSentMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const messages = await Message.find({ sender: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('recipient', 'name email');

    const total = await Message.countDocuments({ sender: req.user.id });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark message as read
const markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findOne({
      _id: id,
      recipient: req.user.id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findOne({
      _id: id,
      $or: [{ sender: req.user.id }, { recipient: req.user.id }]
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await Message.findByIdAndDelete(id);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send department message (admin only)
const sendDepartmentMessage = async (req, res) => {
  try {
    const { department, subject, content } = req.body;

    // Find all users in the specified department
    const recipients = await User.find({ department });

    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No users found in this department' });
    }

    // Create messages for each recipient
    const messages = recipients.map(recipient => ({
      sender: req.user.id,
      recipient: recipient._id,
      subject,
      content
    }));

    await Message.insertMany(messages);

    res.status(201).json({
      message: `Message sent to ${recipients.length} users in ${department} department`
    });
  } catch (error) {
    console.error('Send department message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getSentMessages,
  markMessageRead,
  deleteMessage,
  sendDepartmentMessage
};
