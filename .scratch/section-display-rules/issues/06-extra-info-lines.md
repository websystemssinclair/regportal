# Extra info lines: comments, dates, fees

Status: done

## Parent

`.scratch/section-display-rules/PRD.md`

## What to build

Add three optional info lines below the location line on each section row. Each line is conditional — render it only when the relevant data is present and applicable.

**Render order (when conditions met):**

1. **Printed comments** — `sec.printedComments` when non-empty. The `comments` field is a server-side duplicate — ignore it entirely.

2. **Section dates** — `formatDate(sec.startDate)` – `formatDate(sec.endDate)` when:
   - `sec.startDate` is non-empty, AND
   - `sec.restrictions` does not contain `"CBE"` (case-insensitive match)
   
   Use the `formatDate` utility from issue 04.

3. **Fees** — for each of `sec.otherFee` and `sec.labFee`, render a small badge (e.g., "+ $125 fee") when the value is non-zero. If both are non-zero, render two badges. Zero or missing values render nothing.

## Acceptance criteria

- [x] `printedComments` non-empty → text rendered below location line
- [x] `printedComments` empty → nothing rendered
- [x] `comments` field is never rendered (even when non-empty)
- [x] `startDate` set, no CBE in restrictions → "Aug 24, 2026 – Dec 13, 2026" rendered
- [x] `startDate` set, restrictions contains "CBE" (any case) → dates suppressed
- [x] `startDate` empty → dates suppressed
- [x] `otherFee: 125` → "+ $125 fee" badge rendered
- [x] `labFee: 50` → "+ $50 fee" badge rendered
- [x] Both fees non-zero → two fee badges rendered
- [x] `otherFee: 0` → no fee badge
- [x] All cases covered in `HomeView.display.test.js`

## Blocked by

- `04-additional-schedule-rows.md` (provides `formatDate`)
