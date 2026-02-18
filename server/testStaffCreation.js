const mongoose = require('mongoose');
const User = require('./models/User');
const PasswordVault = require('./models/PasswordVault');

// Test script to verify staff creation with password vault integration
async function testStaffCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/hotel-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Mock request object
    const mockReq = {
      body: {
        name: 'Test Staff Member',
        email: 'test.staff@hotel.com',
        role: 'serviceProvider',
        department: 'Restaurant',
        zones: ['Dining Room', 'Bar Area'],
        shiftPattern: 'morning',
        permissions: ['process_orders', 'manage_inventory'],
        status: 'active',
        autoGeneratePassword: true
      },
      user: {
        id: '507f1f77bcf86cd799439011' // Mock admin ID
      }
    };

    // Mock response object
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.responseData = data;
        console.log('Response:', JSON.stringify(data, null, 2));
        return this;
      }
    };

    // Import and call the createUser function
    const { createUser } = require('./controllers/adminController');

    console.log('Creating test staff member...');
    await createUser(mockReq, mockRes);

    // Check if user was created
    const createdUser = await User.findOne({ email: 'test.staff@hotel.com' });
    if (createdUser) {
      console.log('✅ User created successfully:', createdUser.name);

      // Check if password vault entry was created
      const vaultEntry = await PasswordVault.findOne({ username: 'test.staff@hotel.com' });
      if (vaultEntry) {
        console.log('✅ Password vault entry created successfully!');
        console.log('Title:', vaultEntry.title);
        console.log('Description:', vaultEntry.description);
        console.log('Tags:', vaultEntry.tags);
        console.log('Password length:', vaultEntry.password.length);
      } else {
        console.log('❌ Password vault entry NOT found!');
      }
    } else {
      console.log('❌ User creation failed!');
    }

    // Clean up test data
    await User.findOneAndDelete({ email: 'test.staff@hotel.com' });
    await PasswordVault.findOneAndDelete({ username: 'test.staff@hotel.com' });
    console.log('Test data cleaned up');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the test
testStaffCreation();
