// main.js - behavior for the public portfolio page.
// Loads skills, certificates and projects from the REST API and handles the contact form.
// SECURITY NOTE: we build elements with textContent (never innerHTML) so database
// text can never run as HTML/JavaScript on the page.

/* ---------- Small helper to create elements safely ---------- */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ---------- Fetch JSON from the API ---------- */
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Request failed: ' + res.status);
  return res.json();
}

/* ---------- Skills ---------- */
async function loadSkills() {
  const grid = document.getElementById('skillsGrid');
  try {
    const skills = await getJSON('/api/skills');
    grid.replaceChildren();
    skills.forEach((s) => {
      const card = el('div', 'card reveal');
      const head = el('div', 'skill-head');
      head.append(el('span', '', s.name), el('span', 'skill-cat', s.category));
      const bar = el('div', 'bar');
      const fill = el('div', 'bar-fill');
      fill.dataset.level = s.level; // animate to this width when visible
      bar.append(fill);
      card.append(head, bar);
      grid.append(card);
    });
    observeReveal();
  } catch (e) {
    grid.replaceChildren(el('p', 'muted', 'Could not load skills right now.'));
  }
}

/* ---------- Certificates ---------- */
async function loadCertificates() {
  const grid = document.getElementById('certGrid');
  try {
    const certs = await getJSON('/api/certificates');
    grid.replaceChildren();
    if (!certs.length) grid.append(el('p', 'muted', 'No certificates yet.'));
    certs.forEach((c) => {
      const card = el('div', 'card reveal');
      card.append(el('h3', '', c.title), el('p', 'muted', c.issuer));
      const date = new Date(c.issue_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      card.append(el('span', 'tag', date));
      if (c.credential_url) {
        const a = el('a', '', 'View credential');
        a.href = c.credential_url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        const links = el('div', 'card-links');
        links.append(a);
        card.append(links);
      }
      grid.append(card);
    });
    observeReveal();
  } catch (e) {
    grid.replaceChildren(el('p', 'muted', 'Could not load certificates right now.'));
  }
}

/* ---------- Projects ---------- */
async function loadProjects() {
  const grid = document.getElementById('projectGrid');
  try {
    const projects = await getJSON('/api/projects');
    grid.replaceChildren();
    if (!projects.length) grid.append(el('p', 'muted', 'No projects yet.'));
    projects.forEach((p) => {
      const card = el('div', 'card reveal');
      card.append(el('h3', '', p.title), el('p', '', p.description));
      (p.tech_stack || '').split(',').map((t) => t.trim()).filter(Boolean)
        .forEach((t) => card.append(el('span', 'tag', t)));
      const links = el('div', 'card-links');
      const repo = el('a', '', 'GitHub Repo');
      repo.href = p.repo_url; repo.target = '_blank'; repo.rel = 'noopener noreferrer';
      links.append(repo);
      if (p.live_url) {
        const live = el('a', '', 'Live Demo');
        live.href = p.live_url; live.target = '_blank'; live.rel = 'noopener noreferrer';
        links.append(live);
      }
      card.append(links);
      grid.append(card);
    });
    observeReveal();
  } catch (e) {
    grid.replaceChildren(el('p', 'muted', 'Could not load projects right now.'));
  }
}

/* ---------- Contact form ---------- */
const form = document.getElementById('contactForm');
const statusBox = document.getElementById('formStatus');
const sendBtn = document.getElementById('sendBtn');

function setStatus(text, type) {
  statusBox.textContent = text;
  statusBox.className = 'form-status ' + (type || '');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  // Quick client-side checks (the server validates again - never trust the browser alone)
  if (data.name.trim().length < 2) return setStatus('Please enter your name.', 'err');
  if (!/^\S+@\S+\.\S+$/.test(data.email)) return setStatus('Please enter a valid email.', 'err');
  if (data.subject.trim().length < 2) return setStatus('Please enter a subject.', 'err');
  if (data.message.trim().length < 10) return setStatus('Message must be at least 10 characters.', 'err');

  sendBtn.disabled = true;
  setStatus('Sending...');
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      const detail = body.details ? body.details.map((d) => d.message).join(' ') : body.error;
      throw new Error(detail || 'Something went wrong');
    }
    setStatus(body.message, 'ok');
    form.reset();
  } catch (err) {
    setStatus(err.message, 'err');
  } finally {
    sendBtn.disabled = false;
  }
});

/* ---------- Scroll-reveal animation + skill bars ---------- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    const fill = entry.target.querySelector('.bar-fill');
    if (fill) fill.style.width = fill.dataset.level + '%';
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15 });

function observeReveal() {
  document.querySelectorAll('.reveal:not(.visible)').forEach((n) => observer.observe(n));
}

/* ---------- Mobile menu, nav highlight, footer year ---------- */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => navLinks.classList.remove('open')));

window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 10);
  let current = 'home';
  document.querySelectorAll('main section').forEach((sec) => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navLinks.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
});

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Start ---------- */
observeReveal();
loadSkills();
loadCertificates();
loadProjects();
