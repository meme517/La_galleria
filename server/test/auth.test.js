const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../server');
const mongoose = require('mongoose');

describe('Auth API', function () {
  before(function (done) {
    // ensure DB connected
    if (mongoose.connection.readyState) return done();
    mongoose.connection.once('open', done);
    mongoose.connect(process.env.MONGO_URI_REST || process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  });

  it('should register a new customer and login', async function () {
    const email = `testuser+${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email, password: 'TestPass123' })
      .expect(201);

    expect(registerRes.body).to.have.property('token');
    expect(registerRes.body.user).to.include({ email });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'TestPass123', role: 'customer' })
      .expect(200);

    expect(loginRes.body).to.have.property('token');
    expect(loginRes.body.user.email).to.equal(email);
  });
});
