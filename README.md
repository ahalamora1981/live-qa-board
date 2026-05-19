# Live Q&A Board

A real-time Q&A app for presentations. Audience submits questions and upvotes, speaker sees the most-voted questions first.

## Quick Start

```bash
npm install
npm start
```

Open `http://localhost:3000` (audience) and `http://localhost:3000/presenter` (speaker with QR code).

## How It Works

- **Audience page** — submit questions, upvote others' questions. No login needed (anonymous token stored in localStorage). One vote per person per question.
- **Presenter page** — shows a QR code for the audience to join, auto-refreshing question list, delete buttons for inappropriate questions, and highlight the question currently being answered.
- **Sorting** — questions ranked by vote count (descending), ties broken by submission time (ascending). Auto-refreshes every 5s via htmx polling.

## Stack

- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Frontend**: Server-rendered HTML + htmx
- **QR**: qrcode npm package

## Tests

```bash
npm test
```

44 tests covering VoteGuard (rate limit + dedup), QuestionStore (CRUD + votes + highlight), API routes, token middleware, and QR service.
