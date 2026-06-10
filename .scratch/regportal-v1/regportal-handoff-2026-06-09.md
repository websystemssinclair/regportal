# RegPortal Vue — Handoff Document
**Date:** 2026-06-09  
**Project:** `C:\Users\brian.cooney\workspace\regportal-vue`  
**Branch:** `main`

---

## What was done this session

### Issue 04 — Home Page (closed)
Verified all 6 acceptance criteria were already met. Marked `Status: done` and all checklist items checked in `.scratch/regportal-v1/issues/04-home-page.md`.

### Issue 05 — Section Search (grilled, TDD'd, prototype built, view shipped)

#### Grilling session (`/grill-with-docs`)
A full design grilling session resolved all open questions before implementation. Key findings:

- **Two-level architecture confirmed:** The `/Courses?...` search endpoint returns Course rows (no instructor, meeting times, or seat data). Those live on `/Sections/{subject}/{number}/{term}`. The UI is Course cards → Section rows on inline accordion expand. This was a mismatch with the original issue which described flat "Section cards."
- **Server-side pagination required:** Fall/Spring returns ~1,500 results; client-side load-all is not viable.
- **`courseFormat` deprecated:** Modality flags (`isF2F`, `isVirtual`, `isHybrid`, `isFlexpace`) are display-only, not filter params.
- **`building` is a live filter** with 6 known values (see issue file).
- **`termFormat` labels confirmed:** `'12'` = "12 Week", `'ST'` = "All Short Term", others obvious.
- **Course Linkage** has two URL fields: `topicLink` and `previewLink`. CONTEXT.md updated.
- **Inline accordion expand chosen** over separate view (v1 complaint) or modal. See ADR-0007.
- **100+ section edge case:** Show first 20 rows, "Show all X sections" control reveals the rest client-side.
- **`useSearch` scope:** filter params + results/total/isLoading/error only. Expansion state is component-local.

Issue promoted to `ready-for-agent` with full API contract, then implemented and `Status` left as-is (implementation complete — see below).

#### ADR written
`docs/adr/0007-section-search-inline-accordion.md` — inline accordion vs separate view/modal/drawer.

#### CONTEXT.md updates
- `Course Linkage` definition expanded to name `topicLink`/`previewLink` fields and `isActive` server-side filtering.
- `Course Details` updated to include co-requisites.

#### TDD (`/tdd`)
- **`src/services/sectionsService.js`** — replaced wrong stub (`sections`, `sections/${id}`) with three correct functions:
  - `searchCourses(params)` → `GET /Courses`
  - `getCourseDetails(subject, number, term)` → `GET /Courses/{subject}/{number}/{term}`
  - `getCourseSections(subject, number, term, params)` → `GET /Sections/{subject}/{number}/{term}`
  - Tests: `src/services/__tests__/sectionsService.test.js` (3 tests)
- **`src/composables/useSearch.js`** — new composable with filter defaults, `fetch()`, full state contract.
  - Tests: `src/composables/__tests__/useSearch.test.js` (6 tests)
- All 50 tests pass.

#### Prototype (`/prototype`)
Three UI variants built at `/prototype/search?variant=A/B/C`:
- A: Sidebar filters + card list
- B: Top bar + dense table rows
- C: Crimson hero + filter drawer + card grid

**Winner: C's hero/drawer + A's card style.** User selected this combination.

#### SearchView built
`src/views/SearchView.vue` — the real production view at `/search` route. Implements:
- Crimson hero banner with keyword search + "Filters" button (active filter count badge)
- Slide-over drawer with all confirmed filter params
- Course card list (A style): code/title/credits/modality/prereq/open badge/chevron
- Inline accordion expand (ADR-0007): course description, coReqs, topicLink, previewLink, then Section rows
- Section rows: SectionNo, instructor, modality, days/times, seat badge (Open/Closed/Waitlist/Cancelled), Add to Cart button
- "Show all X sections" cap at 20
- Server-side pagination (prev/next + page numbers ±2 of current)
- Loading skeleton, empty state, error state

Prototype files deleted. Route added to `src/router/index.js`.

---

## Current state

### Test suite
50/50 passing. No regressions.

### What's NOT done yet in SearchView
- **Register Now button** — `Add to Cart` is stubbed (no store/service wired). Cart store and registration actions are separate issues.
- **Term select** — currently a free-text input. Should be a `<select>` populated from reference data once the terms list is confirmed in the API response shape.
- **`timeChoice=range`** mode — drawer has segments UI only. Range (start/end time + day checkboxes) is implemented in state but not exposed in the drawer UI yet.
- **`getCourseDetails`** call on card expand — the current implementation uses the description/preReqs already in the search results row. The separate `/Courses/{subject}/{number}/{term}` endpoint (which adds `coReqs`, `topicLink`, `previewLink`) is NOT called on expand yet. The view renders those fields if present in the search row, but they won't be until the detail endpoint is wired.

---

## Key files changed this session

| File | What |
|------|------|
| `.scratch/regportal-v1/issues/04-home-page.md` | Closed |
| `.scratch/regportal-v1/issues/05-section-search.md` | Fully specified, ready-for-agent |
| `docs/adr/0007-section-search-inline-accordion.md` | New ADR |
| `CONTEXT.md` | Course Linkage + Course Details updated |
| `src/services/sectionsService.js` | Replaced stub with 3 correct functions |
| `src/services/__tests__/sectionsService.test.js` | New (3 tests) |
| `src/composables/useSearch.js` | New composable |
| `src/composables/__tests__/useSearch.test.js` | New (6 tests) |
| `src/views/SearchView.vue` | New production view |
| `src/router/index.js` | Added `/search` route |

---

## Next logical work

### Immediate
1. **Wire `getCourseDetails` on card expand** — call `/Courses/{subject}/{number}/{term}` when a card is first expanded to hydrate `coReqs`, `topicLink`, `previewLink` that are missing from the search row.
2. **Cart integration** — "Add to Cart" buttons in SearchView need to call the cart store/service. See `.scratch/regportal-v1/issues/` for the Cart issue.
3. **Term select from reference data** — replace the free-text term input with a `<select>` once the reference data shape for terms is confirmed.
4. **Range time filter UI** — expose `timeChoice=range` with start/end time inputs and day-of-week checkboxes in the drawer (state already wired in `useSearch`).

### Backlog issues to check
- `.scratch/regportal-v1/issues/` — browse for `ready-for-agent` or `ready-for-human` issues.
- Issue 11 (`11-schedule-builder`) shares the same filter panel contract — coordinate with this session's confirmed params.

---

## Suggested skills for next session

- **`/grill-with-docs`** — if tackling a new issue that has open design questions (e.g. Schedule Builder, Cart).
- **`/tdd`** — for implementing new composables or services (pattern well-established: mock service → test composable behavior).
- **`/impeccable`** — SearchView is functional but unpolished; could use a UI pass for spacing, mobile behavior, accessibility.

---

## Dev environment notes

- Dev server: `npm run dev` → `http://localhost:3000`
- Tests: `npx vitest run`
- Playwright screenshots work via: `node pw-screenshot.cjs` (script was deleted after use; recreate from conversation if needed)
- No `.env` file in repo — API base URL must be set via `VITE_API_BASE_URL` / `VITE_API_APP_PATH` env vars for real backend calls.
