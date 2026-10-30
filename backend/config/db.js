// config/db.js
// Creates ONE shared connection pool to MySQL using the mysql2 package.
// A pool re-uses connections, which is faster and safer than opening a new one per request.
// Credentials come from environment variables (.env), never from the source code.

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'personal_portfolio',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

module.exports = pool;
