Status: done

## What to build

Section search is the core browsing surface. Implement a `useSearch` composable that holds filter state and fetches results, and render results as a two-level card list per ADR-0005 and ADR-0007.

The search endpoint (`/Courses?...`) returns **Course rows** — no instructor, meeting times, or seat data. Those live on the `/Sections/` endpoint per Course. The UI is therefore two-level:

1. **Course cards** in search results — show Course code, title, credit hours, prerequisites, modality availability flags (`isF2F`, `isVirtual`, `isHybrid`, `isFlexpace`), open/closed status.
2. **Section rows** inline on expand (ADR-0007) — loaded lazily on card expand via `/Sections/{subject}/{number}/{term}` (returns all sections, no limit param). First 20 rows shown by default; a "Show all X sections" control loads the rest client-side.

`useSearch` owns: filter params, `results` (Course rows), `total`, `isLoading`, `error`, and the `fetch` action. Expansion state (which card is open, its loaded Sections, per-card loading) lives in the component — it is transient UI state that resets on page turn.

### Filter panel params (confirmed)

- `keyword` — free text
- `term` — YYTT format (26FA, 27SP, 27SU); sourced from reference data
- `subjectCode` — 3-char subject code; sourced from reference data
- `termFormat` — term part: `'all'` (All), `'Full'` (Full Term), `'A'` (A Term), `'B'` (B Term), `'12'` (12 Week), `'ST'` (All Short Term)
- `building` — location: `'any'` / `'SCC'` (Sinclair Dayton) / `'CENT'` (Centerville) / `'CvCC'` (Courseview Mason) / `'WWW'` (Online) / `'other'` (Off Campus)
- `timeChoice` — `'segments'` (segOptions: `'any'` / Mornings 6am–noon / Afternoons noon–5pm / Evenings 5pm–11pm; same labels as Schedule Builder) or `'range'` (rangeStart min 6am, rangeEnd max 11pm, daysOfWeek: M/T/W/R/F/S/U checkboxes)
- `creditHoursMin` / `creditHoursMax` — numeric
- `page`, `start`, `limit` — server-side pagination

`courseFormat` is deprecated — omit. Modality flags are display-only, not a filter param.

### API endpoints

The existing `sectionsService.js` stub is wrong and must be replaced:

```
GET /Courses?{filter params}                          ← Course search
GET /Courses/{subject}/{number}/{term}                ← Course details (description, preReqs, coReqs, topicLink, previewLink)
GET /Sections/{subject}/{number}/{term}?{filter params} ← Section rows for one Course
```

Note: `SubjectCode` in the `/Sections/` response has trailing spaces — trim before use.

`dayModels` entries encode meeting times as absolute date strings (e.g. `"startTime":"January, 11 2016 10:00:00"`) where the date is a day-of-week placeholder. Extract time only; ignore the date portion.

### Seat availability badge

Per Section row: `openSeats/seatCapacity`. Badge states:
- `status === 'Open'` → green
- `status === 'Closed'` && `waitListAllowed === 'Y'` → amber (Closed / Waitlist)
- `status === 'Closed'` && `waitListAllowed === 'N'` → red (Closed)
- `status === 'Cancelled'` → gray

## Acceptance criteria

- [x] `useSearch` composable holds filter params and exposes `results`, `total`, `isLoading`, `error`; expansion state is component-local
- [x] Changing any filter triggers a new search without a page reload
- [x] Server-side pagination via `page`/`start`/`limit`; page control rendered in UI
- [x] Each Course card displays: Course code, title, credit hours, prerequisites, modality availability flags, open/closed status
- [x] Expanding a Course card (inline accordion per ADR-0007) loads Sections lazily; shows first 20 rows with a "Show all X sections" control for the remainder
- [x] Each Section row shows: Section Number, instructor, modality, meeting days/times, seat availability badge (`openSeats/seatCapacity`), Register Now / Add to Cart
- [x] Expanded Course card shows: description, `preReqs`, `coReqs`, `topicLink`, `previewLink` — each only when non-empty/non-"None"; Course Linkage fields fetched from `/Courses/{subject}/{number}/{term}`
- [x] Search handles empty results gracefully
- [x] `sectionsService.js` updated to match the three confirmed endpoints above

## Blocked by

- `01-app-bootstrap`
