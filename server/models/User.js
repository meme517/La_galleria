const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  plainPassword: { type: String }, // Plain text password for service providers
  role: { type: String, enum: ['customer', 'serviceProvider', 'admin'], default: 'customer' },
  employeeId: { type: String, unique: true, sparse: true }, // Auto-generated for service providers
  department: {
    type: String,
    enum: ['Restaurant', 'Bar', 'Reception', 'Housekeeping', 'Kitchen'],
    required: function() { return this.role === 'serviceProvider'; }
  },
  zones: [{ type: String }], // Specific work locations/areas
  shiftPattern: { type: String, enum: ['morning', 'afternoon', 'evening', 'night', 'flexible'] },
  permissions: [{
    type: String,
    enum: [
      'process_orders', 'check_in_guests', 'manage_bookings', 'manage_inventory',
      'view_reports', 'manage_staff', 'access_admin'
    ]
  }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastCheckIn: { type: Date },
  profile: { type: mongoose.Schema.Types.Mixed },
  salary: { type: Number, default: 0 }
}, {
  timestamps: true
});

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
