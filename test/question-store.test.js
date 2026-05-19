const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const Database = require('better-sqlite3');
const QuestionStore = require('../src/question-store');

describe('QuestionStore', () => {
  let db;
  let store;

  beforeEach(() => {
    db = new Database(':memory:');
    store = new QuestionStore(db);
  });

  afterEach(() => {
    db.close();
  });

  it('creates a question and returns it', () => {
    const q = store.create('Hello world?');
    assert.ok(q.id);
    assert.strictEqual(q.content, 'Hello world?');
    assert.ok(q.created_at);
    assert.strictEqual(q.deleted, 0);
  });

  it('lists non-deleted questions sorted by created_at DESC', () => {
    store.create('First');
    store.create('Second');
    const list = store.list();
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0].content, 'Second');
    assert.strictEqual(list[1].content, 'First');
  });

  it('excludes deleted questions from list', () => {
    const q = store.create('Will delete');
    store.delete(q.id);
    const ids = store.list().map(x => x.id);
    assert.ok(!ids.includes(q.id));
  });

  describe('listWithDetails', () => {
    it('returns questions with voteCount and hasVoted', () => {
      const q1 = store.create('Q1');
      const q2 = store.create('Q2');
      store.createVote(q1.id, 'token-a');
      store.createVote(q1.id, 'token-b');
      store.createVote(q2.id, 'token-a');

      const list = store.listWithDetails('token-a');
      assert.strictEqual(list.length, 2);
      const q1res = list.find(x => x.id === q1.id);
      assert.strictEqual(q1res.voteCount, 2);
      assert.strictEqual(q1res.hasVoted, true);
      const q2res = list.find(x => x.id === q2.id);
      assert.strictEqual(q2res.voteCount, 1);
      assert.strictEqual(q2res.hasVoted, true);
    });

    it('hasVoted is false when token has not voted', () => {
      const q = store.create('Q?');
      store.createVote(q.id, 'someone-else');
      const list = store.listWithDetails('new-token');
      assert.strictEqual(list[0].hasVoted, false);
    });

    it('sorts by voteCount DESC, created_at ASC', () => {
      const q1 = store.create('One vote');
      const q2 = store.create('Two votes');
      store.createVote(q2.id, 'a');
      store.createVote(q2.id, 'b');
      store.createVote(q1.id, 'c');

      const list = store.listWithDetails();
      assert.strictEqual(list[0].id, q2.id); // 2 votes first
      assert.strictEqual(list[1].id, q1.id); // 1 vote second
    });

    it('sorts ties in created_at ASC', () => {
      const q1 = store.create('Earlier');
      const q2 = store.create('Later');
      store.createVote(q1.id, 'a');
      store.createVote(q2.id, 'b');

      const list = store.listWithDetails();
      assert.strictEqual(list[0].id, q1.id); // both have 1 vote, earlier first
      assert.strictEqual(list[1].id, q2.id);
    });

    it('excludes deleted questions', () => {
      const q = store.create('Will delete');
      store.delete(q.id);
      const list = store.listWithDetails();
      assert.strictEqual(list.length, 0);
    });
  });

  describe('votes', () => {
    it('creates a vote and returns it', () => {
      const q = store.create('Q?');
      const v = store.createVote(q.id, 'token-1');
      assert.ok(v.id);
      assert.strictEqual(v.question_id, q.id);
      assert.strictEqual(v.token, 'token-1');
    });

    it('hasVoted returns true when vote exists', () => {
      const q = store.create('Q?');
      store.createVote(q.id, 'token-a');
      assert.strictEqual(store.hasVoted(q.id, 'token-a'), true);
    });

    it('hasVoted returns false when no vote', () => {
      const q = store.create('Q?');
      assert.strictEqual(store.hasVoted(q.id, 'nonexistent'), false);
    });

    it('getVoteCount returns correct count', () => {
      const q = store.create('Q?');
      store.createVote(q.id, 'token-1');
      store.createVote(q.id, 'token-2');
      assert.strictEqual(store.getVoteCount(q.id), 2);
    });

    it('getVoteCount returns 0 for unvoted question', () => {
      const q = store.create('Q?');
      assert.strictEqual(store.getVoteCount(q.id), 0);
    });

    it('getLastVoteTime returns timestamp of most recent vote', () => {
      const q = store.create('Q?');
      store.createVote(q.id, 'token-x');
      const time = store.getLastVoteTime('token-x');
      assert.ok(time);
      assert.ok(typeof time === 'string' || typeof time === 'number');
    });

    it('getLastVoteTime returns null for token with no votes', () => {
      const time = store.getLastVoteTime('never-voted');
      assert.strictEqual(time, null);
    });
  });
});
