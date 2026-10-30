// server.js
// Entry point. Starts Express, adds security middleware, mounts the API routes
// and serves the frontend folder as static files.

require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Fail fast if the secret is missing - a weak/absent secret would make logins insecure
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET is missing or too short (min 32 chars). Check your .env file.');
  process.exit(1);
}

const app = express();

// helmet adds safe HTTP headers (CSP, no-sniff, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
      },
    },
  })
);

app.use(express.json({ limit: '10kb' })); // read JSON bodies, reject huge ones
app.use(cookieParser());

// General limit for all API calls: 100 requests / 15 min / IP
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/public'));

// Serve the website files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Unknown API path -> JSON 404
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));
