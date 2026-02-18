require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

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
  const restUri = process.env.MONGO_URI_REST || deriveRestUriFrom(process.env.MONGO_URI);
  if (!restUri) {
    console.error('No REST DB URI available. Set MONGO_URI_REST or MONGO_URI in .env');
    process.exit(1);
  }
  await mongoose.connect(restUri, { useNewUrlParser: true, useUnifiedTopology: true });
  const bookings = await Booking.find().limit(50).lean();
  console.log(`Found ${bookings.length} bookings`);
  bookings.forEach(b => {
    console.log('-', b._id.toString(), b.room ? b.room.toString() : 'no-room', b.checkInDate ? new Date(b.checkInDate).toISOString().slice(0,10) : 'no-date');
  });
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
