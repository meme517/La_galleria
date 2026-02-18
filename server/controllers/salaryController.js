const User = require('../models/User');
const SalaryPayment = require('../models/SalaryPayment');
const { createNotification } = require('../utils/notificationHelper');

const getSalaryOverview = async (req, res) => {
  try {
    const staff = await User.find({ role: 'serviceProvider' }).select('name email department salary status');
    const staffIds = staff.map(s => s._id);

    const payments = await SalaryPayment.find({ user: { $in: staffIds } })
      .sort({ paidAt: -1 })
      .populate('recordedBy', 'name email');

    const latestByUser = new Map();
    for (const p of payments) {
      if (!latestByUser.has(p.user.toString())) {
        latestByUser.set(p.user.toString(), p);
      }
    }

    const overview = staff.map(s => {
      const lastPayment = latestByUser.get(s._id.toString());
      return {
        id: s._id,
        name: s.name,
        email: s.email,
        department: s.department,
        status: s.status,
        salary: s.salary || 0,
        lastPayment: lastPayment ? {
          amount: lastPayment.amount,
          paidAt: lastPayment.paidAt,
          recordedBy: lastPayment.recordedBy
        } : null
      };
    });

    res.json({ staff: overview });
  } catch (error) {
    console.error('Get salary overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const setSalary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { salary } = req.body;

    if (salary === undefined || salary === null || Number.isNaN(Number(salary))) {
      return res.status(400).json({ message: 'Valid salary is required' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'serviceProvider') {
      return res.status(404).json({ message: 'Service provider not found' });
    }

    user.salary = Number(salary);
    await user.save();

    res.json({
      message: 'Salary updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        salary: user.salary
      }
    });
  } catch (error) {
    console.error('Set salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, paidAt, notes } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'serviceProvider') {
      return res.status(404).json({ message: 'Service provider not found' });
    }

    const paymentAmount = amount !== undefined && amount !== null ? Number(amount) : Number(user.salary || 0);
    if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const paymentDate = paidAt ? new Date(paidAt) : new Date();
    if (Number.isNaN(paymentDate.getTime())) {
      return res.status(400).json({ message: 'Valid payment date is required' });
    }

    const payment = new SalaryPayment({
      user: user._id,
      amount: paymentAmount,
      paidAt: paymentDate,
      recordedBy: req.user.id,
      notes: notes || ''
    });
    await payment.save();

    await createNotification({
      title: 'Salary Payment Received',
      message: `A salary payment of $${paymentAmount.toFixed(2)} was recorded for you.`,
      type: 'payment',
      recipientRole: 'serviceProvider',
      recipientId: user._id,
      relatedId: payment._id,
      relatedType: 'payment'
    });

    res.status(201).json({
      message: 'Payment recorded',
      payment
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSalaryHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await SalaryPayment.find({ user: userId })
      .sort({ paidAt: -1 })
      .populate('recordedBy', 'name email');

    res.json({ payments });
  } catch (error) {
    console.error('Get salary history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMySalaryHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('salary name email');
    const payments = await SalaryPayment.find({ user: userId })
      .sort({ paidAt: -1 })
      .populate('recordedBy', 'name email');

    res.json({
      salary: user?.salary || 0,
      payments
    });
  } catch (error) {
    console.error('Get my salary history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSalaryOverview,
  setSalary,
  recordPayment,
  getSalaryHistory,
  getMySalaryHistory
};
