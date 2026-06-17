Status: done

## What to build

My Schedule shows a Student's registered and waitlisted Sections. Registration state is loaded from the login payload (`getUserData` response: `currentCourses` = registered, `waitlist` = waitlisted) — stored in the auth store alongside `colleagueToken`, no separate fetch on page load. Displays a 7-day weekly grid (Mon–Sun, 6am–midnight, pixel-precise CSS positioning) and a summary list — side-by-side on tablet/desktop, tabbed ("Schedule" / "List") on mobile. Term selector dropdown defaults to the status-D Term; shown only when the student has registrations in multiple D/Y Terms (F-term registrations do not exist). Drop and Waitlist Drop actions call `registrationService`; each requires a confirmation dialog before firing; per-Section outcome is surfaced inline on success or error.

## Resolved decisions

### Data source
- `currentCourses` and `waitlist` from `getUserData` (same call that returns `shoppingCart`) are stored in the auth store — same pattern as `colleagueToken`
- Shape of `currentCourses` and `waitlist` items is identical to `shoppingCart` items (same wire fields: `CourseKey`, `Days`, `StartTime`, `EndTime`, `dayModels`, `additionalSched`, `Faculty`, `Term`, `CreditHours`, etc.)
- `waitlist` is currently always empty but will follow the same shape when populated

### Term selector
- Shows only Terms with `toView: D` or `toView: Y` that have registrations
- Defaults to status-D Term
- Hidden when only one qualifying Term has registrations
- F-term registrations do not exist (F-term items in the payload are Cart/Preferred Sections, not registrations)

### Weekly grid
- 7 columns: Mon–Sun (M, T, W, R, F, S, U)
- Time range: 6am–midnight
- Layout: pixel-precise CSS positioning (no discrete rows) — block top/height derived from exact start/end times as percentage of the 18-hour range
- Online/async Sections (empty `Days` or empty `StartTime`) are omitted from the grid; a note below the grid indicates how many are not shown
- Each `dayModels` entry and each `additionalSched` entry that has meeting time data gets its own grid block
- Registered Sections and waitlisted Sections are visually distinguished (e.g. different color/badge)

### Day parsing
- `Days` field is a string of single-character codes: `M` `T` `W` `R` `F` `S` `U`
- A Section block is rendered in each column whose letter appears in `Days`
- `DaysOld` field is ignored

### Summary list
- Shows all registered and waitlisted Sections for the selected Term (including online/async ones omitted from the grid)
- Columns: Section (course code + section number), instructor (`Faculty`), modality/location, meeting days/times, Drop or Waitlist Drop button

### Drop / Waitlist Drop actions
- Both require a confirmation dialog before firing ("Are you sure you want to drop [Section]?") — Drop and Waitlist Drop are irreversible Registration Actions; the seat is released immediately
- Calls `registerSections` with `action: 'drop'` or `action: 'waitlistDrop'`
- Payload shape follows `useCartRegistration._buildPayload`: `{ token, studentId, username, password: '', sections: [{ SectionId, Action, Credits }] }`
- On success: remove Section from `authStore.currentCourses` or `authStore.waitlist` locally (no re-fetch)
- On error: show inline error message per Section (same pattern as Cart — `data.rows[0].errors` keyed by `CourseKey`)
- Dropped Section is NOT removed from the Cart — Cart and registration state are independent

### Mobile layout
- Tabbed: "Schedule" tab (weekly grid, horizontally scrollable) / "List" tab (summary list)
- Side-by-side on tablet/desktop

## Acceptance criteria

- [x] My Schedule route is Student-only; Visitors and unauthenticated users are redirected
- [x] Registration state is consumed from the login payload (`authStore.currentCourses` / `authStore.waitlist`); no separate API call fires on mount
- [x] Auth store stores `currentCourses` and `waitlist` from `getUserData` response alongside `colleagueToken`
- [x] Weekly grid renders 7 columns (Mon–Sun) with pixel-precise CSS block positioning over a 6am–midnight range
- [x] Registered and waitlisted Sections with meeting times appear in the grid at the correct day columns and vertical position
- [x] Online/async Sections (no `Days` or no `StartTime`) are omitted from the grid; a count note is shown below the grid
- [x] Summary list shows all Sections (including online/async) with instructor, location/modality, days/times, and action button
- [x] Term selector dropdown switches the displayed Term; defaults to status-D Term; hidden when only one D/Y Term has registrations
- [x] Drop button shows a confirmation dialog; on confirm calls `registrationService.register([{ sectionId, action: 'drop' }])`; Section is removed from grid and list on success
- [x] Waitlist Drop button shows a confirmation dialog; on confirm calls `registrationService.register([{ sectionId, action: 'waitlistDrop' }])`; Section removed on success
- [x] Per-Section outcome (success/error) is shown inline; partial success handled
- [x] Dropped Section is NOT removed from the Cart
- [x] On mobile: grid and list are in tabs; on tablet/desktop: side-by-side

## Blocked by

- `03-saml-auth`
- `08-cart-registration-actions`
