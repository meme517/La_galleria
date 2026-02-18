const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

let serviceToken;
let serviceUserId;

describe('Attendance API', function () {
  before(async function () {
    const uri = process.env.MONGO_URI_REST || process.env.MONGO_URI;
    if (!mongoose.connection.readyState) {
      await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    // Ensure a service provider exists
    let sp = await User.findOne({ email: 'service1@example.com' });
    if (!sp) {
      sp = await User.create({
        name: 'SP Test',
        email: 'service1@example.com',
        password: 'irrelevant',
        role: 'serviceProvider',
        department: 'Restaurant'
      });
    }
    serviceUserId = sp._id.toString();

    // Generate a token using server's JWT secret (we'll create the token by calling login if password known)
    // For tests, create a temporary admin to generate token for this service user or rely on public token generator.
    // We'll bypass and use genToken helper if it exists (it prints token); but for stability, we'll call auth login if password is set.

    // Generate a token using our token helper (creates user with role if missing)
    const { generateTokenForEmail } = require('../utils/tokenHelper');
    serviceToken = await generateTokenForEmail('service1@example.com', 'serviceProvider');
  });

  it('should allow service provider to check in and out', async function () {
    // Ensure no existing attendance for today to avoid 400 from existing check-in
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    await Attendance.deleteMany({ user: serviceUserId, date: { $gte: todayStart, $lt: todayEnd } });

    // Create a scheduled shift for today so check-in can succeed
    await Attendance.create({
      user: serviceUserId,
      date: todayStart,
      shiftStartTime: '09:00',
      shiftEndTime: '17:00',
      status: 'scheduled',
      scheduledBy: serviceUserId
    });

    // Check-in with form data
    const checkInRes = await request(app)
      .post('/api/attendance/checkin')
      .set('Authorization', `Bearer ${serviceToken}`)
      .send({ status: 'present', notes: 'Arrived on time' })
      .expect(200);

    expect(checkInRes.body).to.have.property('message');
    expect(checkInRes.body.attendance).to.have.property('user');
    expect(checkInRes.body.attendance).to.have.property('status', 'present');

    // Check-out
    const checkOutRes = await request(app)
      .post('/api/attendance/checkout')
      .set('Authorization', `Bearer ${serviceToken}`)
      .expect(200);

    expect(checkOutRes.body).to.have.property('message');
    expect(checkOutRes.body.attendance).to.have.property('actualEndTime');
  });
});
