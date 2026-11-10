const db = require('../config/db');

const statements = {
  findById: db.prepare('SELECT id, username, created_at FROM users WHERE id = ?'),
  findByUsername: db.prepare('SELECT id, username, password_hash, created_at FROM users WHERE username = ?'),
  create: db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)'),
};

function toPublicUser(row) {
  if (!row) return null;
  return { id: row.id, username: row.username, createdAt: row.created_at.replace(' ', 'T') + 'Z' };
}

const UserModel = {
  findById(id) {
    return toPublicUser(statements.findById.get(id));
  },

  /** Returns the full row including password_hash (used only for login). */
  findByUsernameWithPassword(username) {
    return statements.findByUsername.get(username) || null;
  },

  create(username, passwordHash) {
    const result = statements.create.run(username, passwordHash);
    return this.findById(Number(result.lastInsertRowid));
  },

  toPublicUser,
};

module.exports = UserModel;
