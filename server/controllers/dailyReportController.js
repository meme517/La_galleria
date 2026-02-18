const DailyReport = require('../models/DailyReport');

// Create or update a daily report for the authenticated service provider
const createOrUpdateReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, note, tasks = [], hoursWorked, performance } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    const existing = await DailyReport.findOne({ user: userId, date: reportDate });
    if (existing) {
      existing.note = note || existing.note;
      existing.tasks = tasks.length ? tasks : existing.tasks;
      existing.hoursWorked = hoursWorked !== undefined ? hoursWorked : existing.hoursWorked;
      existing.performance = performance || existing.performance;
      await existing.save();
      return res.json({ message: 'Report updated', report: existing });
    }

    const report = new DailyReport({ user: userId, date: reportDate, note, tasks, hoursWorked, performance });
    await report.save();
    res.status(201).json({ message: 'Report created', report });
  } catch (error) {
    console.error('Create/Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const reports = await DailyReport.find({ user: userId })
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await DailyReport.countDocuments({ user: userId });
    res.json({ reports, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin APIs
const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, user, date } = req.query;
    let query = {};
    if (user) query.user = user;
    if (date) {
      const d = new Date(date);
      d.setHours(0,0,0,0);
      const end = new Date(d);
      end.setHours(23,59,59,999);
      query.date = { $gte: d, $lte: end };
    }
    const reports = await DailyReport.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email');
    const total = await DailyReport.countDocuments(query);
    res.json({ reports, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await DailyReport.findById(id).populate('user', 'name email');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createOrUpdateReport, getMyReports, getAllReports, getReport };
