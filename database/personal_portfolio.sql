-- ============================================================
-- personal_portfolio database
-- Import in MySQL Workbench (File > Run SQL Script) or with:
--   mysql -u root -p < database/personal_portfolio.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS personal_portfolio
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE personal_portfolio;

-- Start clean (children first because of foreign keys)
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS admin;

-- Admin accounts. Passwords are stored as bcrypt hashes, never plain text.
-- Create the account with:  npm run create-admin   (inside /backend)
CREATE TABLE admin (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(30)  NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Portfolio projects. admin_id is a FOREIGN KEY pointing to the admin who added it.
-- ON DELETE SET NULL keeps the project if that admin account is removed.
CREATE TABLE projects (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(120)  NOT NULL,
  description VARCHAR(1000) NOT NULL,
  tech_stack  VARCHAR(200)  NOT NULL DEFAULT '',
  repo_url    VARCHAR(255)  NOT NULL,
  live_url    VARCHAR(255)  NULL,
  admin_id    INT UNSIGNED  NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_admin FOREIGN KEY (admin_id)
    REFERENCES admin(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Messages sent through the contact form
CREATE TABLE contact_messages (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL,
  subject    VARCHAR(150)  NOT NULL,
  message    VARCHAR(2000) NOT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE certificates (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(150) NOT NULL,
  issuer         VARCHAR(120) NOT NULL,
  issue_date     DATE NOT NULL,
  credential_url VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE skills (
  id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(60) NOT NULL UNIQUE,
  category ENUM('Frontend','Backend','Database','Tools','Security') NOT NULL,
  level    TINYINT UNSIGNED NOT NULL DEFAULT 50,   -- 0-100, shown as a progress bar
  CONSTRAINT chk_level CHECK (level BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Starter data. EDIT THESE to match your real information
-- (levels, certificates and project links are placeholders).
-- ------------------------------------------------------------
INSERT INTO skills (name, category, level) VALUES
  ('HTML5',                  'Frontend', 90),
  ('CSS3',                   'Frontend', 85),
  ('JavaScript',             'Frontend', 75),
  ('Node.js',                'Backend',  70),
  ('Express.js',             'Backend',  70),
  ('MySQL',                  'Database', 70),
  ('Git',                    'Tools',    75),
  ('GitHub',                 'Tools',    80),
  ('Cybersecurity Basics',   'Security', 60);

-- Replace these with your real certificates (title, issuer, date, link)
INSERT INTO certificates (title, issuer, issue_date, credential_url) VALUES
  ('Sample: Web Development Fundamentals', 'Replace with issuer', '2026-01-15', NULL),
  ('Sample: Cybersecurity Essentials',     'Replace with issuer', '2026-03-20', NULL),
  ('Sample: Database Management with MySQL','Replace with issuer', '2026-05-10', NULL);

-- Replace wasialijunejo with your GitHub username (or edit later in the admin dashboard)
INSERT INTO projects (title, description, tech_stack, repo_url) VALUES
  ('Personal Portfolio',   'This full-stack portfolio with a contact form, admin dashboard and MySQL database.', 'Node.js, Express, MySQL, JavaScript', 'https://github.com/wasialijunejo/personal-portfolio'),
  ('Project Two',          'Short description of your second GitHub project.', 'HTML, CSS, JavaScript', 'https://github.com/wasialijunejo/project-two'),
  ('Project Three',        'Short description of your third GitHub project.',  'Node.js, Express',      'https://github.com/wasialijunejo/project-three'),
  ('Project Four',         'Short description of your fourth GitHub project.', 'MySQL, Node.js',        'https://github.com/wasialijunejo/project-four'),
  ('Project Five',         'Short description of your fifth GitHub project.',  'HTML, CSS, Bootstrap',  'https://github.com/wasialijunejo/project-five');
