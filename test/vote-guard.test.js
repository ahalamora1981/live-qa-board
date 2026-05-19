const { describe, it } = require('node:test');
const assert = require('node:assert');
const VoteGuard = require('../src/vote-guard');

describe('VoteGuard', () => {
  it('allows a valid vote', () => {
    const guard = new VoteGuard();
    const result = guard.canVote({
      token: 'abc',
      questionId: 1,
      existingVote: null,
      lastVoteAt: null,
    });
    assert.strictEqual(result.allowed, true);
  });

  it('rejects duplicate vote from same token on same question', () => {
    const guard = new VoteGuard();
    const result = guard.canVote({
      token: 'abc',
      questionId: 1,
      existingVote: { id: 1 },
      lastVoteAt: null,
    });
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.reason, 'duplicate');
  });

  it('rejects rapid repeated votes within rate limit window', () => {
    const guard = new VoteGuard({ rateLimitMs: 5000 });
    const result = guard.canVote({
      token: 'abc',
      questionId: 1,
      existingVote: null,
      lastVoteAt: Date.now() - 1000,
    });
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.reason, 'rate_limited');
  });

  it('allows vote after rate limit window passes', () => {
    const guard = new VoteGuard({ rateLimitMs: 100 });
    const result = guard.canVote({
      token: 'abc',
      questionId: 1,
      existingVote: null,
      lastVoteAt: Date.now() - 200,
    });
    assert.strictEqual(result.allowed, true);
  });
});
