Status: ready-for-human

## What to build

Section search is the core browsing surface. Implement a `useSearch` composable that holds filter state and fetches results, and render results as a Section card list per ADR-0005.

Filter panel — field names and backend param format to be confirmed by maintainer (see Comments). Known filters: Term, Subject, Modality, day/time range.

Each Section card shows: Course code, Section Number, title, instructor, modality, meeting days/times, seat availability badge. Section detail is accessible via card expansion or modal and includes Course description, prerequisites, and Course Linkage (if configured).

Pagination or virtual scroll applied when result count exceeds a manageable threshold.

## Acceptance criteria

- [ ] `useSearch` composable holds filter state and exposes `results`, `isLoading`
- [ ] Changing any filter triggers a new search without a page reload
- [ ] Each Section card displays: Course code, Section Number, title, instructor, modality, meeting slots, seat availability badge
- [ ] Expanding/opening a Section shows Course description, prerequisites, and Course Linkage if present
- [ ] Search handles empty results gracefully
- [ ] Pagination or virtual scroll activates above a threshold; performance does not degrade on large result sets
- [ ] All filter param names match the confirmed backend API contract (to be added in Comments)

## Blocked by

- `01-app-bootstrap`

## Comments

<!-- Maintainer: add complete search API params (field names, types, backend format) here before promoting to ready-for-agent. This contract also drives the Schedule Builder filter panel (11-schedule-builder). -->
