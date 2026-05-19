# PRD: Live Q&A with Voting for Presentations

## Problem Statement

Speakers present to audiences but have no lightweight way to let the audience ask questions and collectively decide which questions are most important. Traditional Q&A (raise hand, pass microphone) is slow, biased toward the front row, and loses the quieter questions that many people in the room also want answered.

## Solution

A single-page web app that the presenter displays on a projector screen (with a QR code for the audience to join). Audience members open the page on their phones, type questions, and upvote others' questions. The board updates in near-real-time, sorting the most-voted questions to the top. The presenter can delete inappropriate questions from a dedicated presenter view.

## User Stories

1. As an audience member, I want to open a URL (via QR code) on my phone to join the Q&A board, so that I can participate without installing anything.
2. As an audience member, I want to type a question and submit it, so that the speaker can see what I'm curious about.
3. As an audience member, I want to upvote questions I also want answered, so that the most popular questions rise to the top.
4. As an audience member, I want to see questions submitted by others, so that I don't ask duplicates.
5. As an audience member, I want the vote count to update automatically, so that I always see the current ranking.
6. As a speaker, I want to see the Q&A board with questions sorted by votes (highest first), so that I can answer the most wanted questions first.
7. As a speaker, I want a presenter page that displays the current URL as a QR code, so that the audience can easily join.
8. As a speaker, I want to delete inappropriate or off-topic questions, so that the board stays relevant and respectful.
9. As a speaker, I want the presenter page to auto-refresh, so that I always see the latest questions.
10. As a developer, I want to deploy the app with a single command, so that I can set it up quickly before a talk.

## Implementation Decisions

### Architecture

- **Backend**: Node.js with Express (single process)
- **Database**: SQLite via better-sqlite3 (embedded, zero-config)
- **Frontend**: Server-rendered HTML with htmx for AJAX interactions and polling
- **HTTP + JSON API**: All data flows through Express routes, no WebSocket

### Schema

```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  deleted INTEGER DEFAULT 0
);

CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  token TEXT NOT NULL,    -- anonymous user identifier from localStorage
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(question_id, token)
);
```

### API Contracts

```
GET  /              — Audience page (full HTML)
GET  /presenter     — Presenter page with QR code + delete controls (full HTML)
POST /api/questions — Submit a question (body: { content })
POST /api/vote      — Upvote a question (body: { questionId })
DELETE /api/questions/:id — Delete a question (presenter only, no auth)
GET  /api/questions — List questions sorted by votes desc, created_at asc (JSON)
```

### Modules

1. **QuestionStore** — SQLite wrapper. Methods: `list()`, `create(content)`, `delete(id)`, `getVoteCount(questionId)`. Testable against an in-memory SQLite database.

2. **VoteGuard** — Rate-limiting + duplicate detection engine. Checks: (a) same token hasn't already voted on same question, (b) last vote from this token was at least 5 seconds ago. Pure logic module testable without I/O.

3. **TokenMiddleware** — Express middleware that reads `X-Anonymous-Token` header (set by client from localStorage). If missing, returns 401. Extracted as a module so routes stay clean.

4. **QRService** — thin wrapper around `qrcode` npm package that generates a QR code SVG/data-URL from the current request origin.

### Anonymous User Identification

- Client generates a UUID on first visit, stores in `localStorage` under key `anonToken`
- Sends it as `X-Anonymous-Token` header on every API call
- Server uses it as the `token` column in the `votes` table

### Frontend Behavior

- **Audience page**: text input + submit button for new questions; each question card shows content, vote count, and an upvote button (gray if already voted, highlighted if voted)
- **Presenter page**: same list but with a delete (❌) button on each question; a QR code is displayed at the top
- Both pages use `hx-trigger="every:5s"` on the question list to poll for updates

## Testing Decisions

- **What makes a good test**: Test external behavior, not implementation details. For VoteGuard, test that a second vote from the same token on the same question is rejected. For QuestionStore, test that creating a question returns it in the list. Do not mock SQLite — use an in-memory database.
- **Modules to test**: VoteGuard (unit), QuestionStore (integration with in-memory SQLite), API routes (supertest + in-memory DB).
- **Prior art**: This is a greenfield project; no prior tests exist.

### Testing Approach

```
npm test   — runs all tests
- VoteGuard: pure logic, no DB, fast
- QuestionStore: in-memory better-sqlite3, full CRUD
- API routes: supertest against Express app with in-memory DB
```

## Out of Scope

- Multi-session / room support (single session only)
- Authentication beyond anonymous token
- Downvote / negative voting
- Persistent deployment infrastructure (Docker, CI/CD)
- Admin dashboard beyond presenter delete
- WebSocket / SSE real-time (htmx polling is sufficient)
- Mobile app native wrapper
- Accessibility beyond basic semantic HTML

## Further Notes

- The QR code on the presenter page should derive the URL from `req.headers.origin` at render time, so it works regardless of deployment address.
- Vote counts are computed via `SELECT COUNT(*)` on the votes table, not stored as a denormalized column. This avoids sync issues and the load is negligible for a single-session app.
- The app should be deployable by copying files to a server and running `node index.js` (after `npm install`).
