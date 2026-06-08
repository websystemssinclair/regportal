Status: ready-for-agent

## What to build

Booklist has two surfaces:

1. **Aggregate view** (top-level route): fetches books for all Sections currently in the Cart plus all registered Sections; groups results by Section.
2. **Per-Section modal**: fetches books for a single Section; accessible from Cart cards and My Schedule cards.

Each book entry shows title, author, ISBN, and an external link button to the campus bookstore. Visible to all roles including Visitors (who have a localStorage Cart).

## Acceptance criteria

- [ ] Aggregate Booklist route is accessible to Visitors and Students
- [ ] Aggregate view fetches books for all Cart Sections (localStorage or backend) and all registered Sections
- [ ] Books are grouped by Section in the aggregate view
- [ ] Per-Section modal opens from a Cart card and shows books for that Section only
- [ ] Per-Section modal opens from a My Schedule card and shows books for that Section only
- [ ] Each book entry shows title, author, ISBN, and a working external link to the campus bookstore
- [ ] View renders gracefully when a Section has no books

## Blocked by

- `06-visitor-cart`
- `10-my-schedule`
