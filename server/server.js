require('dotenv').config();
// touch to trigger nodemon reload when updated
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
	.split(',')
	.map((o) => o.trim())
	.filter(Boolean);
const io = socketIo(server, {
	cors: {
		origin: allowedOrigins,
		methods: ["GET", "POST"],
		credentials: true
	}
});
module.exports = { app, io };

// Basic middleware
const corsOptions = {
	origin: (origin, callback) => {
		// Allow requests with no origin (like mobile apps, curl, etc.)
		if (!origin) return callback(null, true);
		if (allowedOrigins.includes(origin)) return callback(null, true);
		return callback(new Error(`CORS blocked origin: ${origin}`));
	},
	credentials: true,
	exposedHeaders: ['Authorization'],
};

app.use(cors(corsOptions));
// Explicitly handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

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

const mongoUri = process.env.MONGO_URI_REST || deriveRestUriFrom(process.env.MONGO_URI) || process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// Socket.io connection handling
io.on('connection', (socket) => {
	console.log('User connected:', socket.id);

	// Join user-specific room for targeted messaging and notifications
	socket.on('join', (userId) => {
		socket.join(userId);
		console.log(`User ${userId} joined room`);
	});

	// Join role-based room for broadcast notifications
	socket.on('joinRole', (role) => {
		socket.join(`role:${role}`);
		console.log(`User ${socket.id} joined role room: ${role}`);
	});

	socket.on('disconnect', () => {
		console.log('User disconnected:', socket.id);
	});
});

// Do not connect automatically when required by tests. Connect only when running the server directly.

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const checkinRoutes = require('./routes/checkinRoutes');
app.use('/api/checkins', checkinRoutes);

const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

const attendanceRoutes = require('./routes/attendanceRoutes');
app.use('/api/attendance', attendanceRoutes);

const dailyReportRoutes = require('./routes/dailyReportRoutes');
app.use('/api/reports', dailyReportRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const roomRoutes = require('./routes/roomRoutes');
app.use('/api/rooms', roomRoutes);

const menuRoutes = require('./routes/menuRoutes');
app.use('/api/menu', menuRoutes);

const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

const taskRoutes = require('./routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

const salaryRoutes = require('./routes/salaryRoutes');
app.use('/api/salaries', salaryRoutes);

const { startPayrollReminderScheduler } = require('./utils/payrollReminder');

// Health check
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
	console.error('Unhandled error:', err);
	res.status(500).json({ message: 'Server error' });
});

// Export app and io for tests. Start server only when run directly.
if (require.main === module) {
	mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
		.then(() => {
			console.log('MongoDB connected to', mongoUri);
			startPayrollReminderScheduler();
		})
		.catch(err => {
			console.error('MongoDB connection error:', err);
			process.exit(1);
		});

	server.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}
