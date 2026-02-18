require('dotenv').config();
const mongoose = require('mongoose');
const { generateTokenForEmail } = require('./utils/tokenHelper');

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

  const email = process.argv[2] || 'admin@example.com';
  const roleHint = process.argv[3]; // optional role argument

  try {
    const token = await generateTokenForEmail(email, roleHint);
    console.log(token);
  } catch (err) {
    console.error('Error generating token:', err);
    process.exitCode = 1;
  } finally {
    try { await mongoose.disconnect(); } catch (e) { /* ignore */ }
  }
}

run().catch(err => { console.error(err); process.exit(1); });
