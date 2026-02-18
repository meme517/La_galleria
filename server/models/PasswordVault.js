const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const passwordVaultSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true }, // Will be encrypted
  url: { type: String, trim: true },
  category: {
    type: String,
    enum: ['admin', 'system', 'third-party', 'emergency', 'shared', 'other'],
    default: 'other'
  },
  description: { type: String, trim: true },
  tags: [{ type: String }],
  accessLevel: {
    type: String,
    enum: ['admin-only', 'managers', 'all-staff'],
    default: 'admin-only'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  accessLog: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accessedAt: { type: Date, default: Date.now },
    action: { type: String, enum: ['viewed', 'copied', 'modified'] }
  }]
}, {
  timestamps: true
});

// Encrypt password before saving
passwordVaultSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12); // Higher salt rounds for vault passwords
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to verify password
passwordVaultSchema.methods.verifyPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to log access
passwordVaultSchema.methods.logAccess = function(userId, action = 'viewed') {
  this.accessLog.push({
    user: userId,
    action: action
  });
  return this.save();
};

// Index for efficient queries
passwordVaultSchema.index({ category: 1, isActive: 1 });
passwordVaultSchema.index({ createdBy: 1 });
passwordVaultSchema.index({ accessLevel: 1 });

module.exports = mongoose.model('PasswordVault', passwordVaultSchema);
