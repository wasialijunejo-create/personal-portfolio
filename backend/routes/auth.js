// routes/auth.js
// POST /api/auth/login   -> check username + password, set cookie
// POST /api/auth/logout  -> clear cookie
// GET  /api/auth/me      -> tells the admin page whether we are logged in

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const pool = require('../config/db');
const { handleValidation } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Brute-force protection: max 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

router.post(
  '/login',
  loginLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Invalid username'),
    body('password').isLength({ min: 8, max: 100 }).withMessage('Invalid password'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const [rows] = await pool.query(
        'SELECT id, username, password_hash FROM admin WHERE username = ?',
        [username]
      );

      // Same message for "no such user" and "wrong password" so attackers learn nothing
      const admin = rows[0];
      const ok = admin && (await bcrypt.compare(password, admin.password_hash));
      if (!ok) return res.status(401).json({ error: 'Incorrect username or password' });

      const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET, {
        expiresIn: '2h',
      });

      res.cookie('admin_token', token, {
        httpOnly: true, // not readable by page JavaScript
        sameSite: 'strict', // blocks cross-site request forgery
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        maxAge: 2 * 60 * 60 * 1000,
      });
      res.json({ message: 'Logged in', username: admin.username });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ username: req.admin.username });
});

module.exports = router;
