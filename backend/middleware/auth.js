// middleware/auth.js
// Protects admin-only routes.
// After login we give the browser a signed JWT stored in an httpOnly cookie
// (JavaScript on the page cannot read it, which helps against XSS theft).

const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.admin_token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    // Throws if the token is fake, tampered with, or expired
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = { requireAdmin };
