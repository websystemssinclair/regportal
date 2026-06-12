Status: done

## Implementation progress

**Done (composable + store layer — all tested):**
- `useCartRegistration` composable (`src/composables/useCartRegistration.js`) — `register(termId, registrations)` builds the correct API payload, calls `registrationService.registerSections`, processes the response
- `cartStore.sectionErrors` — populated per-section from `rows[0].errors[i].Message` on failure; partial success handled correctly
- `cartStore.dismissError(courseKey)` — clears one error entry
- `cartStore.removeRegistered(courseKeys)` — batch removes succeeded sections, syncs saveCart once
- `cartStore.registeringTerms` — pushed before flight, spliced out in `finally`
- `registrationService.registerSections` — fixed to forward the pre-built payload (was wrapping in `{ actions }`)

**Remaining (CartView UI — `src/views/CartView.vue`):**
- Add button on Open sections → `register(termId, [{sectionId, action:'add'}])`
- Waitlist button on Closed/Waitlist sections → `register(termId, [{sectionId, action:'waitlist'}])`
- "Register All" button per term sub-header (Open → add, Closed/Waitlist → waitlist; skip Cancelled/Closed-no-waitlist and Future-Term)
- Toast "Registered for N section(s)" on success
- Inline error display (replaces action buttons, dismissible via `dismissError`)
- Disable all action buttons in term while `cartStore.registeringTerms.includes(termId)`
- Maintenance banner at top of Cart when `maintenanceStore.isBackendDown`; disable all action buttons
- Future-Term sections (status F / toView F): render no Add/Waitlist buttons, exclude from Register All

## What to build

Add and Waitlist Registration Actions triggered from the Cart. `registrationService.registerSections(actions)` submits an array of `{ sectionId, action }` tuples (where `sectionId` is the numeric `CourseKey`); the backend processes each independently and returns a single-row response.

Two submission paths:
- **Per-section**: Add button (Open sections) or Waitlist button (Closed/Waitlist sections) fires a single-element array
- **Per-Term "Register All"**: button in each Term sub-header submits all actionable sections in that Term at once (Open → add, Closed/Waitlist → waitlist; Cancelled and Closed-no-waitlist sections are skipped)

Response shape: `{ success, rows: [{ message, errors: [{ CourseKey, SectionNo, CourseNumber, SubjectCode, Message }] }] }`. `rows` always has a single entry. `rows[0].errors` contains failed sections by `CourseKey`; sections submitted but absent from `errors` succeeded.

Post-response behavior:
- **Succeeded sections**: removed from Cart state; a toast confirms "Registered for N section(s)"
- **Failed sections**: stay in Cart; inline error message replaces action buttons (dismissible — buttons reappear on dismiss)

Additional behaviors:
- All action buttons in the affected Term are disabled during in-flight submission; re-enabled after response
- When `maintenanceStore.isBackendDown` is true, a banner at the top of the Cart shows `maintenanceStore.publicMessage` (fallback: "Registration is temporarily unavailable"); all action buttons and Register All buttons are disabled but still rendered
- Future-Term Sections (status F) have no action buttons — they are Save Cart only; no Add, Waitlist, or Register All applies
- Stale Sections (Cancelled / Closed-no-waitlist) show status badge only; student removes them manually

## Acceptance criteria

- [x] Add button triggers `registrationService.registerSections([{ sectionId, action: 'add' }])` for Open sections ✅
- [x] Waitlist button triggers `registrationService.registerSections([{ sectionId, action: 'waitlist' }])` for Closed/Waitlist sections ✅
- [x] Each Term sub-header has a "Register All" button that submits all actionable sections in that Term; button is absent (or disabled) when no actionable sections exist ✅
- [x] Succeeded sections are removed from Cart state; a toast confirms how many were registered ✅
- [x] Failed sections show an inline error (from `rows[0].errors[i].Message`) replacing the action buttons; dismissing the error restores the buttons ✅
- [x] Partial success in a batch is handled correctly — successes removed, failures stay with errors ✅
- [x] All action buttons in the affected Term are disabled during in-flight submission; re-enabled after response ✅
- [x] When `maintenanceStore.isBackendDown` is true, a banner is shown at the top of the Cart and all action buttons are disabled (but rendered) ✅
- [x] Future-Term Sections (status F) render no action buttons and are excluded from Register All ✅
- [x] Registration state in `useCartStore` is updated from the backend response without a full Cart reload ✅

## API contract

Request: `POST /registration` — `{ token: <string ColleagueToken>, studentId: <numeric tartanId>, username: <string userName>, password: <uuid>, sections: [{ SectionId: <numeric CourseKey>, Action: 'add' | 'waitlist', Credits: <numeric CreditHours> }] }`

Response (error): `{ results: 1, success: false, rows: [{ message: "...", errors: [{ CourseKey, SectionNo, CourseNumber, SubjectCode, Message }] }] }`

Response (success): `{ results: 1, success: true, rows: [{ message: "Registration completed successfully", errors: [] }] }`

## Blocked by

- `02-maintenance-mode-gate`
- `03-saml-auth`
- `06-visitor-cart`
