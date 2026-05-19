class QuestionStore {
  constructor(db) {
    this.db = db;
    db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        deleted INTEGER DEFAULT 0,
        highlighted INTEGER DEFAULT 0
      )
    `);
    try { db.exec('ALTER TABLE questions ADD COLUMN highlighted INTEGER DEFAULT 0'); } catch (e) {}
    db.exec(`
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER NOT NULL REFERENCES questions(id),
        token TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(question_id, token)
      )
    `);
  }

  create(content) {
    const stmt = this.db.prepare('INSERT INTO questions (content) VALUES (?)');
    const result = stmt.run(content);
    return this.db.prepare('SELECT * FROM questions WHERE id = ?').get(result.lastInsertRowid);
  }

  list() {
    return this.db.prepare(
      'SELECT * FROM questions WHERE deleted = 0 ORDER BY created_at DESC, id DESC'
    ).all();
  }

  find(id) {
    return this.db.prepare('SELECT * FROM questions WHERE id = ? AND deleted = 0').get(id);
  }

  delete(id) {
    const stmt = this.db.prepare('UPDATE questions SET deleted = 1 WHERE id = ? AND deleted = 0');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  createVote(questionId, token) {
    const stmt = this.db.prepare('INSERT INTO votes (question_id, token) VALUES (?, ?)');
    const result = stmt.run(questionId, token);
    return this.db.prepare('SELECT * FROM votes WHERE id = ?').get(result.lastInsertRowid);
  }

  hasVoted(questionId, token) {
    const row = this.db.prepare(
      'SELECT 1 FROM votes WHERE question_id = ? AND token = ?'
    ).get(questionId, token);
    return !!row;
  }

  getVoteCount(questionId) {
    const row = this.db.prepare(
      'SELECT COUNT(*) AS count FROM votes WHERE question_id = ?'
    ).get(questionId);
    return row.count;
  }

  getLastVoteTime(token) {
    const row = this.db.prepare(
      'SELECT created_at FROM votes WHERE token = ? ORDER BY created_at DESC LIMIT 1'
    ).get(token);
    return row ? row.created_at : null;
  }

  highlight(id) {
    const txn = this.db.transaction(() => {
      this.db.prepare('UPDATE questions SET highlighted = 0 WHERE highlighted = 1').run();
      this.db.prepare('UPDATE questions SET highlighted = 1 WHERE id = ? AND deleted = 0').run(id);
    });
    txn();
  }

  unhighlight() {
    this.db.prepare('UPDATE questions SET highlighted = 0 WHERE highlighted = 1').run();
  }

  getHighlighted() {
    return this.db.prepare('SELECT * FROM questions WHERE highlighted = 1 AND deleted = 0').get() || null;
  }

  listWithDetails(token) {
    const rows = this.db.prepare(`
      SELECT q.*,
        (SELECT COUNT(*) FROM votes v WHERE v.question_id = q.id) AS voteCount
        ${token ? ", (SELECT COUNT(*) FROM votes v WHERE v.question_id = q.id AND v.token = ?) > 0 AS hasVoted" : ""}
      FROM questions q
      WHERE q.deleted = 0
      ORDER BY voteCount DESC, q.created_at ASC, q.id ASC
    `).all(...(token ? [token] : []));

    return rows.map(r => ({
      ...r,
      voteCount: r.voteCount,
      hasVoted: token ? Boolean(r.hasVoted) : false,
      isHighlighted: Boolean(r.highlighted),
    }));
  }
}

module.exports = QuestionStore;
