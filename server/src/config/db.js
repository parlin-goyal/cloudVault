/**
 * SQLite database stored on the EC2 instance.
 * Holds user accounts and file metadata. The files themselves live in Amazon S3.
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const env = require('./env');

fs.mkdirSync(env.dataDir, { recursive: true });

const db = new Database(path.join(env.dataDir, 'cloudvault.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS files (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name TEXT    NOT NULL,
    s3_key        TEXT    NOT NULL UNIQUE,
    size_bytes    INTEGER NOT NULL,
    mime_type     TEXT,
    uploaded_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
`);

module.exports = db;
