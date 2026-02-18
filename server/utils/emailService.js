const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send credentials email
const sendCredentialsEmail = async (email, password, name, role) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'La galleria'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Account Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to La galleria System</h2>
          <p>Dear ${name},</p>
          <p>Your account has been created successfully. Here are your login credentials:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Role:</strong> ${role}</p>
          </div>
          <p style="color: #d32f2f; font-weight: bold;">Important: Please change your password after first login for security reasons.</p>
          <p>If you have any questions, please contact your administrator.</p>
          <p>Best regards,<br>Management Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Credentials email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending credentials email:', error);
    throw new Error('Failed to send credentials email');
  }
};

// Send general notification email
const sendNotificationEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'La galleria'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw new Error('Failed to send notification email');
  }
};

module.exports = {
  sendCredentialsEmail,
  sendNotificationEmail
};

