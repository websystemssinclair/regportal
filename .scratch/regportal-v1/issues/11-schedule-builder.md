Status: done

## What to build

Schedule Builder takes a list of Courses (soft cap: 7) and optional filters and generates up to 50 non-conflicting Schedule combinations.

**Route**: `/schedule-builder` — no role guard (visitor-accessible). View: `src/views/ScheduleBuilderView.vue`.

**Computation**: `useScheduleBuilder` composable dispatches to a dedicated Web Worker (`src/workers/scheduleWorker.js`). The worker uses backtracking with early conflict pruning — it does not materialize all combinations before filtering. Filter changes re-dispatch to the worker without re-fetching Sections from the backend.

**Filters** (same field names as `useSearch` filters — `termFormat`, `building`, `rangeStart`, `rangeEnd`, `daysOfWeek`): day/time range slider (6am–11pm) with preset snapping (Mornings → 6am–noon, Afternoons → noon–5pm, Evenings → 5pm–11pm); modality; location; day-of-week checkboxes. Filter panel is inline in the view (no shared component). Filter changes instantly re-run without a new "Build" click — after the first build, a `watch` on filter state calls `build()` automatically.

**Results**: displayed as selectable mini-grid cards (one per Schedule), M–F columns only, fixed 8am–6pm time range, arranged in a 2-column responsive CSS grid. "Select Schedule" merges all Sections in the chosen Schedule into the Cart (deduplicates by `CourseKey`) then navigates to `/cart`.

Known constraint: SAML redirect triggered from the Schedule Builder discards current results. Student must rebuild after login. Accepted behavior — not a bug.

## Acceptance criteria

- [x] Entering Courses and building dispatches to a Web Worker; UI remains responsive during computation
- [x] Filter changes re-run the worker without a new network request
- [x] Mornings/Afternoons/Evenings presets snap the time range slider to correct bounds
- [x] Up to 50 valid, non-conflicting Schedules are returned and displayed as selectable mini-grid cards
- [x] "Select Schedule" merges all Sections in the chosen Schedule into the Cart and navigates to `/cart`
- [x] Entering more than 7 Courses shows a soft warning (see placeholder copy in Comments)
- [x] `/schedule-builder` is accessible without authentication
- [x] "Register Now" button appears on each schedule card for authenticated Students only
- [x] Clicking Register Now fetches availability (batch), derives Add/Waitlist per section, submits one registration call, and shows per-section outcomes inline on the card
- [x] Availability fetch failure shows a card-level error; does not fall back to assuming Add
- [x] Button shows "Registering…" and is disabled while the request is in flight
- [x] Results are cleared when a new Build is triggered

## Blocked by

- `05-section-search`
- `06-visitor-cart`

## Comments

### Worker message protocol

**Main → worker** (on each build or filter change):
```js
{
  type: 'build',
  courses: [
    [normalizedSection, ...],  // all sections for course 1
    [normalizedSection, ...],  // all sections for course 2
    // up to 7
  ],
  filters: {
    rangeStart: 480,   // minutes from midnight (8am = 480)
    rangeEnd: 1320,    // (11pm = 1380 max; slider range)
    days: ['M','T','W','R','F'],
    termFormat: 'all',
    location: 'any',
  }
}
```

**Worker → main** (single message when done):
```js
{ type: 'result', schedules: [[normalizedSection, ...], ...] }
{ type: 'error',  message: '...' }
```

Cancellation has no message — the composable calls `worker.terminate()` and creates a fresh worker instance. No cancel handshake needed.

**Normalized section shape** (transformed before posting; worker operates on this, not raw API shape):
```js
{
  id: sec.CourseKey,
  days: ['M','W','F'],          // split from Days string; [] = online/async
  startMin: 540,                // null = online/async (never conflicts)
  endMin: 630,
  termFormat: sec.TermFormat,
  building: sec.Building,   // section's physical building ID — not the location filter key
  creditHours: sec.CreditHours,
  subjectCode: sec.SubjectCode?.trim(),
  courseNo: sec.CourseNo?.trim(),
  longName: sec.LongName,
  faculty: sec.Faculty,
}
```

