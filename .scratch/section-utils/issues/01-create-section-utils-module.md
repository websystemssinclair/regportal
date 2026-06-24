# Create `src/utils/section.js` + `formatTimeRange` in `time.js` + unit tests

Status: ready

## What to build

Introduce a new `src/utils/section.js` plain utility module with three named exports. All are pure functions — no Vue reactivity, no store access. Write a full `src/utils/__tests__/section.test.js` test file in the same PR. Also add `formatTimeRange(start, end)` to `src/utils/time.js` and cover it in `src/utils/__tests__/time.test.js`.

No view files change in this issue — view migrations are in issues #02–#04.

**`isActionable(sec)`**

Unified from HomeView and CartView. CartView was missing the deadline guard and `isFuture` check (a bug fixed in issue #03). The rule:

```
canRegister = (sec.status === 'Open') || (sec.waitListAllowed === 'Y' && sec.status !== 'Cancelled')
isActionable(sec) = canRegister && !regExpired(sec, now()) && !sec.isFuture
```

**`seatBadge(sec)`**

Returns `{ cls, label }`. Precedence table:

| Condition | `label` | `cls` |
|---|---|---|
| `status === 'Cancelled'` | "Cancelled" | gray |
| `status === 'Closed'` + `waitListAllowed === 'Y'` | "Waitlist Available" | amber |
| `status === 'Closed'` + `waitListAllowed === 'N'` | "Closed" | red |
| `status === 'Open'` + `regExpired(sec)` | "Registration Closed" | gray |
| `status === 'Open'` + `openSeats > 0` | "Open · X seats" | green |
| otherwise | `""` | `""` |

`openSeats` arrives as a float from the API — use `Math.floor(s.openSeats)` for the label.

**`statusBadgeClass(status)`**

ProgramDetailView's simple colorizer. Takes only a status string (not a full section object). Returns a CSS class string.

**Private: `regExpired(sec, now)`**

Not exported. Encodes the SectionLoc 320 two-day grace window:

```
regExpired(sec, now):
  if !sec.regEndDate → false
  deadline = parse(sec.regEndDate)   // "MM/DD/YYYY HH:MM"
  if sec.SectionLoc === '320':
    return deadline < (now − 2 days)
  return deadline < now
```

**`formatTimeRange(start, end)` in `src/utils/time.js`**

HomeView's range formatter, migrated here under a new name to avoid colliding with the existing single-value `formatTime(timeStr)`. Collapses shared AM/PM suffixes (e.g., "9:00–10:30 AM").

Prior art for test structure: `src/utils/__tests__/time.test.js` — imports pure functions, asserts on return values, no Vue runtime.

## Acceptance criteria

- [ ] `src/utils/section.js` exists and exports `isActionable`, `seatBadge`, `statusBadgeClass`
- [ ] `regExpired` is not exported (private implementation detail)
- [ ] `isActionable`: Open section with no `regEndDate` → actionable
- [ ] `isActionable`: Open section with `regEndDate` in the future → actionable
- [ ] `isActionable`: Open section with `regEndDate` in the past → not actionable
- [ ] `isActionable`: SectionLoc `'320'` with `regEndDate` 1 day past → actionable (grace window)
- [ ] `isActionable`: SectionLoc `'320'` with `regEndDate` 3 days past → not actionable
- [ ] `isActionable`: Open section with `isFuture: true` → not actionable
- [ ] `isActionable`: Cancelled + `waitListAllowed: 'Y'` → not actionable
- [ ] `isActionable`: Closed + `waitListAllowed: 'Y'`, no `regEndDate` → actionable
- [ ] `seatBadge`: each of the six badge conditions returns the correct label
- [ ] `seatBadge`: `openSeats` displayed as integer (API returns floats)
- [ ] `seatBadge`: Open + `regExpired` → "Registration Closed", not "Open · X seats"
- [ ] `statusBadgeClass`: Open → green classes, Waitlist → yellow classes, Closed/other → red classes
- [ ] `formatTimeRange` added to `src/utils/time.js` as a named export
- [ ] `formatTimeRange` collapses shared AM/PM suffix (e.g., "9:00 AM"/"10:30 AM" → "9:00–10:30 AM")
- [ ] `src/utils/__tests__/section.test.js` exists, covers all cases above, and passes
- [ ] `formatTimeRange` tests added to `src/utils/__tests__/time.test.js`
- [ ] No view files are modified

## Blocked by

None — can start immediately
