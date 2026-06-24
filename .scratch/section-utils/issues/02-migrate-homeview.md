# Migrate HomeView to shared section and time utils

Status: ready

## What to build

Delete the four private functions from HomeView's script block and replace each callsite with an import from the new shared utilities. No logic changes — this is a pure structural migration. All existing `HomeView.display.test.js` tests must remain green.

Functions to delete from HomeView:
- `formatTime(start, end)` — range formatter (not the single-value version in `time.js`)
- `isActionable(sec)`
- `regExpired(sec, now)`
- `seatBadge(s)`

Imports to add:
- `isActionable`, `seatBadge` from `@/utils/section`
- `formatTimeRange` from `@/utils/time`

Template callsites: `formatTime(sec.StartTime, sec.EndTime)` and `formatTime(entry.startTime, entry.endTime)` → `formatTimeRange(...)`.

## Acceptance criteria

- [ ] HomeView no longer defines `formatTime`, `isActionable`, `regExpired`, or `seatBadge` locally
- [ ] HomeView imports `isActionable` and `seatBadge` from `@/utils/section`
- [ ] HomeView imports `formatTimeRange` from `@/utils/time`
- [ ] All template `formatTime(s, e)` callsites updated to `formatTimeRange(s, e)`
- [ ] No visual or behavioral changes — output is identical to before
- [ ] `HomeView.display.test.js` passes without modification

## Blocked by

- Issue #01 — `src/utils/section.js` and `formatTimeRange` must exist first
