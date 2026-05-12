const mongoose = require('mongoose');

const turnSchema = new mongoose.Schema({
    members: [{
        name: { type: String, required: true },
        order: { type: Number, required: true }
    }],
    currentIndex: { type: Number, default: 0 },
    history: [{
        name: String,
        date: { type: Date, default: Date.now },
        status: { type: String, enum: ['completed', 'absent', 'miss'], default: 'completed' }
    }]
});

module.exports = mongoose.model('Turn', turnSchema);
