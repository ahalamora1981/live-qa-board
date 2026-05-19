const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const Database = require('better-sqlite3');
const supertest = require('supertest');
const QuestionStore = require('../src/question-store');
const createApp = require('../src/app');

describe('API', () => {
  let db;
  let store;
  let app;

  beforeEach(() => {
    db = new Database(':memory:');
    store = new QuestionStore(db);
    app = createApp(store);
  });

  afterEach(() => {
    db.close();
  });

  it('POST /api/questions returns 201 with created question', async () => {
    const res = await supertest(app)
      .post('/api/questions')
      .send({ content: 'Test question?' })
      .expect(201);

    assert.ok(res.body.id);
    assert.strictEqual(res.body.content, 'Test question?');
  });

  it('GET /api/questions returns a JSON array with voteCount', async () => {
    const q = store.create('Test?');
    store.createVote(q.id, 'token-a');
    store.createVote(q.id, 'token-b');

    const res = await supertest(app)
      .get('/api/questions')
      .expect(200);

    assert.ok(Array.isArray(res.body));
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].voteCount, 2);
    assert.strictEqual(res.body[0].hasVoted, false);
  });

  it('GET /api/questions returns hasVoted=true when token has voted', async () => {
    const q = store.create('Test?');
    store.createVote(q.id, 'my-token');

    const res = await supertest(app)
      .get('/api/questions')
      .set('X-Anonymous-Token', 'my-token')
      .expect(200);

    assert.strictEqual(res.body[0].hasVoted, true);
  });

  it('GET /api/questions sorts by voteCount DESC, created_at ASC', async () => {
    const q1 = store.create('Low votes');
    const q2 = store.create('High votes');
    store.createVote(q2.id, 'a');
    store.createVote(q2.id, 'b');
    store.createVote(q1.id, 'c');

    const res = await supertest(app)
      .get('/api/questions')
      .expect(200);

    assert.strictEqual(res.body[0].id, q2.id);
    assert.strictEqual(res.body[1].id, q1.id);
  });

  it('GET / returns HTML page', async () => {
    const res = await supertest(app)
      .get('/')
      .expect(200);

    assert.strictEqual(res.headers['content-type'], 'text/html; charset=utf-8');
  });

  it('GET /presenter returns HTML with QR code', async () => {
    const res = await supertest(app)
      .get('/presenter')
      .expect(200);

    assert.strictEqual(res.headers['content-type'], 'text/html; charset=utf-8');
    assert.ok(res.text.includes('Presenter'));
    assert.ok(res.text.includes('data:image/png;base64,'));
  });

  describe('POST /api/vote', () => {
    it('returns 401 without X-Anonymous-Token', async () => {
      await supertest(app)
        .post('/api/vote')
        .send({ questionId: 1 })
        .expect(401);
    });

    it('returns 201 on successful vote', async () => {
      const q = store.create('Test?');
      const res = await supertest(app)
        .post('/api/vote')
        .set('X-Anonymous-Token', 'token-1')
        .send({ questionId: q.id })
        .expect(201);
      assert.strictEqual(res.body.success, true);
    });

    it('returns 409 on duplicate vote', async () => {
      const q = store.create('Test?');
      await supertest(app)
        .post('/api/vote')
        .set('X-Anonymous-Token', 'token-1')
        .send({ questionId: q.id });
      await supertest(app)
        .post('/api/vote')
        .set('X-Anonymous-Token', 'token-1')
        .send({ questionId: q.id })
        .expect(409);
    });

    it('returns 404 on non-existent question', async () => {
      await supertest(app)
        .post('/api/vote')
        .set('X-Anonymous-Token', 'token-1')
        .send({ questionId: 999 })
        .expect(404);
    });
  });

  describe('DELETE /api/questions/:id', () => {
    it('returns 200 and soft-deletes a question', async () => {
      const q = store.create('Delete me');
      const res = await supertest(app)
        .delete(`/api/questions/${q.id}`)
        .expect(200);
      assert.strictEqual(res.body.success, true);

      const list = await supertest(app).get('/api/questions');
      const ids = list.body.map(x => x.id);
      assert.ok(!ids.includes(q.id));
    });

    it('returns 404 on non-existent question', async () => {
      await supertest(app)
        .delete('/api/questions/999')
        .expect(404);
    });

    it('returns 404 on already-deleted question', async () => {
      const q = store.create('Delete me');
      await supertest(app).delete(`/api/questions/${q.id}`);
      await supertest(app)
        .delete(`/api/questions/${q.id}`)
        .expect(404);
    });
  });

  describe('POST /api/questions/:id/highlight', () => {
    it('returns 200 and highlights a question', async () => {
      const q = store.create('Highlight me');
      const res = await supertest(app)
        .post(`/api/questions/${q.id}/highlight`)
        .expect(200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(store.getHighlighted().id, q.id);
    });

    it('returns 404 on non-existent question', async () => {
      await supertest(app)
        .post('/api/questions/999/highlight')
        .expect(404);
    });

    it('GET /api/questions includes isHighlighted field', async () => {
      const q = store.create('Q?');
      await supertest(app).post(`/api/questions/${q.id}/highlight`);
      const res = await supertest(app).get('/api/questions');
      assert.strictEqual(res.body[0].isHighlighted, true);
    });
  });

  describe('POST /api/questions/unhighlight', () => {
    it('returns 200 and clears highlight', async () => {
      const q = store.create('Q?');
      store.highlight(q.id);
      const res = await supertest(app)
        .post('/api/questions/unhighlight')
        .expect(200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(store.getHighlighted(), null);
    });
  });
});
