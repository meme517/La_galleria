const mongoose = require('mongoose');

const salaryPaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paidAt: {
    type: Date,
    required: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

salaryPaymentSchema.index({ user: 1, paidAt: -1 });

module.exports = mongoose.model('SalaryPayment', salaryPaymentSchema);
