Status: done

## What to build

Populate the right-side panel of each Schedule card with a per-Section detail table. Remove the existing course-code pill list. Move the "Select Schedule" and "Register Now" buttons to the bottom of the full card.

**Detail rows:** Render one row per Section in the Schedule, each with `data-testid="schedule-section-row"`. Each row shows:

| Field | In-person Section | Online Section |
|---|---|---|
| Section ID | `{subjectCode}-{courseNo}-{sectionNo}` (e.g. `ACC-1100-100`) | same |
| Course name | `longName` | same |
| Days / time | formatted days + time range (e.g. `MWF 9:00–10:00 AM`) | `"Online"` |
| Building | `building` value | `"—"` |
| Instructor | `faculty` value | same |

A Section is online when its `days` array is empty or its `startMin` is null.

For days/time formatting, use `formatDays` and `formatTimeRange` from `src/utils/time.js`. `sectionNo` comes from the field added in Issue 01.

**Button placement:** The "Select Schedule" button and the Register Now section (students-only, including `register-card-error` and `register-section-result`) move to the bottom of the card, below the two-column layout. Their behavior and `data-testid` values remain unchanged.

**Confirm building name format:** Before writing the building display logic, read the `building` field on a few normalized Sections (via the composable test fixture or the raw reference data) to confirm it is already a human-readable string (e.g. `"Dayton Campus"`) and not a location ID (e.g. `"SCC"`). If it is an ID, flag the discrepancy as a comment in the issue rather than silently using it, then proceed with whatever value is available.

## Acceptance criteria

- [ ] Each Schedule card renders one `[data-testid="schedule-section-row"]` per Section in that Schedule
- [ ] Each row shows Section ID in `{subjectCode}-{courseNo}-{sectionNo}` format
- [ ] Each row shows the course long name
- [ ] In-person rows show formatted meeting days and time range; online rows show `"Online"` in that column
- [ ] In-person rows show the building name; online rows show `"—"` in that column
- [ ] Each row shows the instructor (`faculty`) name
- [ ] The old course-code pill list is removed
- [ ] "Select Schedule" and "Register Now" buttons appear at the bottom of the card and remain functional
- [ ] New view test asserts: each card renders one `[data-testid="schedule-section-row"]` per Section; online Sections render `"Online"` text in their row
- [ ] Existing select-schedule and register-now tests still pass
- [ ] All tests pass (`npm run test`)
- [ ] No TypeScript in source files (`src/`)

## Comments

**Building field format (2026-06-30):** The `building` field in normalized sections (from `sec.Building` in raw API data) appears to be a room/building code (e.g. `'BLDG-A'` in the composable test fixture), not a human-readable campus name. The `sectionRoom()` utility in `section.js` also treats `building` as a room identifier. The campus-level display name comes from `SECTION_LOC_LABELS[sec.SectionLoc]`, not from `building`. Proceeding with the raw `building` value as-is per spec instructions.

## Blocked by

- Issue 01 (schedule utility functions and sectionNo — provides `sectionNo` field)
- Issue 02 (card shell and summary line — provides the right-panel placeholder to populate)
