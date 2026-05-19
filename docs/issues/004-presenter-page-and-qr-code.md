# Issue 4: Presenter Page + QR Code

- **Type**: AFK
- **Parent**: PRD (docs/PRD.md)
- **Blocked by**: #003 — Auto-Refresh & Sorted Display

## What to build

A dedicated presenter page (`/presenter`) that the speaker displays on the projector. It shows the same question list as the audience page but with delete controls, plus a QR code at the top that the audience scans to open the audience page.

### Route

- `GET /presenter` — returns full presenter page HTML

### QR Code

- Use the `qrcode` npm package to generate a QR code as a data-URL (SVG or PNG)
- The encoded URL is derived from `req.headers.origin` (or `host`) so it works on any deployment
- Display the QR code prominently at the top of the page, with the full URL shown as text underneath
- The QR code should be large enough to scan from across a room (~250px minimum)

### Modules

**QRService** — wraps `qrcode` package:
- `generateQR(url: string): Promise<string>` — returns a data-URL string
- Testable by passing a known URL and verifying the output is a valid data-URL

### HTML

- Same auto-refreshing question list as audience page (reuse the same htmx partial)
- No upvote buttons (this is the presenter's view)
- ❌ delete button on each question (functional in issue #005)
- QR code at the top, with the URL text below it
- Minimal, clean layout suitable for projection (large font, high contrast)

### Tests

- `GET /presenter` returns 200 with HTML containing "Presenter" in the title
- QRService returns a data-URL starting with `data:image/svg+xml`
- QRService raises an error on an empty URL

## Acceptance criteria

- [ ] GET /presenter renders an HTML page
- [ ] QR code is displayed and scannable, encodes the correct URL
- [ ] URL text is displayed below the QR code
- [ ] Question list auto-refreshes (same behavior as audience page)
- [ ] No upvote buttons on presenter page
- [ ] Delete buttons are visible (non-functional until issue #005)
- [ ] All tests pass with `npm test`
