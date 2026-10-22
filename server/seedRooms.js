/*
  Seed the rooms used by the public "Our Rooms" section on the home page.
  Safe to run multiple times: existing rooms are updated, not duplicated.

  Usage:
    cd server
    node seedRooms.js
*/
require('dotenv').config();
const mongoose = require('mongoose');

const Room = require('./models/Room');

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

const roomsData = [
  {
    roomNumber: '101',
    name: 'Cozy Single',
    type: 'single',
    price: 59.99,
    capacity: 1,
    description: 'A calm single room with a work desk, perfect for a short business or solo stay.',
    amenities: ['Wi-Fi', 'Air conditioning', 'Work desk', 'En-suite bathroom'],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&h=400&fit=crop'
  },
  {
    roomNumber: '102',
    name: 'Classic Double',
    type: 'double',
    price: 89.99,
    capacity: 2,
    description: 'A spacious double room with a king size bed and warm evening lighting.',
    amenities: ['Wi-Fi', 'Air conditioning', 'King bed', 'Flat screen TV'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&h=400&fit=crop'
  },
  {
    roomNumber: '103',
    name: 'Galleria Suite',
    type: 'suite',
    price: 149.99,
    capacity: 4,
    description: 'A generous suite with a separate lounge area, ideal for families and groups.',
    amenities: ['Wi-Fi', 'Air conditioning', 'King bed', 'Lounge area', 'Mini bar'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop'
  },
  {
    roomNumber: '104',
    name: 'Deluxe Terrace',
    type: 'deluxe',
    price: 199.99,
    capacity: 3,
    description: 'Our deluxe room with a private terrace overlooking the city skyline.',
    amenities: ['Wi-Fi', 'Air conditioning', 'King bed', 'Private terrace', 'Bathtub'],
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&h=400&fit=crop'
  },
  {
    roomNumber: '105',
    name: 'Garden Double',
    type: 'double',
    price: 99.99,
    capacity: 2,
    description: 'A quiet double room facing the garden, with blackout curtains and deep pillows.',
    amenities: ['Wi-Fi', 'Air conditioning', 'Queen bed', 'Blackout curtains'],
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop'
  },
  {
    roomNumber: '106',
    name: 'Family Studio',
    type: 'suite',
    price: 169.99,
    capacity: 4,
    description: 'A studio layout with two beds and a kitchenette for longer family stays.',
    amenities: ['Wi-Fi', 'Air conditioning', 'Two beds', 'Kitchenette', 'Flat screen TV'],
    image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&h=400&fit=crop'
  }
];

async function run() {
  const uri = process.env.MONGO_URI_REST || deriveRestUriFrom(process.env.MONGO_URI) || process.env.MONGO_URI;
  if (!uri) {
    console.error('No DB URI. Set MONGO_URI or MONGO_URI_REST in .env');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', uri);

  try {
    for (const data of roomsData) {
      const room = await Room.findOneAndUpdate(
        { roomNumber: data.roomNumber },
        { $set: { ...data, available: true } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      console.log('Seeded room', room.roomNumber, '-', room.name);
    }

    console.log('Total rooms:', await Room.countDocuments());
  } catch (err) {
    console.error('Seed rooms error', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Seed rooms finished');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
