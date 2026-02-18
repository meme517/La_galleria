require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createTestStaff() {
  try {
    const uri = process.env.MONGO_URI_REST || process.env.MONGO_URI;
    if (!uri) {
      console.error('No DB URI found');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to database');

    // Create test service provider with all required fields
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
      process.exit(0);
    }

    // Generate password
    const namePart = testStaff.name.split(' ')[0].toLowerCase();
    const emailPart = testStaff.email.split('@')[0];
    const password = namePart + emailPart + '123!';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate employee ID
    const lastUser = await User.findOne({ role: 'serviceProvider' }).sort({ employeeId: -1 });
    const employeeId = lastUser && lastUser.employeeId ? lastUser.employeeId + 1 : 1001;

    // Create user
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

    console.log('Test staff created successfully:');
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Password:', password);
    console.log('- Department:', user.department);
    console.log('- Shift:', user.shiftPattern);
    console.log('- Zones:', user.zones.join(', '));

  } catch (error) {
    console.error('Error creating test staff:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

createTestStaff();
