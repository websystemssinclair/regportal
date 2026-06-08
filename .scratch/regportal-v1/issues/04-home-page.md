Status: ready-for-agent

## What to build

Landing page visible to all roles including Visitors. Displays:

1. **Intro Banner** — fetched from backend; displays admin-configured copy (announcements, welcome messaging).
2. **Important Dates ticker** — a scrolling horizontal ticker showing admin-entered deadline dates (label + date), ordered by date ascending.

Both sections degrade gracefully if the backend returns empty data.

## Acceptance criteria

- [ ] Home page route is accessible to Visitors (no auth required)
- [ ] Intro Banner content is fetched from backend and rendered
- [ ] Important Dates display as a scrolling ticker ordered by date ascending
- [ ] Page renders without errors when either data set is empty
- [ ] Layout is mobile-first; reads comfortably on a 375px viewport
- [ ] School Crimson (`#ac1a2f`) is used as the primary accent; all text/background combinations pass WCAG 2.1 AA contrast

## Blocked by

- `01-app-bootstrap`
