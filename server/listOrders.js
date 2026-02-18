require('dotenv').config();
const mongoose = require('mongoose');
// Ensure User model is registered for populate
require('./models/User');
const Order = require('./models/Order');

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

async function run() {
  const uri = process.env.MONGO_URI_REST || deriveRestUriFrom(process.env.MONGO_URI) || process.env.MONGO_URI;
  if (!uri) {
    console.error('No DB URI. Set MONGO_URI or MONGO_URI_REST in .env');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const orders = await Order.find().limit(50).populate('customer', 'name email').lean();
  console.log(`Found ${orders.length} orders`);
  orders.forEach(o => {
    console.log('-', o._id.toString(), 'customer:', o.customer ? o.customer.email : 'unknown', 'total:', o.totalAmount, 'items:', o.items.length);
  });
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
