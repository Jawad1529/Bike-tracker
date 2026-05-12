const jwt = require('jsonwebtoken');

const ADMIN_EMAIL = 'syedjawadshah00@gmail.com';

// Verify JWT token
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Only allow admin (syedjawadshah00@gmail.com)
const adminOnly = (req, res, next) => {
    if (req.user.email !== ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Admin access only' });
    }
    next();
};

module.exports = { authenticate, adminOnly };
