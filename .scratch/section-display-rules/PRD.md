# Section Display Rules — HomeView Course/Section List

Status: ready-for-agent

## Problem Statement

Students browsing the course search results in HomeView see incomplete or inaccurate information at the section level. Several business rules from the previous registration portal (status deadlines, campus locations, additional meeting times, fees, registration windows) were not carried forward into the new Vue portal. Students may attempt to register for sections whose deadline has passed, see misleading seat availability, miss fee disclosures, or not know which campus they need to travel to.

## Solution

Fully implement the section row display logic in HomeView so that every field the student needs to make a registration decision is visible, accurate, and formatted consistently. This includes: correct status badges (including expired registration), accurate campus/location labels derived from `SectionLoc`, secondary meeting rows for lab/multi-block sections, fee disclosure, printed comments, section date ranges, and registration window awareness (`isFuture`). Action buttons are gated to only appear when registration is currently possible.

## User Stories

1. As a student, I want to see a "Waitlist Available" badge on a closed section that accepts waitlist entries, so that I know I can still get a spot.
2. As a student, I want closed sections with no waitlist to show "Closed" clearly, so that I do not waste time clicking on a dead end.
3. As a student, I want a "Cancelled" badge on cancelled sections, so that I know the section will not run.
4. As a student, I want to see "Registration Closed" on a section whose add deadline has passed, so that I do not try to register for it.
5. As a student, I want to see the number of open seats on sections that are currently open, so that I can gauge competition before registering.
6. As a student browsing an open section with no visible seats, I want a clean display (no seat count), so that I am not misled about unavailability when seats are administratively held.
7. As a student, I want to see "Online Learning" for fully asynchronous sections (SectionLoc 320), so that I know I do not need to travel to campus.
8. As a student, I want to see "Online Learning with Meeting Times" for online sections that still have scheduled sessions, so that I know to plan for synchronous attendance.
9. As a student, I want to see the specific campus name (e.g., "Centerville Campus", "Huber Heights Learning Center") for off-main-campus sections, so that I know where to go.
10. As a student, I want the default "Downtown Dayton Campus" to be implied and not clutter rows for the majority of sections that meet there.
11. As a student, I want to see "FlexPace" for self-paced sections, so that I understand the delivery model before registering.
12. As a student, I want to see "Blended Learning" for sections delivered in a hybrid remote/virtual format, so that I understand the modality.
13. As a student, I want to see the building and room number for in-person sections, so that I know where to show up on the first day.
14. As a student browsing a section with a satellite location, I want the satellite location name shown instead of the building code, so that I get a human-readable location.
15. As a student, I want to see a second meeting row when a section has an additional schedule block (e.g., a lab period in a different room), so that I know my full weekly time commitment.
16. As a student, I want to see the days and time range for each meeting block in a normalized format (e.g., "1:00–4:30 PM"), so that the schedule is easy to read.
17. As a student, I want to see any special instructions or notices printed for a section (e.g., uniform requirements, contact info), so that I am prepared before the first day.
18. As a student, I want to see the section's start and end dates, so that I know when a compressed or part-of-term section runs.
19. As a student enrolled in a CBE (Competency-Based Education) section, I want section dates suppressed, so that I am not confused by self-paced scheduling.
20. As a student, I want to see any additional fees (lab fee, other fee) disclosed on the section row, so that I am not surprised at checkout.
21. As a student browsing a future-term section not yet open for registration, I want to see "Registration opens [date]" instead of a Register button, so that I know when to come back.
22. As a student, I want to still be able to add a future-term section to my cart for planning purposes, so that I can prepare my schedule in advance.
23. As a student, I want "Register Now" and "Waitlist Now" to be hidden when registration has expired, so that I am not prompted to take an action that will fail.
24. As a student, I want to still be able to add an expired-registration section to my cart, so that I can track courses I'm interested in.
25. As an unauthenticated visitor, I want "Sign in to register" to only appear for sections that are currently actionable (not expired, not future), so that I am not prompted to sign in for nothing.
26. As a student on a mobile device, I want all section row information to be legible and not overflow, so that I can browse on the go.

## Implementation Decisions

### Status Badge Logic

The `seatBadgeLabel` and `seatBadgeClass` functions are rewritten to implement this precedence:

| Condition | Label | Color |
|---|---|---|
| `status === 'Cancelled'` | "Cancelled" | gray |
| `status === 'Closed'` + `waitListAllowed === 'Y'` | "Waitlist Available" | amber |
| `status === 'Closed'` + `waitListAllowed === 'N'` | "Closed" | red |
| `status === 'Open'` + `regExpired(sec)` | "Registration Closed" | gray |
| `status === 'Open'` + `openSeats > 0` | "Open · X seats" | green |
| `status === 'Open'` + `openSeats === 0` | *(render nothing)* | — |

`status` values from the API are `Open`/`Closed`/`Cancelled` (case-sensitive as returned). There is no `Waitlist` status value — waitlist eligibility is always derived from `Closed + waitListAllowed`.

### Registration Expiry (`regExpired`)

```
regExpired(sec):
  deadline = parse(sec.regEndDate)          // "MM/DD/YYYY HH:MM"
  today    = now()
  if sec.SectionLoc === '320':
    today = today − 2 days                  // online sections get a 2-day grace window
  return deadline < today
```

The 2-day grace applies only to SectionLoc `'320'` (pure async Online Learning). Online sections with meeting times (`'321'`, `'345'`) use the raw `regEndDate`.

### Location Display

The `iconTitle` field is removed from the section row. Location is derived from a priority chain:

