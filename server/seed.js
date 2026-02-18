// seed.js
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to local MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for seeding'))
.catch((err) => console.error('MongoDB connection error:', err));

// Define Check-in Schema
const checkinSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    mood: { type: String, required: true },
    energy: { type: Number, required: true, min: 1, max: 10 },
    notes: { type: String }
});

// Create model
const Checkin = mongoose.model('Checkin', checkinSchema);

// Sample data to seed
const sampleCheckins = [
    { date: new Date('2025-12-25'), mood: 'happy', energy: 8, notes: 'Great day!' },
    { date: new Date('2025-12-26'), mood: 'neutral', energy: 5, notes: 'Just okay.' },
    { date: new Date('2025-12-27'), mood: 'sad', energy: 3, notes: 'Feeling low.' }
];

// Seed function
const seedDB = async () => {
    try {
        // Clear existing data
        await Checkin.deleteMany({});
        console.log('Existing check-ins removed');

        // Insert sample data
        await Checkin.insertMany(sampleCheckins);
        console.log('Sample check-ins added');

        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding database:', err);
    }
};

seedDB();
