# Migrate ProgramDetailView to use `statusBadgeClass` from section utils

Status: ready

## What to build

Delete ProgramDetailView's private `seatBadgeClass` function and import `statusBadgeClass` from `@/utils/section` instead. No logic change — the implementations are identical. This is a pure structural migration.

Note: ProgramDetailView's section data comes from the `getCourseSections` endpoint and uses PascalCase fields (`sec.Status`). `statusBadgeClass` takes a plain status string, so the callsite `seatBadgeClass(sec.Status)` becomes `statusBadgeClass(sec.Status)` — no field-name mapping needed.

## Acceptance criteria

- [ ] ProgramDetailView no longer defines `seatBadgeClass` locally
- [ ] ProgramDetailView imports `statusBadgeClass` from `@/utils/section`
- [ ] Template callsite updated from `seatBadgeClass(sec.Status)` to `statusBadgeClass(sec.Status)`
- [ ] No visual or behavioral changes — badge colors are identical to before
- [ ] All existing `ProgramDetailView.actions.test.js` tests pass without modification

## Blocked by

- Issue #01 — `src/utils/section.js` must exist first
