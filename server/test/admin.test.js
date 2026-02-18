const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const mongoose = require('mongoose');

let adminToken;

describe('Admin API', function () {
  before(async function () {
    const uri = process.env.MONGO_URI_REST || process.env.MONGO_URI;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    // Use internal token helper to generate token (avoids shelling out)
    const { generateTokenForEmail } = require('../utils/tokenHelper');
    try {
      adminToken = await generateTokenForEmail('admin@example.com');
    } catch (err) {
      // fallback: create JWT manually
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'dev-secret-please-change';
      const User = require('../models/User');
      const admin = await User.findOne({ email: 'admin@example.com' });
      adminToken = jwt.sign({ id: admin._id.toString(), role: 'admin', email: admin.email }, secret, { expiresIn: '7d' });
    }
  });

  it('should return dashboard stats for admin', async function () {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).to.have.property('stats');
    expect(res.body.stats).to.have.property('users');
  });
});
