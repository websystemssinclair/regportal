# Section Utils — Extract Section Display Logic into a Testable Module

Status: ready-for-agent

## Problem Statement

Section display logic — seat availability badges, registration actionability, time-range formatting — is implemented as private functions buried inside view components. Developers cannot test these functions directly; tests must mount a full view component to reach them. The same logic is duplicated across multiple views with divergent implementations. Notably, CartView's `isActionable` check omits the registration deadline guard and `isFuture` flag that HomeView applies, so CartView incorrectly treats deadline-expired and future-registration sections as actionable — surfacing Register and Waitlist buttons that will fail at the API.

## Solution

Extract the three section display functions into a new `src/utils/section.js` plain utility module. Fix CartView's `isActionable` bug as part of the migration (the fix is a behavioral change and is called out explicitly in the PR). Add `formatTimeRange(start, end)` to `src/utils/time.js` as a named export, giving HomeView's time-range formatter a proper home. Write direct unit tests for all public exports in a new `src/utils/__tests__/section.test.js` file. Views delete their private implementations and import from the shared module.

## User Stories

1. As a developer writing tests for section display logic, I want to import pure functions directly from a utility module, so that I do not need to mount a full view component to test them.
2. As a developer fixing a seat availability or actionability bug, I want to fix it in one place, so that the fix applies to every view that displays sections.
3. As a developer adding a new view that displays sections, I want a shared utility with the canonical display logic, so that I do not reimplement it.
4. As a developer reading `src/utils/section.js`, I want to see the complete actionability and badge rules in one file, so that I can reason about the rules without cross-referencing multiple views.
5. As a student on CartView with a section whose registration deadline has passed, I want the Register and Waitlist buttons to be hidden, so that I am not prompted to take an action that will fail at the API.
6. As a student on CartView with a future-registration section, I want the Register button to be hidden, so that I am not prompted to register before the window opens.
7. As a developer writing a unit test for the SectionLoc 320 two-day grace window rule, I want to call `isActionable` directly with a constructed section object, so that the test does not depend on a mounted component or mocked composable chain.
8. As a developer reading CartView, I want to see that it imports `isActionable` from the same module HomeView uses, so that I have confidence the deadline logic is consistent.
9. As a developer adding a time-range display elsewhere in the app, I want `formatTimeRange` available from `src/utils/time`, so that I do not duplicate the AM/PM collapsing logic.

## Implementation Decisions

### New module: `src/utils/section.js`

Three named exports. All are pure functions — no Vue reactivity, no store access.

**`isActionable(sec)`**

Unified from HomeView and CartView. The CartView version was missing the deadline guard and `isFuture` check; this is a bug fix, not merely a refactor. The unified rule:

```
canRegister = (sec.status === 'Open') || (sec.waitListAllowed === 'Y' && sec.status !== 'Cancelled')
isActionable(sec) = canRegister && !regExpired(sec, now()) && !sec.isFuture
```

`regExpired` (described below) is a private implementation detail — it is not exported.

**`seatBadge(sec)`**

HomeView's rich badge. Returns `{ cls, label }`. Implements this precedence:

| Condition | `label` | `cls` |
|---|---|---|
| `status === 'Cancelled'` | "Cancelled" | gray |
| `status === 'Closed'` + `waitListAllowed === 'Y'` | "Waitlist Available" | amber |
| `status === 'Closed'` + `waitListAllowed === 'N'` | "Closed" | red |
| `status === 'Open'` + `regExpired(sec)` | "Registration Closed" | gray |
| `status === 'Open'` + `openSeats > 0` | "Open · X seats" | green |
| otherwise | `""` | `""` |

**`statusBadgeClass(status)`**

ProgramDetailView's simple colorizer. Takes only a status string (not a full section object — ProgramDetailView's sections come from a different endpoint and do not carry `openSeats`, `regEndDate`, or `waitListAllowed`). Returns a CSS class string. The two functions serve different views with different data shapes and are intentionally kept distinct.

### Private: `regExpired(sec, now)`

Not exported. Called by both `isActionable` and `seatBadge`. Encodes the SectionLoc 320 two-day grace window:

