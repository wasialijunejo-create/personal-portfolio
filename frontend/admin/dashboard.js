// dashboard.js - admin dashboard logic (manage projects and contact messages).
// Every request goes to /api/admin/*, which only works while you are logged in.
// All text from the database is inserted with textContent, so it cannot run as code.

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}

// Wrapper around fetch: sends JSON, and redirects to login if the session expired
async function api(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    window.location.href = 'login.html';
    throw new Error('Not logged in');
  }
  const data = await res.json();
  if (!res.ok) {
    const detail = data.details ? data.details.map((d) => d.message).join(' ') : data.error;
    throw new Error(detail || 'Request failed');
  }
  return data;
}

/* ---------- Tabs ---------- */
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.panel).classList.add('active');
  });
});

/* ---------- Logout ---------- */
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = 'login.html';
});

/* ---------- Stats ---------- */
async function loadStats() {
  const s = await api('/api/admin/stats');
  document.getElementById('statProjects').textContent = s.projects;
  document.getElementById('statMessages').textContent = s.messages;
  document.getElementById('statUnread').textContent = s.unread;
}

/* ---------- Projects ---------- */
const projectForm = document.getElementById('projectForm');
const projectStatus = document.getElementById('projectStatus');
const cancelEdit = document.getElementById('cancelEdit');
let projectsCache = [];

function setStatus(text, type) {
  projectStatus.textContent = text;
  projectStatus.className = 'form-status ' + (type || '');
}

function resetProjectForm() {
  projectForm.reset();
  document.getElementById('projectId').value = '';
  document.getElementById('projectFormTitle').textContent = 'Add project';
  cancelEdit.hidden = true;
}

async function loadProjects() {
  // The public endpoint already returns all projects
  projectsCache = await (await fetch('/api/projects')).json();
  const tbody = document.getElementById('projectRows');
  tbody.replaceChildren();
  projectsCache.forEach((p) => {
    const tr = el('tr');
    tr.append(el('td', '', p.title), el('td', '', p.repo_url));
    const actions = el('td');
    const wrap = el('div', 'row-actions');
    const edit = el('button', 'btn btn-ghost btn-small', 'Edit');
    edit.addEventListener('click', () => startEdit(p));
    const del = el('button', 'btn btn-danger btn-small', 'Delete');
    del.addEventListener('click', () => deleteProject(p));
    wrap.append(edit, del);
    actions.append(wrap);
    tr.append(actions);
    tbody.append(tr);
  });
}

function startEdit(p) {
  document.getElementById('projectId').value = p.id;
  document.getElementById('pTitle').value = p.title;
  document.getElementById('pDesc').value = p.description;
  document.getElementById('pTech').value = p.tech_stack || '';
  document.getElementById('pRepo').value = p.repo_url;
  document.getElementById('pLive').value = p.live_url || '';
  document.getElementById('projectFormTitle').textContent = 'Edit project';
  cancelEdit.hidden = false;
  projectForm.scrollIntoView({ behavior: 'smooth' });
}

async function deleteProject(p) {
  if (!confirm('Delete "' + p.title + '"?')) return;
  try {
    await api('/api/admin/projects/' + p.id, 'DELETE');
    await Promise.all([loadProjects(), loadStats()]);
  } catch (err) { setStatus(err.message, 'err'); }
}

cancelEdit.addEventListener('click', () => { resetProjectForm(); setStatus(''); });

projectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('projectId').value;
  const payload = {
    title: document.getElementById('pTitle').value,
    description: document.getElementById('pDesc').value,
    tech_stack: document.getElementById('pTech').value,
    repo_url: document.getElementById('pRepo').value,
    live_url: document.getElementById('pLive').value,
  };
  try {
    const result = id
      ? await api('/api/admin/projects/' + id, 'PUT', payload)
      : await api('/api/admin/projects', 'POST', payload);
    setStatus(result.message, 'ok');
    resetProjectForm();
    await Promise.all([loadProjects(), loadStats()]);
  } catch (err) { setStatus(err.message, 'err'); }
});

/* ---------- Messages ---------- */
async function loadMessages() {
  const messages = await api('/api/admin/messages');
  const tbody = document.getElementById('messageRows');
  tbody.replaceChildren();
  if (!messages.length) {
    const tr = el('tr'); const td = el('td', 'muted', 'No messages yet.'); td.colSpan = 4;
    tr.append(td); tbody.append(tr); return;
  }
  messages.forEach((m) => {
    const tr = el('tr', m.is_read ? '' : 'unread');
    const from = el('td');
    from.append(el('strong', '', m.name), document.createElement('br'), el('span', 'muted', m.email));
    const body = el('td');
    body.append(el('strong', '', m.subject), el('div', 'msg-body', m.message));
    const date = el('td', 'muted', new Date(m.created_at).toLocaleString());
    const actions = el('td');
    const wrap = el('div', 'row-actions');
    if (!m.is_read) {
      const read = el('button', 'btn btn-ghost btn-small', 'Mark read');
      read.addEventListener('click', async () => {
        await api('/api/admin/messages/' + m.id + '/read', 'PATCH');
        await Promise.all([loadMessages(), loadStats()]);
      });
      wrap.append(read);
    }
    const del = el('button', 'btn btn-danger btn-small', 'Delete');
    del.addEventListener('click', async () => {
      if (!confirm('Delete this message?')) return;
      await api('/api/admin/messages/' + m.id, 'DELETE');
      await Promise.all([loadMessages(), loadStats()]);
    });
    wrap.append(del);
    actions.append(wrap);
    tr.append(from, body, date, actions);
    tbody.append(tr);
  });
}

/* ---------- Start (api() redirects to login if not authenticated) ---------- */
loadStats().then(() => { loadProjects(); loadMessages(); }).catch(() => {});
