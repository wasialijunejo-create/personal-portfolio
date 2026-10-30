// scripts/createAdmin.js
// Run once:  npm run create-admin
// Creates (or resets) the admin account. The password is hashed with bcrypt
// before it is stored, so the real password is never saved in the database.

require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

(async () => {
  try {
    const username = (await ask('Admin username: ')).trim();
    const password = await ask('Admin password (min 8 chars): ');
    rl.close();

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      throw new Error('Username must be 3-30 letters, numbers or underscores.');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    const hash = await bcrypt.hash(password, 12); // 12 = cost factor (higher = slower to crack)

    // Parameterized query: the ? placeholders prevent SQL injection
    await pool.query(
      `INSERT INTO admin (username, password_hash) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [username, hash]
    );
    console.log(`Admin "${username}" saved successfully.`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