Worker returns schedules as arrays of normalized section objects — results are self-contained for rendering mini-grid cards. The composable separately maintains a `Map<CourseKey, rawSection>` cache so "Select Schedule" can call `cartStore.add(rawSection)` with the full API shape the cart expects.

### Conflict definition

Two sections **conflict** if:
- Both have at least one day in common (intersection of their `days` arrays is non-empty), **and**
- Their time intervals overlap: `A.startMin < B.endMin && B.startMin < A.endMin` (half-open, so back-to-back classes at the same time boundary do **not** conflict)

Sections with `startMin === null` (online/async — no `Days` or no `StartTime`) **never conflict** with anything.

### Algorithm

Backtracking over courses in input order. For each course, iterate its sections (after applying filters). Before recursing, check the candidate section against all already-placed sections for conflicts — skip immediately on any conflict (early pruning). Stop when 50 schedules have been found. Input order is preserved; no automatic reordering by section count.

Worker is instantiated via:
```js
new Worker(new URL('../workers/scheduleWorker.js', import.meta.url), { type: 'module' })
```
This lets the worker use ES `import` (e.g. shared `parseTimeMinutes` utility).

### `useScheduleBuilder` composable interface

```js
const { schedules, isBuilding, error, count, build } = useScheduleBuilder()
// schedules: ref([])   — array of schedules (each is array of normalized sections)
// isBuilding: ref(false)
// error: ref(null)     — string if worker errored
// count: computed      — schedules.value.length
// build(courses, filters) — normalizes, terminates prior worker, dispatches
```

Worker lifecycle: created lazily on first `build()` call, terminated+recreated on each subsequent `build()`, destroyed in `onUnmounted`.

### Course input

Typeahead search via existing `searchCourses` API. Selected courses shown as removable chips. Sections fetched via `getCourseSections` immediately on course add and cached (raw API objects). Cache invalidated and sections re-fetched if the term selector changes.

### Soft-cap warning copy (placeholder)

<!-- TODO: confirm copy with product -->
> "Adding more than 7 courses may significantly increase build time and reduce the number of valid schedules found."

Shown inline below the course chip list when course count exceeds 7. Not blocking — user can still build.

### Register Now

A "Register Now" button appears on each schedule card, **authenticated Students only** (hidden entirely for visitors — no disabled/tooltip state). "Select Schedule" remains available to all roles.

**Click behaviour:**
1. Fetch `getAvailability(courseKeys.join(','))` — one batch request for all sections in the schedule.
2. If the availability call fails: abort and show a card-level error — "Could not check seat availability. Please try again." Do not fall back to assuming Add.
3. Map each section: `status === 'Open'` → `add`, anything else → `waitlist`.
4. Call `registerSections` with the full batch payload (same shape as `useCartRegistration`). Build `CreditHours` from `_sectionCache`.
5. Parse per-section outcomes from the response and store in `scheduleResults[scheduleIndex]`.

**`registerSchedule(schedule, scheduleIndex, termId)`** is added to `useScheduleBuilder` (it already holds `_sectionCache`). New reactive state added to the composable:
```js
const scheduleResults = reactive({})    // keyed by scheduleIndex: { [courseKey]: { status, message } } | { _error: string }
const registeringSchedules = reactive(new Set())   // scheduleIndex values currently in flight
```

**Button label:** Always "Register Now" — availability auto-detection happens behind the scenes. While in flight: button shows "Registering…" and is disabled.

**Outcome display (inline on card):** On completion, replace the Register Now button area with a compact per-section result list:
- Success: `ACC-1100 — Registered` / `ACC-1100 — Waitlisted`
- Error: `ACC-1100 — Section full` (backend error message)
- Card-level error (availability fetch failed): single error message above the button

**Result clearing:** Results are cleared when the student clicks "Build Schedules" (new build replaces the schedule list entirely). No per-card dismiss control.

**Note:** The `sections/availability` backend endpoint (`GET sections/availability?courseKeys=...`) is not yet implemented server-side. Frontend service (`getAvailability`) already exists.
