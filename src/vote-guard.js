class VoteGuard {
  constructor({ rateLimitMs = 5000 } = {}) {
    this.rateLimitMs = rateLimitMs;
  }

  canVote({ token, questionId, existingVote, lastVoteAt }) {
    if (existingVote) {
      return { allowed: false, reason: 'duplicate' };
    }
    if (lastVoteAt && Date.now() - lastVoteAt < this.rateLimitMs) {
      return { allowed: false, reason: 'rate_limited' };
    }
    return { allowed: true };
  }
}

module.exports = VoteGuard;
