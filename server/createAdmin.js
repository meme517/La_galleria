require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function run() {
  const uri = process.env.MONGO_URI_REST || (process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/[^/]+$/, '/reststay') : null) || process.env.MONGO_URI;
  if (!uri) {
    console.error('No DB URI. Set MONGO_URI or MONGO_URI_REST in .env');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  const email = 'admin@example.com';
  const password = 'Admin123!';
  const name = 'Initial Admin';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', existing._id.toString());
    await mongoose.disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const admin = new User({ name, email, password: hashed, role: 'admin' });
  await admin.save();
  console.log('Created admin:', admin._id.toString(), 'email:', email, 'password:', password);

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
