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

async function createTestStaff() {
  try {
    const mongoUri = process.env.MONGO_URI_REST || deriveRestUriFrom(process.env.MONGO_URI) || process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('No DB URI found. Please set MONGO_URI or MONGO_URI_REST in .env file');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to database successfully');

    // Create test service provider
    const testStaff = {
      name: 'John Smith',
      email: 'john.smith@example.com',
      role: 'serviceProvider',
      department: 'Housekeeping',
      zones: ['Guest Rooms', 'Public Areas'],
      shiftPattern: 'morning',
      permissions: ['manage_inventory', 'view_reports'],
      status: 'active'
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: testStaff.email });
    if (existingUser) {
      console.log('Test staff already exists:', existingUser.name);
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      if (existingUser.plainPassword) {
        console.log('Password:', existingUser.plainPassword);
      }
      process.exit(0);
    }

    // Generate password
    const namePart = testStaff.name.split(' ')[0].toLowerCase();
    const emailPart = testStaff.email.split('@')[0];
    const password = namePart + emailPart + '123!';

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate employee ID
    const lastUser = await User.findOne({ role: 'serviceProvider' }).sort({ employeeId: -1 });
    const employeeId = lastUser && lastUser.employeeId ? lastUser.employeeId + 1 : 1001;

    // Create user
    console.log('Creating user...');
    const user = new User({
      name: testStaff.name,
      email: testStaff.email,
      password: hashedPassword,
      plainPassword: password,
      role: testStaff.role,
      employeeId,
      department: testStaff.department,
      zones: testStaff.zones,
      shiftPattern: testStaff.shiftPattern,
      permissions: testStaff.permissions,
      status: testStaff.status
    });

    await user.save();

    console.log('✅ Test staff created successfully!');
    console.log('=====================================');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Password:', password);
    console.log('Department:', user.department);
    console.log('Shift:', user.shiftPattern);
    console.log('Zones:', user.zones.join(', '));
    console.log('=====================================');
    console.log('You can now log in with these credentials!');
    console.log('Select "Service Provider" on the login page.');

  } catch (error) {
    console.error('❌ Error creating test staff:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

createTestStaff();
