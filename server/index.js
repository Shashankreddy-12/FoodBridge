import express from 'express';
import http from 'http';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

import routes from './src/routes/index.js';
import setupSocket from './src/socket/index.js';
import { startExpiryWatcher } from './src/services/expiryWatcher.js';

// dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ["GET", "POST"]
    }
});
setupSocket(io);

// Expose io to routes
app.set('io', io);

// Routes
app.use('/api', routes);


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        startExpiryWatcher(io);
    })
    .catch((err) => console.error('Failed to connect to MongoDB:', err.message));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
