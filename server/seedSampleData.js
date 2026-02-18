/*
 Seed sample data:
 - 5 rooms (101..105)
 - 10 menu items
 - 2 service providers (service1@example.com, service2@example.com)
 - Attendance and daily reports for last 3 days for each service provider
 Usage:
   cd server
   node seedSampleData.js
*/
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Room = require('./models/Room');
const MenuItem = require('./models/MenuItem');
const Attendance = require('./models/Attendance');
const DailyReport = require('./models/DailyReport');

function deriveRestUriFrom(uri) {
  if (!uri) return null;
  const [main, query] = uri.split('?');
  const parts = main.split('/');
  const last = parts[parts.length - 1];
  if (!last || last.includes(':') || last.includes('@')) {
    const newMain = main.replace(/\/?$/, '/') + 'reststay';
    return query ? `${newMain}?${query}` : newMain;
  }
  parts[parts.length - 1] = 'reststay';
  const newMain = parts.join('/');
  return query ? `${newMain}?${query}` : newMain;
}

async function ensureServiceProvider(email, name, password) {
  let user = await User.findOne({ email });
  if (user) return user;
  const hashed = await bcrypt.hash(password, 10);
  user = new User({ name, email, password: hashed, role: 'serviceProvider' });
  await user.save();
  return user;
}

async function run() {
  const uri = process.env.MONGO_URI_REST || deriveRestUriFrom(process.env.MONGO_URI) || process.env.MONGO_URI;
  if (!uri) {
    console.error('No DB URI. Set MONGO_URI or MONGO_URI_REST in .env');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', uri);

  try {
    // Rooms
    const roomsData = [
      { roomNumber: '101', type: 'single', price: 59.99, capacity: 1 },
      { roomNumber: '102', type: 'double', price: 89.99, capacity: 2 },
      { roomNumber: '103', type: 'suite', price: 149.99, capacity: 4 },
      { roomNumber: '104', type: 'deluxe', price: 199.99, capacity: 3 },
      { roomNumber: '105', type: 'double', price: 99.99, capacity: 2 }
    ];

    for (const r of roomsData) {
      const exists = await Room.findOne({ roomNumber: r.roomNumber });
      if (!exists) {
        await Room.create(r);
        console.log('Created room', r.roomNumber);
      }
    }

    // Menu items
    const menuNames = [
      ['Burger', 'Juicy beef burger'],
      ['Fries', 'Crispy fries'],
      ['Steak', 'Grilled steak'],
      ['Salad', 'Fresh garden salad'],
      ['Pasta', 'Creamy alfredo pasta'],
      ['Pizza', 'Margherita pizza'],
      ['Coffee', 'Freshly brewed coffee'],
      ['Tea', 'Herbal tea'],
      ['Soda', 'Soft drink'],
      ['Cake', 'Chocolate cake']
    ];

    for (const [name, desc] of menuNames) {
      const exists = await MenuItem.findOne({ name });
      if (!exists) {
        await MenuItem.create({ name, description: desc, price: Math.round((5 + Math.random() * 20) * 100) / 100 });
        console.log('Created menu item', name);
      }
    }

    // Service providers
    const sp1 = await ensureServiceProvider('service1@example.com', 'Service Provider 1', 'Service123!');
    const sp2 = await ensureServiceProvider('service2@example.com', 'Service Provider 2', 'Service123!');
    console.log('Service providers ensured:', sp1.email, sp2.email);

    // Attendance & Daily reports for last 3 days
    const now = new Date();
    for (let d = 1; d <= 3; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() - d);
      day.setHours(0, 0, 0, 0);

      for (const sp of [sp1, sp2]) {
        // Attendance unique per user per day enforced by index; upsert behavior
        const start = new Date(day);
        start.setHours(9, 0, 0, 0);
        const end = new Date(day);
        end.setHours(17, 0, 0, 0);

        try {
          await Attendance.create({ user: sp._id, date: day, checkInTime: start, checkOutTime: end, status: 'present', notes: 'Auto-seeded attendance' });
          console.log('Attendance created for', sp.email, day.toISOString().slice(0,10));
        } catch (err) {
          if (err.code === 11000) {
            console.log('Attendance already exists for', sp.email, day.toISOString().slice(0,10));
          } else {
            console.error('Attendance error', err);
          }
        }

        // Daily report
        try {
          await DailyReport.create({ user: sp._id, date: day, note: `Worked on tasks for ${day.toISOString().slice(0,10)}`, tasks: ['opened bar', 'served guests'], hoursWorked: 8, performance: 'good' });
          console.log('Daily report created for', sp.email, day.toISOString().slice(0,10));
        } catch (err) {
          if (err.code === 11000) {
            console.log('Report already exists for', sp.email, day.toISOString().slice(0,10));
          } else {
            console.error('Report error', err);
          }
        }
      }
    }

    // Summary counts
    const roomsCount = await Room.countDocuments();
    const menuCount = await MenuItem.countDocuments();
    const spCount = await User.countDocuments({ role: 'serviceProvider' });
    const attendanceCount = await Attendance.countDocuments();
    const reportCount = await DailyReport.countDocuments();

    console.log('Seed summary:', { roomsCount, menuCount, spCount, attendanceCount, reportCount });
  } catch (err) {
    console.error('Seed error', err);
  } finally {
    await mongoose.disconnect();
    console.log('Seed finished');
  }
}

run().catch(err => { console.error(err); process.exit(1); });
