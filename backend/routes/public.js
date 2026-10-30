// routes/public.js
// Routes anyone can use (no login needed):
//   GET  /api/projects       GET /api/skills       GET /api/certificates
//   POST /api/contact        (saves a contact form message)

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const pool = require('../config/db');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();

// Contact form spam protection: 5 messages per hour per IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent. Please try again later.' },
});

router.get('/projects', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, description, tech_stack, repo_url, live_url FROM projects ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load projects' });
  }
});

router.get('/skills', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, category, level FROM skills ORDER BY category, level DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load skills' });
  }
});

router.get('/certificates', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, issuer, issue_date, credential_url FROM certificates ORDER BY issue_date DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load certificates' });
  }
});

router.post(
  '/contact',
  contactLimiter,
  [
    // trim() removes stray spaces. Output is HTML-escaped by the frontend when displayed (stops XSS).
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').trim().isEmail().withMessage('Enter a valid email').isLength({ max: 150 }).normalizeEmail(),
    body('subject').trim().isLength({ min: 2, max: 150 }).withMessage('Subject must be 2-150 characters'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      await pool.query(
        'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
        [name, email, subject, message]
      );
      res.status(201).json({ message: 'Thank you! Your message has been sent.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not save your message' });
    }
  }
);

module.exports = router;
