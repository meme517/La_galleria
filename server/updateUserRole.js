require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function updateUserRole() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGO_URI_REST || 'mongodb://localhost:27017/reststay';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const email = 'uwedhiane@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Current user:', user.name, '-', user.email, '-', user.role);

    user.role = 'admin';
    await user.save();

    console.log('Updated user role to admin:', user.name, '-', user.email, '-', user.role);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateUserRole();
