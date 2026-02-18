require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

function deriveRestUriFrom(uri) {
  if (!uri) return null;
  const [main, query] = uri.split('?');
  const parts = main.split('/');
  const last = parts[parts.length - 1];
  if (!last || last.includes(':') || last.includes('@')) {
    const newMain = main.replace(/\/?$/, '/') + 'reststay';
    return query ? `${newMain}?${query}` : newMain;
  }
  parts[parts.length - 1] = 'reststay';
  const newMain = parts.join('/');
  return query ? `${newMain}?${query}` : newMain;
}

async function createUsers() {
  try {
    const mongoUri = process.env.MONGO_URI_REST || deriveRestUriFrom(process.env.MONGO_URI) || process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('No DB URI found. Please set MONGO_URI or MONGO_URI_REST in .env file');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to database successfully');

    // Create admin user: TETERO NSANZE Arnold
    const adminData = {
      name: 'TETERO NSANZE Arnold',
      email: 'admin@lagalleria.com',
      role: 'admin',
      status: 'active'
    };

    let admin = await User.findOne({ email: adminData.email });
    if (!admin) {
      const password = 'admin123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      admin = new User({
        ...adminData,
        password: hashedPassword,
        plainPassword: password
      });

      await admin.save();
      console.log('✅ Admin created successfully!');
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Password:', password);
    } else {
      console.log('Admin already exists:', admin.name);
    }

    // Create service provider: murenzi
    const serviceProviderData = {
      name: 'murenzi',
      email: 'murenzi@lagalleria.com',
      role: 'serviceProvider',
      department: 'Restaurant',
      zones: ['Kitchen', 'Dining Area'],
      shiftPattern: 'morning',
      permissions: ['process_orders', 'manage_inventory'],
      status: 'active'
    };

    let serviceProvider = await User.findOne({ email: serviceProviderData.email });
    if (!serviceProvider) {
      const password = 'murenzi123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate employee ID
      const lastUser = await User.findOne({ role: 'serviceProvider' }).sort({ employeeId: -1 });
      const employeeId = lastUser && lastUser.employeeId ? lastUser.employeeId + 1 : 1001;

      serviceProvider = new User({
        ...serviceProviderData,
        password: hashedPassword,
        plainPassword: password,
        employeeId
      });

      await serviceProvider.save();
      console.log('✅ Service Provider created successfully!');
      console.log('Name:', serviceProvider.name);
      console.log('Email:', serviceProvider.email);
      console.log('Password:', password);
      console.log('Department:', serviceProvider.department);
      console.log('Employee ID:', serviceProvider.employeeId);
    } else {
      console.log('Service Provider already exists:', serviceProvider.name);
    }

    console.log('\n=====================================');
    console.log('Users created successfully!');
    console.log('=====================================');
    console.log('Admin: TETERO NSANZE Arnold');
    console.log('Email: admin@lagalleria.com');
    console.log('Password: admin123!');
    console.log('');
    console.log('Service Provider: murenzi');
    console.log('Email: murenzi@lagalleria.com');
    console.log('Password: murenzi123!');
    console.log('Department: Restaurant');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

createUsers();
