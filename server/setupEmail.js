#!/usr/bin/env node

/**
 * Email Configuration Setup Script
 *
 * This script helps you configure email settings for sending staff credentials.
 * It will guide you through setting up Gmail SMTP for sending emails.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupEmail() {
  console.log('🚀 Email Configuration Setup for La galleria System\n');
  console.log('This will help you configure email sending for staff credentials.\n');

  console.log('📧 Gmail Setup Instructions:');
  console.log('1. Go to your Gmail account settings');
  console.log('2. Enable 2-Factor Authentication if not already enabled');
  console.log('3. Go to Security > App passwords');
  console.log('4. Generate an app password for "Bar Restaurant Management"');
  console.log('5. Copy the 16-character password (ignore spaces)\n');

  const emailUser = await askQuestion('Enter your Gmail address (e.g., yourname@gmail.com): ');
  const emailPass = await askQuestion('Enter your Gmail App Password (16 characters, no spaces): ');
  const fromName = await askQuestion('Enter sender name (default: La galleria): ') || 'La galleria';

  // Read current .env file
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('No existing .env file found. Creating new one.');
  }

  // Update or add email configuration
  const emailConfig = `
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=${emailUser}
EMAIL_PASS=${emailPass}
EMAIL_FROM_NAME=${fromName}`.trim();

  // Check if email config already exists
  const emailConfigRegex = /^# Email Configuration[\s\S]*?(?=\n\n|\n#|\n$|$)/m;
  if (emailConfigRegex.test(envContent)) {
    // Replace existing email config
    envContent = envContent.replace(emailConfigRegex, emailConfig);
  } else {
    // Add email config at the end
    envContent = envContent.trim() + '\n\n' + emailConfig + '\n';
  }

  // Write back to .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Email configuration saved successfully!');
  console.log('\n📧 Configuration Summary:');
  console.log(`   From: ${fromName} <${emailUser}>`);
  console.log('   SMTP: smtp.gmail.com:587');
  console.log('\n🔧 Next Steps:');
  console.log('1. Restart your server: npm run dev');
  console.log('2. Test email sending by creating a new staff member');
  console.log('3. Check the console for success/failure messages');

  rl.close();
}

setupEmail().catch(console.error);

