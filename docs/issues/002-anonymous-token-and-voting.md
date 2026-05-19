# Issue 2: Anonymous Token + Voting

- **Type**: AFK
- **Parent**: PRD (docs/PRD.md)
- **Blocked by**: #001 — Scafold & Question Submission

## What to build

Enable audience members to upvote questions without logging in. Each anonymous user gets a UUID stored in localStorage, sent as `X-Anonymous-Token` header on every API call. Backend enforces one-vote-per-person-per-question and a 5-second rate limit between votes.

### Schema

Create the `votes` table:

```sql
CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  token TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(question_id, token)
);
```

### Anonymous Token (Client)

- On first page visit, check localStorage for `anonToken`
- If missing, generate a UUID v4 and store it
- Attach `X-Anonymous-Token` header to every API request (via htmx `hx-headers` or a global AJAX interceptor)

### API

- `POST /api/vote` — accepts `{ questionId: number }`, validates:
  - Question exists and is not deleted
  - Same token hasn't already voted on this question
  - Last vote from this token was at least 5 seconds ago
  - Returns 201 on success, 409 on duplicate, 429 on rate limit, 404 on missing question

### Modules

**TokenMiddleware** — Express middleware that reads `X-Anonymous-Token`. If missing, returns 401.

**VoteGuard** — Pure logic module (no I/O):
- `canVote(token, questionId, existingVotes, lastVoteTime)` → `{ allowed: boolean, reason?: string }`
- Testable without database: pass in vote history and timestamps directly

### HTML

- Each question card on the audience page gets an upvote button (👍)
- Clicking triggers POST /api/vote via htmx
- Show success/failure feedback (e.g., brief toast or button state change)

### Tests

- VoteGuard unit tests: duplicate token+question rejected, same token rapid-fire rejected (within 5s), valid vote allowed
- POST /api/vote API test: valid vote returns 201, duplicate returns 409, rate-limited returns 429
- TokenMiddleware test: missing header returns 401

## Acceptance criteria

- [ ] First visit generates a UUID and stores it in localStorage
- [ ] Vote API rejects duplicate vote from same token on same question (409)
- [ ] Vote API rejects second vote within 5 seconds from same token (429)
- [ ] Vote API accepts valid vote (201)
- [ ] Upvote button exists on each question card
- [ ] VoteGuard tests pass with no database dependency
- [ ] All tests pass with `npm test`
