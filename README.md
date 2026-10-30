# Personal Portfolio - Abdul Wasio

A full-stack personal portfolio website built with **HTML, CSS, JavaScript, Node.js, Express.js and MySQL**.
It has a public site (Home, About, Skills, Education, Certifications, Projects, Contact) and a
password-protected **admin dashboard** to manage projects and read contact messages.

> Screenshots: after running the site, add images to a `screenshots/` folder and link them here, e.g.
> `![Home page](screenshots/home.png)`, `![Admin dashboard](screenshots/admin.png)`.

## Features

- Responsive dark theme, smooth scrolling, scroll animations, hover effects
- Skills, certificates and projects loaded from MySQL through a REST API
- Contact form that saves messages to MySQL
- Admin login (bcrypt + JWT in an httpOnly cookie)
- Admin dashboard: add / edit / delete projects, read / mark / delete messages

## Project structure

```
personal-portfolio/
├── backend/
│   ├── server.js            # Express app entry point
│   ├── config/db.js         # MySQL connection pool (mysql2)
│   ├── middleware/          # auth (login check) + validation helper
│   ├── routes/              # auth.js, public.js, admin.js
│   ├── scripts/createAdmin.js
│   ├── package.json
│   └── .env.example         # copy to .env (never commit .env)
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   ├── js/main.js
│   └── admin/               # login + dashboard pages
├── database/personal_portfolio.sql
├── screenshots/
└── .gitignore
```

## Installation

**Requirements:** Node.js 18+, MySQL 8+, MySQL Workbench (optional), Git.

1. **Get the code**
   ```bash
   git clone https://github.com/wasialijunejo/personal-portfolio.git
   cd personal-portfolio/backend
   npm install
   ```
2. **Create the database.** In MySQL Workbench open `database/personal_portfolio.sql` and run it
   (lightning-bolt button), or from a terminal:
   ```bash
   mysql -u root -p < ../database/personal_portfolio.sql
   ```
3. **Create your `.env` file**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set `DB_PASSWORD` to your MySQL password and `JWT_SECRET` to a long random string
   (the file explains how to generate one).
4. **Create the admin account** (you choose the username and password; it is stored hashed)
   ```bash
   npm run create-admin
   ```
5. **Start the server**
   ```bash
   npm start
   ```
6. Open **http://localhost:3000** for the website and **http://localhost:3000/admin/login.html** for the admin area.

## Customize your content

- Edit the **Education** blocks and the text in `frontend/index.html`.
- Add your real **certificates**, **skills** and **GitHub projects** in the admin dashboard (projects)
  or by editing the sample `INSERT` lines in `database/personal_portfolio.sql` (certificates, skills).
  The sample certificates and project links are placeholders: replace them before sharing the site.

## REST API

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/projects`, `/api/skills`, `/api/certificates` | Public | Read portfolio data |
| POST | `/api/contact` | Public (rate limited) | Save a contact message |
| POST | `/api/auth/login` | Public (5 tries / 15 min) | Admin login |
| POST | `/api/auth/logout` | Any | Clear the session |
| GET | `/api/auth/me` | Admin | Check login |
| POST / PUT / DELETE | `/api/admin/projects[/:id]` | Admin | Manage projects |
| GET / PATCH / DELETE | `/api/admin/messages[/:id]` | Admin | Manage messages |
| GET | `/api/admin/stats` | Admin | Dashboard counts |

## Security

- Passwords hashed with **bcrypt** (cost 12); never stored in plain text
- **Parameterized SQL queries** (`?` placeholders) everywhere
- Input validated with **express-validator** (lengths, email, http/https-only URLs); output rendered with `textContent` to prevent XSS
- Login in an **httpOnly, sameSite=strict** cookie (JWT, 2 h expiry)
- **Rate limiting**: login, contact form and the whole API
- **helmet** security headers including a Content Security Policy
- Credentials live in **.env** (ignored by Git); only `.env.example` is committed

## Publishing to GitHub

```bash
cd personal-portfolio
git init
git add .
git status            # check that .env and node_modules are NOT listed
git commit -m "Initial commit: personal portfolio"
git branch -M main
git remote add origin https://github.com/wasialijunejo/personal-portfolio.git
git push -u origin main
```
Create the empty `personal-portfolio` repository on github.com first. If you ever commit a password by
mistake, change that password immediately; deleting the file later does not remove it from Git history.

## License

MIT
