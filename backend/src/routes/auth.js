const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { tokenPayloadForUser } = require('../utils/token');
const { sendError } = require('../utils/sendError');

// In-memory sliding window rate limiter for login attempts (15 attempts / 5 minutes per IP)
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 15;

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const history = loginAttempts.get(ip) || [];
  const valid = history.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (valid.length >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  valid.push(now);
  loginAttempts.set(ip, valid);
  return true;
}

// Clean up stale IP records every 10 minutes to prevent memory accumulation
setInterval(() => {
  const now = Date.now();
  for (const [ip, history] of loginAttempts.entries()) {
    const valid = history.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) loginAttempts.delete(ip);
    else loginAttempts.set(ip, valid);
  }
}, 10 * 60 * 1000).unref();

router.post('/login', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    if (!checkLoginRateLimit(clientIp)) {
      return res.status(429).json({ message: 'Too many login attempts. Please wait 5 minutes before trying again.' });
    }

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const cleanInput = String(email).trim();
    // Fast-path indexed query: if input looks like an email, lookup via the unique email index directly
    let user;
    if (cleanInput.includes('@')) {
      user = await User.findOne({ email: cleanInput.toLowerCase() });
    } else {
      // Safe regex escape for username fallback to prevent ReDoS attacks
      const escaped = cleanInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({
        $or: [
          { email: cleanInput.toLowerCase() },
          { name: { $regex: new RegExp(`^${escaped}$`, 'i') } },
        ],
      });
    }

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(401).json({ message: 'Account deactivated' });

    // Clear rate limit record on successful login
    loginAttempts.delete(clientIp);

    res.json({
      ...tokenPayloadForUser(user),
    });
  } catch (err) {
    sendError(res, err, 'Login failed. Please try again.');
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.json(tokenPayloadForUser(user));
  } catch (err) {
    sendError(res, err, 'Could not load your profile.');
  }
});

router.post('/refresh', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.json(tokenPayloadForUser(user));
  } catch (err) {
    sendError(res, err, 'Could not refresh session.');
  }
});

module.exports = router;
