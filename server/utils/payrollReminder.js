const Notification = require('../models/Notification');
const User = require('../models/User');
const { createNotification } = require('./notificationHelper');

const PAYROLL_TITLE = 'Payroll Reminder';

const getMonthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);

const shouldSendReminderToday = (date) => date.getDate() === 25;

const sendPayrollReminders = async () => {
  const now = new Date();
  if (!shouldSendReminderToday(now)) return;

  const monthStart = getMonthStart(now);
  const admins = await User.find({ role: 'admin', status: 'active' });

  for (const admin of admins) {
    const existing = await Notification.findOne({
      recipientId: admin._id,
      title: PAYROLL_TITLE,
      type: 'system',
      createdAt: { $gte: monthStart }
    });

    if (!existing) {
      await createNotification({
        title: PAYROLL_TITLE,
        message: 'Today is the 25th. Please process staff salary payments.',
        type: 'system',
        recipientRole: 'admin',
        recipientId: admin._id
      });
    }
  }
};

const startPayrollReminderScheduler = () => {
  // Run immediately on startup
  sendPayrollReminders().catch((err) => console.error('Payroll reminder error:', err));

  // Check every hour
  setInterval(() => {
    sendPayrollReminders().catch((err) => console.error('Payroll reminder error:', err));
  }, 60 * 60 * 1000);
};

module.exports = {
  startPayrollReminderScheduler
};
