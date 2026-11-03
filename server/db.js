const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'quizforge.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for reliability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables as requested:
// users (id, name, email, password_hash, role)
// quizzes (id, title, description, duration_minutes, max_attempts, created_at)
// questions (id, quiz_id, type 'mcq' or 'coding', text, options_json, correct_index, position)
// attempts (id, user_id, quiz_id, score, total, started_at, submitted_at, status)
// answers (id, attempt_id, question_id, selected_index)
// audit_logs (id, user_id, user_name, action, details, created_at)

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'user')) NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      type TEXT CHECK(type IN ('mcq', 'coding')) NOT NULL DEFAULT 'mcq',
      text TEXT NOT NULL,
      options_json TEXT, -- JSON array of strings for MCQ, or starter code & test cases for coding
      correct_index INTEGER, -- For MCQ correct option index; null for coding
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      score INTEGER DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME,
      status TEXT CHECK(status IN ('in_progress', 'completed', 'timed_out')) NOT NULL DEFAULT 'in_progress'
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      selected_index INTEGER, -- For MCQ selected index; for coding: null or 1 (passed) / 0 (failed)
      code_submission TEXT, -- Submitted code for coding question
      is_correct INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function logAudit(userId, userName, action, details) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, details, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(userId || null, userName || 'System', action, details || '');
  } catch (err) {
    console.error('Failed to log audit event:', err.message);
  }
}

initSchema();

module.exports = {
  db,
  logAudit,
};
