const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Drop old username index that conflicts with the schema
mongoose.connection.once('open', async () => {
    try {
        await mongoose.connection.collection('users').dropIndex('username_1');
        console.log('Dropped old username index');
    } catch (e) {
        // Index doesn't exist, that's fine
    }
});

const turnRoutes = require('./routes/turns');
const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);
app.use('/api/turns', turnRoutes);

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
