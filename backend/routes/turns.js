const express = require('express');
const router = express.Router();
const Turn = require('../models/Turn');
const { sendMissEmail } = require('../utils/mailer');
const { authenticate, adminOnly } = require('../middleware/auth');

const MEMBERS = ['Hamza', 'Kashif', 'Ansar', 'Abdullah', 'Jawad', 'Moiz', 'Waqas', 'Usama'];

// Map member names to their emails
const MEMBER_EMAILS = {
    'Hamza': 'hamzaashfaq7866@gmail.com',
    'Kashif': 'muhammadkashifzia165@gmail.com',
    'Ansar': 'anser.developer@gmail.com',
    'Abdullah': 'm.abdullah158@gmail.com',
    'Jawad': 'syedjawadshah00@gmail.com',
    'Moiz': 'muhammadmoiztanveer@gmail.com',
    'Waqas': 'waqas@gmail.com',
    'Usama': 'm.usamariaz88@gmail.com'
};

// Initialize or get current state
router.get('/', async (req, res) => {
    try {
        let turn = await Turn.findOne();
        if (!turn) {
            turn = await Turn.create({
                members: MEMBERS.map((name, i) => ({ name, order: i })),
                currentIndex: 0,
                history: []
            });
        }
        res.json(turn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark current person as done (completed their turn)
router.post('/complete', authenticate, adminOnly, async (req, res) => {
    try {
        const turn = await Turn.findOne();
        if (!turn) return res.status(404).json({ error: 'No turn data found' });

        const currentMember = turn.members[turn.currentIndex];
        turn.history.push({ name: currentMember.name, status: 'completed' });
        turn.currentIndex = (turn.currentIndex + 1) % turn.members.length;
        await turn.save();
        res.json(turn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark current person as absent (skip them)
router.post('/absent', authenticate, adminOnly, async (req, res) => {
    try {
        const turn = await Turn.findOne();
        if (!turn) return res.status(404).json({ error: 'No turn data found' });

        const currentMember = turn.members[turn.currentIndex];
        turn.history.push({ name: currentMember.name, status: 'absent' });
        turn.currentIndex = (turn.currentIndex + 1) % turn.members.length;
        await turn.save();
        res.json(turn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark current person as miss (they missed but loop continues)
router.post('/miss', authenticate, adminOnly, async (req, res) => {
    try {
        const turn = await Turn.findOne();
        if (!turn) return res.status(404).json({ error: 'No turn data found' });

        const currentMember = turn.members[turn.currentIndex];
        turn.history.push({ name: currentMember.name, status: 'miss' });
        turn.currentIndex = (turn.currentIndex + 1) % turn.members.length;
        await turn.save();

        // Send email notification to the person who missed
        const email = MEMBER_EMAILS[currentMember.name];
        sendMissEmail(currentMember.name, email);

        res.json(turn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Set current turn to a specific member by index
router.post('/set/:index', authenticate, adminOnly, async (req, res) => {
    try {
        const turn = await Turn.findOne();
        if (!turn) return res.status(404).json({ error: 'No turn data found' });

        const index = parseInt(req.params.index);
        if (index < 0 || index >= turn.members.length) {
            return res.status(400).json({ error: 'Invalid index' });
        }

        turn.currentIndex = index;
        await turn.save();
        res.json(turn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reorder members via drag and drop
router.post('/reorder', authenticate, adminOnly, async (req, res) => {
    try {
        const turn = await Turn.findOne();
        if (!turn) return res.status(404).json({ error: 'No turn data found' });

        const { members } = req.body;
        if (!members || !Array.isArray(members)) {
            return res.status(400).json({ error: 'Members array required' });
        }

        turn.members = members.map((name, i) => ({ name, order: i }));
        // Reset currentIndex to 0 after reorder to avoid confusion
        turn.currentIndex = 0;
        await turn.save();
        res.json(turn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reset all turns
router.post('/reset', authenticate, adminOnly, async (req, res) => {
    try {
        const turn = await Turn.findOne();
        if (!turn) return res.status(404).json({ error: 'No turn data found' });

        turn.currentIndex = 0;
        turn.history = [];
        await turn.save();
        res.json(turn);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
