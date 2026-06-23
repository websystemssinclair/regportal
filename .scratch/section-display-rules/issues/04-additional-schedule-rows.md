# Additional schedule rows and time/date formatting

Status: done

## Parent

`.scratch/section-display-rules/PRD.md`

## What to build

When a section has entries in `additionalSched`, render one additional meeting row per entry below the primary meeting row. Also introduce the `formatTime` and `formatDate` utility functions that will be reused by issues 05 and 06.

**Additional schedule rows:** for each entry in `sec.additionalSched` (when non-empty array), render a row showing:
- `entry.Days` + formatted time range
- Stripped room (same `satLocation` || `building` + zzz-strip rule as issue 03)

Use `entry.startTime` and `entry.endTime` directly — the `startTimeDisplay`/`endTimeDisplay` fields have a stray `"a"` prefix artifact and must not be used.

**`formatTime(start, end)` utility:**
- Strip leading zero from hours: `"01:00 PM"` → `"1:00 PM"`
- If both share the same meridiem (AM/AM or PM/PM), show it once at the end: `"1:00–4:30 PM"`
- If they differ, show both: `"11:00 AM–1:00 PM"`

**`formatDate(dateStr)` utility:**
- Accepts `"MM/DD/YYYY"` or `"MM/DD/YYYY HH:MM"`
- Returns `"Aug 24, 2026"` format (abbreviated month, no leading zero on day)

Both utilities should also be applied to the **primary** meeting row's `StartTime`/`EndTime` display, replacing the current raw string interpolation.

## Acceptance criteria

- [x] A section with one `additionalSched` entry renders a second meeting row
- [x] A section with two `additionalSched` entries renders two additional rows
- [x] A section with empty `additionalSched` renders no additional rows
- [x] Additional row shows `entry.Days` + formatted time range + stripped room
- [x] `startTimeDisplay`/`endTimeDisplay` are never used
- [x] Primary meeting row also uses normalized time format
- [x] `"01:00 PM"–"04:30 PM"` renders as `"1:00–4:30 PM"`
- [x] `"11:00 AM"–`"01:00 PM"` renders as `"11:00 AM–1:00 PM"`
- [x] `formatDate("08/24/2026")` renders as `"Aug 24, 2026"`
- [x] All cases covered in `HomeView.display.test.js`

## Blocked by

- `01-fix-test-seam.md`
