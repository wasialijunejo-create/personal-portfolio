// routes/admin.js
// Every route here requires a valid admin login (requireAdmin).
//   Projects:  POST /api/admin/projects, PUT /api/admin/projects/:id, DELETE /api/admin/projects/:id
//   Messages:  GET /api/admin/messages, PATCH /api/admin/messages/:id/read, DELETE /api/admin/messages/:id
//   Stats:     GET /api/admin/stats

const express = require('express');
const { body, param } = require('express-validator');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');

const router = express.Router();
router.use(requireAdmin); // apply the login check to everything below

const idRule = param('id').isInt({ min: 1 }).withMessage('Invalid id');

// Rules shared by "create" and "update" project
const projectRules = [
  body('title').trim().isLength({ min: 2, max: 120 }).withMessage('Title must be 2-120 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('tech_stack').trim().isLength({ max: 200 }),
  // Only allow real http(s) links (blocks "javascript:" URLs)
  body('repo_url').trim().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Repo URL must start with http:// or https://').isLength({ max: 255 }),
  body('live_url').optional({ checkFalsy: true }).trim().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Live URL must start with http:// or https://').isLength({ max: 255 }),
];

// ---------- Projects ----------
router.post('/projects', projectRules, handleValidation, async (req, res) => {
  try {
    const { title, description, tech_stack, repo_url, live_url } = req.body;
    const [result] = await pool.query(
      'INSERT INTO projects (title, description, tech_stack, repo_url, live_url, admin_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, tech_stack || '', repo_url, live_url || null, req.admin.id]
    );
    res.status(201).json({ id: result.insertId, message: 'Project created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create project' });
  }
});

router.put('/projects/:id', [idRule, ...projectRules], handleValidation, async (req, res) => {
  try {
    const { title, description, tech_stack, repo_url, live_url } = req.body;
    const [result] = await pool.query(
      'UPDATE projects SET title=?, description=?, tech_stack=?, repo_url=?, live_url=? WHERE id=?',
      [title, description, tech_stack || '', repo_url, live_url || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update project' });
  }
});

router.delete('/projects/:id', [idRule], handleValidation, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete project' });
  }
});

// ---------- Contact messages ----------
router.get('/messages', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, subject, message, is_read, created_at FROM contact_messages ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load messages' });
  }
});

router.patch('/messages/:id/read', [idRule], handleValidation, async (req, res) => {
  try {
    await pool.query('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update message' });
  }
});

router.delete('/messages/:id', [idRule], handleValidation, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete message' });
  }
});

// ---------- Dashboard numbers ----------
router.get('/stats', async (req, res) => {
  try {
    const [[p]] = await pool.query('SELECT COUNT(*) AS total FROM projects');
    const [[m]] = await pool.query('SELECT COUNT(*) AS total, SUM(is_read = 0) AS unread FROM contact_messages');
    res.json({ projects: p.total, messages: m.total, unread: Number(m.unread || 0) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load stats' });
  }
});

module.exports = router;
