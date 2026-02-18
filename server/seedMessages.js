const mongoose = require('mongoose');
const Message = require('./models/Message');
const User = require('./models/User');

async function seedMessages() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotel-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Find admin and service provider users
    const admin = await User.findOne({ role: 'admin' });
    const serviceProvider = await User.findOne({ role: 'serviceProvider' });

    if (!admin || !serviceProvider) {
      console.log('Admin or service provider not found. Please create users first.');
      process.exit(1);
    }

    // Create test messages
    const messages = [
      {
        sender: admin._id,
        recipient: serviceProvider._id,
        subject: 'Welcome to the Team',
        content: 'Welcome to our hotel management team! Please check your schedule for today.',
        read: false
      },
      {
        sender: admin._id,
        recipient: serviceProvider._id,
        subject: 'Schedule Update',
        content: 'Your shift has been updated. Please check the attendance section for details.',
        read: false
      },
      {
        sender: admin._id,
        recipient: serviceProvider._id,
        subject: 'Training Reminder',
        content: 'Don\'t forget about the safety training session tomorrow at 9 AM.',
        read: true
      }
    ];

    await Message.insertMany(messages);

    console.log(`Successfully seeded ${messages.length} test messages for service provider: ${serviceProvider.name}`);

    // Check total messages
    const totalMessages = await Message.countDocuments({ recipient: serviceProvider._id });
    console.log(`Total messages for service provider: ${totalMessages}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding messages:', error);
    process.exit(1);
  }
}

seedMessages();
