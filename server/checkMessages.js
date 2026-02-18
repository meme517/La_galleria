const mongoose = require('mongoose');
const Message = require('./models/Message');

async function checkMessages() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hotel-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const messages = await Message.find({})
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .sort({ createdAt: -1 });

    console.log('Total messages in DB:', messages.length);
    messages.forEach((msg, index) => {
      console.log(`${index + 1}. From: ${msg.sender.name} (${msg.sender.role}) To: ${msg.recipient.name} (${msg.recipient.role})`);
      console.log(`   Subject: ${msg.subject}`);
      console.log(`   Read: ${msg.read}`);
      console.log(`   Created: ${msg.createdAt}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMessages();
