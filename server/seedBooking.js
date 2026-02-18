/*
 Simple seed script to insert one sample booking into the reststay DB.
 Usage:
   cd server
   node seedBooking.js
 It derives the REST DB URI from MONGO_URI_REST, or derives from MONGO_URI by replacing the database name with 'reststay'.
*/
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
  console.log('Connecting to', restUri);
  await mongoose.connect(restUri, { useNewUrlParser: true, useUnifiedTopology: true });

  const sample = {
    customer: new mongoose.Types.ObjectId(),
    room: new mongoose.Types.ObjectId(),
    checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    numberOfGuests: 2,
    totalAmount: 199.99,
    specialRequests: 'Near elevator if possible',
    status: 'confirmed'
  };

  try {
    const created = await Booking.create(sample);
    console.log('Inserted booking id:', created._id.toString());
  } catch (err) {
    console.error('Error inserting booking:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Done');
  }
}

run().catch(err => { console.error(err); process.exit(1); });
