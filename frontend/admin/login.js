// login.js - sends the admin username/password to the API.
// On success the server sets a secure httpOnly cookie and we go to the dashboard.

const form = document.getElementById('loginForm');
const status = document.getElementById('loginStatus');
const btn = document.getElementById('loginBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.textContent = '';
  btn.disabled = true;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Login failed');
    window.location.href = 'dashboard.html';
  } catch (err) {
    status.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});
