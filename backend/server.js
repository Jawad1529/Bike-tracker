const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
