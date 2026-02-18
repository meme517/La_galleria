require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGO_URI_REST || 'mongodb://localhost:27017/reststay';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const users = await User.find({}).select('name email role status');
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`${user.name} - ${user.email} - ${user.role} - ${user.status}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