1. `isFlexpace === 1` → "FlexPace" (overrides everything)
2. `SectionLoc === '320'` → "Online Learning"
3. `SectionLoc === '321'` or `'345'` → "Online Learning with Meeting Times"
4. `strippedBuilding === 'RMT'` or `'VIR'` → "Blended Learning"
5. `SectionLoc` in lookup table → campus label (see table below) + room
6. `SectionLoc` empty → room only (Downtown Dayton is the implied default)

**SectionLoc → campus label lookup:**

| SectionLoc | Label |
|---|---|
| `110`, `329` | Centerville Campus |
| `310`, `328` | Huber Heights Learning Center |
| `300`, `327` | Englewood Learning Center |
| `210` | Preble County Learning Center |
| `200`, `326` | Courseview Campus Center (Mason) |
| `330`, `OFF` | Other Off Campus Location |

**Room display:** use `satLocation` when non-empty (satellite name); otherwise use `building`. Strip the `zzz` suffix from both fields: `value.replace(/zzz$/i, '').trim()`.

### Additional Schedule (`additionalSched`)

When `additionalSched` is a non-empty array, render one additional row per entry below the primary meeting row. Each row shows:
- `entry.Days` + normalized time range (`entry.startTime`–`entry.endTime`)
- Stripped building or satLocation (same zzz-strip rule)

The `startTimeDisplay`/`endTimeDisplay` fields have an artifact `"a"` prefix — use `startTime`/`endTime` directly.

### Action Button Gating

`isActionable(sec)` currently gates Register/Waitlist buttons. It is updated to:

```
canRegister = (status === 'Open') || (waitListAllowed === 'Y' && status !== 'Cancelled')
isActionable(sec) = canRegister && !regExpired(sec) && !sec.isFuture
```

"Add to Cart" is **not** gated by `isActionable` — it remains available for all non-Cancelled sections including future and expired ones.

For `isFuture === true` sections, render "Registration opens [formatted regStartDate]" as a static hint in place of the Register/Waitlist button.

### Extra Info Lines

Below the location line, render in order when conditions are met:

- **Printed comments:** `sec.printedComments` when non-empty. (`comments` field is a server-side duplicate — ignore it.)
- **Section dates:** `startDate`–`endDate` (formatted) when `startDate` is non-empty and `sec.restrictions` does not contain `"CBE"` (case-insensitive).
- **Fees:** non-zero `sec.otherFee` and `sec.labFee` shown as small badges (e.g., "+ $125 fee").

### Date and Time Formatting

- **Times:** strip leading zero, combine shared AM/PM suffix → `"1:00–4:30 PM"`. If start and end differ in meridiem, show both → `"11:00 AM–1:00 PM"`.
- **Dates:** parse `"MM/DD/YYYY"` or `"MM/DD/YYYY HH:MM"` and format as `"Aug 24, 2026"`.

### Section Sort Order

Sections are sorted server-side. No client-side sort is needed or implemented.

## Testing Decisions

**What makes a good test:** assert on rendered text and element presence/absence in the DOM — never on internal function logic or CSS class names. A test should describe what a student sees, not how the code achieves it.

**Seams:**
- Fix the import in `SearchView.actions.test.js` → `HomeView.vue` (the file was renamed; the test references a path that does not exist).
- Add `HomeView.display.test.js` for all rendering rules in this PRD. This file follows the same mount-with-mocked-composables pattern as `SearchView.actions.test.js`.

**Modules tested:** `HomeView.vue` (mounted). Display helper functions are not extracted to a composable — they are tested through rendered output.

**Prior art:** `SearchView.actions.test.js` — uses `mount(HomeView)` with `makeSection()` factory and `vi.mock` for composables and services. Extend `makeSection()` with the new fields (`SectionLoc`, `regEndDate`, `isFuture`, `regStartDate`, `additionalSched`, `otherFee`, `labFee`, `printedComments`, `startDate`, `endDate`, `restrictions`, `satLocation`, `isFlexpace`, `waitListAllowed`).

**Key test cases:**
- Each of the 6 status badge conditions renders the correct label
- `regExpired`: a section 1 day past deadline shows "Registration Closed"; a SectionLoc-320 section 1 day past deadline does NOT (grace window); a SectionLoc-320 section 3 days past deadline does
- Each `SectionLoc` code renders the correct campus label
- `satLocation` non-empty overrides building display
- `zzz` suffix is stripped from building and satLocation
- `additionalSched` with one entry renders a second meeting row
- `printedComments` appears when non-empty; absent when empty
- `startDate`/`endDate` appear when `startDate` is set and `restrictions` lacks "CBE"; suppressed when "CBE" is present
- Non-zero `otherFee` renders a fee badge; zero does not
- `isFuture` section shows "Registration opens [date]", no Register button, Add to Cart present
- `regExpired` section shows no Register button, Add to Cart present
- Cancelled section shows no Add to Cart button

## Out of Scope

- Course-level card display changes (modality badges, credit hours, prerequisite display)
- CartView, ScheduleView, ScheduleBuilderView section display — only HomeView is in scope
- Waitlist position or queue length (not available in the API)
- `withDate` / `withoutDate` fields (not used in this application)
- `dayModels` array (used for calendar integration only)
- Admin-facing views

## Further Notes

- The `makeSection()` factory in `SearchView.actions.test.js` uses stale field values (`iconTitle: 'Face to Face'`, `location: 'Main Campus'`). When fixing the import, also update the factory to reflect real API field shapes.
- `SectionLoc` is empty string (not null/undefined) for Downtown Dayton sections — guard with `sec.SectionLoc` truthiness check, not a null check.
- `openSeats` and `seatCapacity` arrive as floats from the API (`3.0`, `12.0`). Display as integers.
- The API `status` field is reliably title-cased (`Open`, `Closed`, `Cancelled`). Case-insensitive comparison is not required for new code, but do not rely on this for the Cancelled badge since legacy data may vary.
