# Issue 1: Scaffold + Submit & List Questions

- **Type**: AFK
- **Parent**: PRD (docs/PRD.md)
- **Blocked by**: None — can start immediately

## What to build

Set up the Node.js/Express project skeleton with SQLite, and deliver the first end-to-end path: audience members can view the Q&A board and submit questions.

### Schema

Create the `questions` table:

```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  deleted INTEGER DEFAULT 0
);
```

### API

- `GET /api/questions` — returns all non-deleted questions sorted by `created_at DESC`
- `POST /api/questions` — accepts `{ content: string }`, inserts a new question, returns the created question

### HTML

- `GET /` — renders the audience page: a text input + submit button at the top, and a list of question cards below

### Tests

- `QuestionStore` unit/integration tests: create, list, list excludes deleted
- API route tests with supertest: POST returns 201 with question body, GET returns array

## Acceptance criteria

- [ ] `npm start` boots the server on a configured port
- [ ] POST /api/questions with `{ content: "hello" }` returns 201 and the created question
- [ ] GET /api/questions returns a JSON array of questions
- [ ] GET / renders an HTML page with a form and question list
- [ ] Submitted questions appear in the list after page refresh
- [ ] Tests pass with `npm test`
