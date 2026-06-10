Status: done

## What to build

Landing page visible to all roles including Visitors. Displays:

1. **Intro Banner** — fetched from backend; displays admin-configured copy (announcements, welcome messaging).
2. **Important Dates ticker** — a scrolling horizontal ticker showing admin-entered deadline dates (label + date), ordered by date ascending.

Both sections degrade gracefully if the backend returns empty data.

## Acceptance criteria

- [x] Home page route is accessible to Visitors (no auth required)
- [x] Intro Banner content is fetched from backend and rendered
- [x] Important Dates display as a scrolling ticker ordered by date ascending
- [x] Page renders without errors when either data set is empty
- [x] Layout is mobile-first; reads comfortably on a 375px viewport
- [x] School Crimson (`#ac1a2f`) is used as the primary accent; all text/background combinations pass WCAG 2.1 AA contrast

## Blocked by

- `01-app-bootstrap`
