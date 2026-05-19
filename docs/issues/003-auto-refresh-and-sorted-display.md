# Issue 3: Auto-Refresh + Sorted Display

- **Type**: AFK
- **Parent**: PRD (docs/PRD.md)
- **Blocked by**: #002 — Anonymous Token & Voting

## What to build

The question list auto-refreshes every 5 seconds via htmx polling. Questions are sorted by vote count (descending), with ties broken by submission time (ascending). Each card shows the live vote count and the upvote button reflects whether the current user has already voted.

### API Change

`GET /api/questions` now returns:

```json
[
  {
    "id": 1,
    "content": "Will this be on the exam?",
    "createdAt": "2026-05-19T09:00:00",
    "voteCount": 5,
    "hasVoted": false
  }
]
```

- `voteCount` is computed via `SELECT COUNT(*) FROM votes WHERE question_id = ?`
- `hasVoted` is computed by checking `votes` table for the current token + question
- Results sorted by `voteCount DESC, created_at ASC`

### HTML (htmx)

- Wrap the question list in a div with `hx-get="/api/questions"` and `hx-trigger="every:5s"`
- Also trigger on page load so there's no blank state
- Each question card displays: content, vote count badge, upvote button
- Upvote button is `hx-post="/api/vote"` with `hx-swap="outerHTML"` to replace the card after voting (so vote count + hasVoted state update immediately)
- If `hasVoted` is true, the upvote button is visually grayed out / disabled

### Edge Cases

- If the list is empty, show a placeholder: "No questions yet. Be the first to ask!"
- Optimistic: clicking upvote instantly grays the button before the server responds

### Tests

- API returns questions sorted correctly
- `hasVoted` is `true` when current token has voted, `false` otherwise
- Empty list returns empty array (not null)

## Acceptance criteria

- [ ] Question list auto-refreshes every 5 seconds without full page reload
- [ ] Questions sorted by vote count desc, created_at asc
- [ ] Vote count badge shown on each question card
- [ ] Already-voted questions show a grayed-out upvote button
- [ ] Empty state shows a placeholder message
- [ ] All tests pass with `npm test`
