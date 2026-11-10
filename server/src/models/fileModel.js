const db = require('../config/db');

// Every query includes user_id, so a user can never read or delete another user's file.
const statements = {
  listByUser: db.prepare(`
    SELECT id, original_name, size_bytes, mime_type, uploaded_at
    FROM files
    WHERE user_id = ? AND original_name LIKE ? ESCAPE '\\'
    ORDER BY uploaded_at DESC, id DESC
  `),
  statsByUser: db.prepare(`
    SELECT COUNT(*) AS count, COALESCE(SUM(size_bytes), 0) AS totalBytes
    FROM files WHERE user_id = ?
  `),
  findOwned: db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?'),
  create: db.prepare(`
    INSERT INTO files (user_id, original_name, s3_key, size_bytes, mime_type)
    VALUES (?, ?, ?, ?, ?)
  `),
  findById: db.prepare('SELECT id, original_name, size_bytes, mime_type, uploaded_at FROM files WHERE id = ?'),
  deleteOwned: db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?'),
};

function escapeLike(text) {
  return text.replace(/[\\%_]/g, (c) => '\\' + c);
}

function toPublicFile(row) {
  return {
    id: row.id,
    name: row.original_name,
    size: row.size_bytes,
    mimeType: row.mime_type,
    // SQLite stores UTC as "YYYY-MM-DD HH:MM:SS"; convert to ISO 8601 for the browser.
    uploadedAt: row.uploaded_at.replace(' ', 'T') + 'Z',
  };
}

const FileModel = {
  listByUser(userId, search = '') {
    return statements.listByUser.all(userId, `%${escapeLike(search)}%`).map(toPublicFile);
  },

  statsByUser(userId) {
    return statements.statsByUser.get(userId);
  },

  /** Returns the raw row (including s3_key) only if the file belongs to the user. */
  findOwned(fileId, userId) {
    return statements.findOwned.get(fileId, userId) || null;
  },

  create({ userId, originalName, s3Key, size, mimeType }) {
    const result = statements.create.run(userId, originalName, s3Key, size, mimeType);
    return toPublicFile(statements.findById.get(Number(result.lastInsertRowid)));
  },

  deleteOwned(fileId, userId) {
    return statements.deleteOwned.run(fileId, userId).changes > 0;
  },
};

module.exports = FileModel;
