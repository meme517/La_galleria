/*
 Migration script: copy from casual DB to reststay bookings collection.
 Usage:
  - Add MONGO_URI_CASUAL and MONGO_URI_REST to server/.env (optional).
  - If MONGO_URI_CASUAL is not set, this script will fall back to process.env.MONGO_URI (your existing setting).
  - If MONGO_URI_REST is not set, this script will derive a reststay URI from process.env.MONGO_URI by replacing the database name with 'reststay'.

 Run:
   cd server
   node migrateCasualToReststay.js

 The script is non-destructive: it only reads from the casual DB and inserts into reststay.bookings.
*/

require('dotenv').config();
const mongoose = require('mongoose');

function deriveRestUriFrom(uri) {
  // Try to replace the database name in a simple way.
  // Handles URIs like: mongodb://host:port/dbname?opts or mongodb+srv://host/dbname
  if (!uri) return null;
  // Split off query string
  const [main, query] = uri.split('?');
  const parts = main.split('/');
  if (parts.length === 0) return uri;
  // If the last part contains host:port (no DB), append reststay
  const last = parts[parts.length - 1];
  // If last contains ':' or '@' it's likely not a db name when using mongodb+srv without a trailing db
  if (!last || last.includes(':') || last.includes('@')) {
    // append reststay
    const newMain = main.replace(/\/?$/, '/') + 'reststay';
    return query ? `${newMain}?${query}` : newMain;
  }
  // Otherwise replace last segment with reststay
  parts[parts.length - 1] = 'reststay';
  const newMain = parts.join('/');
  return query ? `${newMain}?${query}` : newMain;
}

async function run() {
  const casualUri = process.env.MONGO_URI_CASUAL || process.env.MONGO_URI;
  if (!casualUri) {
    console.error('No casual DB URI found. Set MONGO_URI_CASUAL or MONGO_URI in .env');
    process.exit(1);
  }

  let restUri = process.env.MONGO_URI_REST;
  if (!restUri) {
    restUri = deriveRestUriFrom(process.env.MONGO_URI) || deriveRestUriFrom(casualUri);
    console.log('Derived rest URI:', restUri);
  }

  if (!restUri) {
    console.error('No rest DB URI available. Set MONGO_URI_REST in .env');
    process.exit(1);
  }

  console.log('Connecting to casual DB:', casualUri);
  console.log('Connecting to rest DB   :', restUri);

  // Create two separate connections to avoid mixing models
  const casualConn = await mongoose.createConnection(casualUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const restConn = await mongoose.createConnection(restUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Flexible schemas to read arbitrary checkin documents
  const checkinSchema = new mongoose.Schema({}, { strict: false, collection: 'checkins' });
  const bookingSchema = new mongoose.Schema({
    name: String,
    email: String,
    date: Date,
    notes: String,
  }, { timestamps: true, collection: 'bookings' });

  const Checkin = casualConn.model('Checkin', checkinSchema);
  const Booking = restConn.model('Booking', bookingSchema);

  try {
    const docs = await Checkin.find().lean().exec();
    console.log(`Read ${docs.length} documents from casual DB (checkins).`);

    if (docs.length === 0) {
      console.log('No documents to migrate. Exiting.');
      return;
    }

    // Transform checkin -> booking
    const toInsert = docs.map(d => ({
      name: d.name || d.user || d.username || 'Unknown',
      email: d.email || d.userEmail || d.contact || '',
      date: d.date || d.createdAt || new Date(),
      notes: d.notes || d.memo || '',
    }));

    // Insert into rest DB
    console.log(`Inserting ${toInsert.length} bookings into reststay.bookings...`);
    const res = await Booking.insertMany(toInsert, { ordered: false });
    console.log('Inserted documents:', res.length);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await casualConn.close();
    await restConn.close();
    console.log('Connections closed. Migration finished.');
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
