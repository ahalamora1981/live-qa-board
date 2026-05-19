# Issue 5: Delete Questions

- **Type**: AFK
- **Parent**: PRD (docs/PRD.md)
- **Blocked by**: #004 — Presenter Page & QR Code

## What to build

The presenter can delete inappropriate questions. Delete is a soft-delete (sets `deleted = 1`) so the question persists in the database but is hidden from all API responses. The delete button on the presenter page triggers a confirmation dialog before sending the request.

### API

- `DELETE /api/questions/:id` — soft-deletes a question (sets `deleted = 1`)
- Returns 200 on success, 404 if question doesn't exist or is already deleted
- No authentication required for presenter actions (simplicity for single-session)

### HTML

- ❌ button on each question card in the presenter page
- On click, show a confirmation prompt (`confirm("Delete this question?")`)
- If confirmed, send DELETE request via htmx (`hx-delete`)
- After successful delete, the card slides out / is removed from the DOM
- If the question has votes, deleting it also orphans the votes (they stay in the DB but are never queried since the parent is hidden)

### Behavior

- `GET /api/questions` already filters out `deleted = 1` from issue #001, so deleted questions disappear from both audience and presenter views immediately
- Deleting a question with existing votes is safe — votes remain in the DB for potential future undo, but the question is no longer visible

### Tests

- `DELETE /api/questions/:id` returns 200 and question is no longer returned by GET
- Deleting a non-existent question returns 404
- Deleting an already-deleted question returns 404
- GET /api/questions excludes deleted questions (re-verify existing test from #001)

## Acceptance criteria

- [ ] DELETE /api/questions/:id soft-deletes the question (200)
- [ ] Deleted question disappears from GET /api/questions responses
- [ ] ❌ button on each question in presenter page
- [ ] Confirmation dialog appears before deletion
- [ ] All tests pass with `npm test`