```
regExpired(sec, now):
  if !sec.regEndDate → false
  deadline = parse(sec.regEndDate)   // "MM/DD/YYYY HH:MM"
  if sec.SectionLoc === '320':
    return deadline < (now − 2 days) // async online gets a grace window
  return deadline < now
```

The grace window applies only to SectionLoc `'320'` (pure async online). Online sections with meeting times (`'321'`, `'345'`) use the raw `regEndDate`.

### Addition to `src/utils/time.js`: `formatTimeRange(start, end)`

HomeView's `formatTime(start, end)` range formatter migrates here under a new name to avoid colliding with the existing `formatTime(timeStr)` single-value export. Collapses shared AM/PM suffixes (e.g., "9:00–10:30 AM"). HomeView template callsites are updated from `formatTime(s, e)` to `formatTimeRange(s, e)`.

### View migrations

- HomeView: delete private `formatTime`, `isActionable`, `regExpired`, `seatBadge`; import `isActionable`, `seatBadge` from `section.js`; import `formatTimeRange` from `time.js`
- CartView: delete private `isActionable`; import `isActionable` from `section.js`; **this is a behavior change** — CartView gains the deadline guard and `isFuture` check for the first time
- ProgramDetailView: delete private `seatBadgeClass`; import `statusBadgeClass` from `section.js`

### CartView behavior change

The PR description must call out that CartView's Register/Waitlist buttons will now be hidden for sections whose `regEndDate` has passed and for `isFuture` sections. This is the correct behavior. Existing CartView test fixtures do not supply `regEndDate`, so no existing tests break — but QA should verify the registration flow for cart items near their deadline.

## Testing Decisions

**What makes a good test:** call the exported function directly with a plain object and assert on the return value. Never test CSS class strings by name — assert on the label or the logical outcome. Never mount a component to reach these functions.

**Seam:** `src/utils/section.js` — the three named exports are the single test seam. The `regExpired` grace-window rule, previously only reachable through a mounted HomeView, becomes directly exercisable.

**New test file:** `src/utils/__tests__/section.test.js` — required in the same PR, not a follow-up.

**Prior art:** `src/utils/__tests__/time.test.js` — imports pure functions, asserts on return values, no Vue runtime or component mounting. Follow the same structure.

**Key cases for `isActionable`:**
- Open section, no `regEndDate` → actionable
- Open section, `regEndDate` in the future → actionable
- Open section, `regEndDate` in the past → not actionable
- SectionLoc 320, `regEndDate` 1 day past → actionable (grace window)
- SectionLoc 320, `regEndDate` 3 days past → not actionable
- Open section, `isFuture: true` → not actionable
- Cancelled + waitListAllowed Y → not actionable
- Closed + waitListAllowed Y, no regEndDate → actionable

**Key cases for `seatBadge`:**
- Each of the six badge conditions returns the correct label
- `openSeats` displayed as integer (API returns floats)
- `regExpired` section with Open status → "Registration Closed", not "Open · X seats"

**Key cases for `statusBadgeClass`:**
- Open → green classes
- Waitlist → yellow classes
- Closed / other → red classes

**Existing tests:** HomeView.display.test.js covers `regExpired` behavior through a mounted view. Those tests remain valid as integration tests and do not need to be migrated — they verify that the view wires the function correctly. The new unit tests verify the function itself.

## Out of Scope

- Normalizing ProgramDetailView's section data shape to match HomeView's (different endpoint, PascalCase fields, different available fields)
- Extracting `modalityText` or location display helpers from HomeView — those have no duplication across views and are out of scope for this pass
- Migrating ScheduleView's time formatting — it already imports `formatTime` from `utils/time` correctly
- Changing any visual output in any view — this is a pure structural extraction with one bug fix
- Adding deadline-guard UI to ProgramDetailView (it does not have `regEndDate` in its section data)

## Further Notes

- Sections in CartView use lowercase field names (`status`, `waitListAllowed`) consistent with HomeView — the shared `isActionable` function works without field-name mapping
- ProgramDetailView sections use PascalCase (`sec.Status`) from the `getCourseSections` endpoint — `statusBadgeClass` takes a plain status string, so no mapping is needed at the call site either
- `openSeats` arrives as a float from the API — `seatBadge` should use `Math.floor(s.openSeats)` for the label, consistent with current HomeView behavior
