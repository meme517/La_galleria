/*
 Seed customers, bookings, and orders for testing.
 - Creates 3 customers (if missing)
 - Creates one booking per customer (non-destructive)
 - Creates one order per customer (with 1-2 items)
 Usage:
   cd server
   node seedCustomersOrdersBookings.js
*/
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Booking = require('./models/Booking');
const Order = require('./models/Order');
const Room = require('./models/Room');
const MenuItem = require('./models/MenuItem');

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

async function ensureCustomer(email, name, password) {
  let user = await User.findOne({ email });
  if (user) return user;
  const hashed = await bcrypt.hash(password, 10);
  user = new User({ name, email, password: hashed, role: 'customer' });
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
    // Load rooms and menu items
    const rooms = await Room.find().limit(10);
    const menuItems = await MenuItem.find().limit(20);
    if (rooms.length === 0 || menuItems.length === 0) {
      console.error('Rooms or menu items empty. Run seedSampleData first.');
      process.exit(1);
    }

    const customersData = [
      { email: 'alice@example.com', name: 'Alice', password: 'Customer123!' },
      { email: 'bob@example.com', name: 'Bob', password: 'Customer123!' },
      { email: 'carol@example.com', name: 'Carol', password: 'Customer123!' }
    ];

    const customers = [];
    for (const c of customersData) {
      const user = await ensureCustomer(c.email, c.name, c.password);
      customers.push(user);
      console.log('Ensured customer:', user.email);
    }

    // Create bookings: for each customer, create a booking if one doesn't exist for the same checkInDate
    const today = new Date();
    const bookingsCreated = [];
    for (let i = 0; i < customers.length; i++) {
      const cust = customers[i];
      const room = rooms[i % rooms.length];
      const checkIn = new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000); // tomorrow, day+1, +2
      const checkOut = new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);

      const existing = await Booking.findOne({ customer: cust._id, checkInDate: checkIn });
      if (existing) {
        console.log('Booking already exists for', cust.email, checkIn.toISOString().slice(0,10));
        continue;
      }

      const booking = new Booking({
        customer: cust._id,
        room: room._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: 2,
        totalAmount: room.price || 100,
        status: 'confirmed'
      });
      await booking.save();
      bookingsCreated.push(booking);
      console.log('Created booking for', cust.email, 'room', room.roomNumber);
    }

    // Create orders: for each customer, create an order with 1-2 menu items
    const ordersCreated = [];
    for (let i = 0; i < customers.length; i++) {
      const cust = customers[i];
      // pick 2 menu items
      const items = [];
      const m1 = menuItems[(i * 2) % menuItems.length];
      items.push({ menuItem: m1._id, quantity: 1, price: m1.price || 5 });
      const m2 = menuItems[(i * 2 + 1) % menuItems.length];
      if (m2) items.push({ menuItem: m2._id, quantity: 1, price: m2.price || 5 });

      const total = items.reduce((s, it) => s + (it.price * it.quantity), 0);

      const order = new Order({
        customer: cust._id,
        items,
        totalAmount: total,
        status: 'pending',
        orderType: 'dine-in'
      });
      await order.save();
      ordersCreated.push(order);
      console.log('Created order for', cust.email, 'order id', order._id.toString());
    }

    // Summary
    const custCount = await User.countDocuments({ role: 'customer' });
    const bookingCount = await Booking.countDocuments();
    const orderCount = await Order.countDocuments();
    console.log('Summary counts:', { custCount, bookingCount, orderCount });

  } catch (err) {
    console.error('Seed error', err);
  } finally {
    await mongoose.disconnect();
    console.log('Seed finished');
  }
}

run().catch(err => { console.error(err); process.exit(1); });
