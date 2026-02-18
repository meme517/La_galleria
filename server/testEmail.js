#!/usr/bin/env node

/**
 * Email Testing Script
 *
 * Tests the email functionality by sending a test email.
 * Make sure your .env file has the correct EMAIL_* variables set.
 */

require('dotenv').config();
const { sendCredentialsEmail } = require('./utils/emailService');

async function testEmail() {
  try {
    console.log('🧪 Testing Email Configuration...\n');

    // Check if email config exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Email configuration not found in .env file.');
      console.log('Please run: node setupEmail.js');
      console.log('Or manually add these to your .env file:');
      console.log('EMAIL_HOST=smtp.gmail.com');
      console.log('EMAIL_PORT=587');
      console.log('EMAIL_USER=your-gmail@gmail.com');
      console.log('EMAIL_PASS=your-app-password');
      console.log('EMAIL_FROM_NAME=La galleria');
      process.exit(1);
    }

    console.log('📧 Sending test email...');
    console.log(`From: ${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`);
    console.log(`To: ${process.env.EMAIL_USER} (sending to yourself for testing)`);

    // Send a test email to yourself
    const result = await sendCredentialsEmail(
      process.env.EMAIL_USER, // Send to yourself
      'TestPass123!', // Test password
      'Test User', // Test name
      'serviceProvider' // Test role
    );

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
      console.log('\n📝 Next Steps:');
      console.log('1. Check your email inbox for the test message');
      console.log('2. If received, email integration is working!');
      console.log('3. Try creating a staff member in the admin panel to test real functionality');
    } else {
      console.log('❌ Failed to send test email');
    }

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your Gmail credentials are correct');
    console.log('2. Make sure you\'re using an App Password (not your regular password)');
    console.log('3. Check that 2FA is enabled on your Gmail account');
    console.log('4. Try running: node setupEmail.js again');
  }
}

testEmail();

