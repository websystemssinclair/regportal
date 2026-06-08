Status: ready-for-agent

# RegPortal v1 — Course Registration Portal

## Problem Statement

Sinclair College students have no modern, mobile-friendly way to browse courses, plan their schedules, and register for sections. The existing system requires students to navigate separately between a course catalog, a schedule-building tool, and a registration system—with no unified cart, no conflict detection, and no responsive design. Students on mobile devices are especially underserved. Visitors who haven't logged in can't even explore available courses without creating an account first.

## Solution

A single-page Vue 3 application that unifies course browsing, schedule building, cart management, and section registration into one cohesive, mobile-first experience. Visitors can browse and plan before logging in; a localStorage Cart preserves their work and merges silently into their backend Cart on login. The Schedule Builder auto-generates non-conflicting section combinations so students don't have to manually check for time conflicts. Registration actions are submitted from the Cart and My Schedule in one place.

## User Stories

### Visitor — Browsing & Discovery

1. As a Visitor, I want to see a landing page with an Intro Banner and Important Dates ticker, so that I can understand what's currently happening at the college before I log in.
2. As a Visitor, I want to search for Sections by Term, Subject, Modality, and day/time, so that I can explore available offerings without needing an account.
3. As a Visitor, I want Section Search results displayed as individual cards showing Course code, title, Section Number, instructor, modality, meeting days/times, and seat availability, so that I can evaluate each Section at a glance on my phone.
4. As a Visitor, I want to see a Section's Course details (description, prerequisites, syllabus link) from the search results, so that I can decide if the Course is right for me before adding it to my Cart.
5. As a Visitor, I want to add Sections to a Cart backed by localStorage, so that I can save my intended Sections without logging in.
6. As a Visitor, I want my Cart to group Sections into Current and Future Term meta-groups, each with a sub-header per Term, so that I can easily scan what I've saved across multiple Terms.
7. As a Visitor, I want to remove a Section from my Cart, so that I can adjust my saved list without starting over.
8. As a Visitor, I want to browse Programs and see the required Courses for each, so that I can understand which Courses I need to take for a degree or certificate.
9. As a Visitor, I want to click a Course within a Program to see its current Term Sections, so that I can explore offerings before deciding to add them to the Schedule Builder.
10. As a Visitor, I want to build a Schedule by entering a list of Courses and optional filters (Term, location, day/time range, modality), so that I can find a combination of Sections that doesn't conflict without manually checking each one.
11. As a Visitor, I want Schedule Builder computation to run without freezing the page, so that I can adjust filters while results load without the UI becoming unresponsive.
12. As a Visitor, I want to see up to 50 valid non-conflicting Schedules as results, so that I have real choices to evaluate before committing to a Cart.
13. As a Visitor, I want to select a Schedule from the builder results and have all its Sections added to my Cart at once, so that I don't have to add each Section individually.
14. As a Visitor, I want to view the Booklist for Sections in my Cart, so that I can estimate textbook costs before registering.
15. As a Visitor, I want to see a clear call-to-action to log in when I try to register, so that I know login is required for that action.
16. As a Visitor, I want the site to remain fully functional for browsing and schedule planning when Maintenance Mode is set to Backend-only, so that a registration outage doesn't block me from exploring courses.
17. As a Visitor, I want to see a maintenance page with the public message when the site is in Site Maintenance Mode, so that I understand why the site is unavailable.
18. As a Visitor, I want filter changes in the Schedule Builder to instantly re-run without a new page load or "Build" click, so that I can iterate on filters fluidly.
19. As a Visitor, I want day/time filter presets (Mornings, Afternoons, Evenings) in the Schedule Builder, so that I can set common time preferences in one click.
20. As a Visitor, I want to add Courses to the Schedule Builder directly from a Program's Course list, so that I don't have to manually type Course codes.

### Student — Authentication & Cart Merge

21. As a Student, I want to log in via Sinclair SSO (SAML) from any point in the app that requires authentication, so that I don't have to navigate away from what I was doing.
22. As a Student, I want to be returned to the page I was on before the SAML redirect after login completes, so that login doesn't disrupt my browsing flow.
23. As a Student, I want my localStorage Cart to be automatically merged into my backend Cart when I log in, so that Sections I saved as a Visitor are not lost.
24. As a Student, I want the Cart merge to be silent with a toast confirming how many Sections were carried over, so that I'm informed without being interrupted by a confirmation dialog.
25. As a Student, I want duplicate Sections (same Section ID in both localStorage and backend) to be deduplicated during merge, so that I don't see the same Section twice.

### Student — Registration

26. As a Student, I want to Add a Section from my Cart when seats are available, so that I can register without navigating to a separate registration system.
27. As a Student, I want to join the Waitlist for a full Section from my Cart, so that I can secure a spot if a seat opens up.
28. As a Student, I want to see live seat availability for each Section in my Cart (Open, Closed, Closed/Waitlist, Cancelled), so that I know which actions are available before I submit.
29. As a Student, I want stale Sections in my Cart (full, closed, cancelled) to be shown with their current status rather than silently removed, so that I can decide whether to keep or remove them myself.
30. As a Student, I want to see the per-Section outcome of a registration submission (which Sections registered successfully and which failed), so that I know exactly what happened when results are partial.
31. As a Student, I want to use Register Now from Section Search results to Add or Waitlist a Section without going through the Cart, so that I can register quickly when I've already decided.
32. As a Student, I want the Register Now button to auto-detect whether to Add or Waitlist based on current seat availability, so that I don't have to check availability manually.
33. As a Student, I want to use Register Now from the Schedule Builder to submit Add or Waitlist actions for all Sections in a selected Schedule at once, so that I can go from plan to registration in one step.
34. As a Student, I want to view My Schedule for a Term as a weekly grid, so that I can visualize my registered and waitlisted Sections by day and time.
35. As a Student, I want to view My Schedule as a summary list alongside the weekly grid, so that I can see details (instructor, room, modality) that the grid doesn't show.
36. As a Student, I want to switch between Terms in My Schedule via a dropdown, so that I can review registrations across all available Terms.
37. As a Student, I want to Drop a Section from My Schedule, so that I can free up a seat and update my enrollment.
38. As a Student, I want to perform a Waitlist Drop from My Schedule, so that I can remove myself from a waitlist I no longer want.
39. As a Student, I want My Schedule to load instantly on the page because registration state is included in the login payload, so that I don't wait for a separate fetch after logging in.
40. As a Student, I want to see which Program Courses I've already completed when browsing a Program, so that I can quickly identify what I still need to take.
41. As a Student, I want to view the Booklist for any Section in My Schedule via a per-Section modal, so that I know what books I need for a specific class.
42. As a Student, I want to view an aggregate Booklist across all Cart and registered Sections, so that I can plan total textbook purchases in one place.
43. As a Student, I want each book in the Booklist to have an external link to the campus bookstore, so that I can purchase required materials directly.
44. As a Student, I want to log out and have my session cleared, so that my account is protected on shared devices.
45. As a Student, I want registration and Cart actions to be disabled when Maintenance Mode is set to Backend-only, so that I'm not shown a confusing error when the backend is intentionally down.
46. As a Student, I want to see the maintenance public message during Backend Maintenance Mode, so that I know why registration is temporarily unavailable.
47. As a Student, I want future Term Sections labeled "not open" in the Cart and Schedule Builder, so that I understand they're visible but registration isn't expected to succeed from the frontend side.

### Admin — Content Management

48. As an Admin, I want to view and manage all Terms (name, status: D/Y/F/N) in a table, so that I can control which Terms are visible and open for registration.
49. As an Admin, I want to add a new Term with a name and initial status, so that I can prepare for upcoming academic periods.
50. As an Admin, I want to change a Term's status, so that I can open or close registration and control frontend visibility.
51. As an Admin, I want to add and edit Important Dates (label and date) that appear in the scrolling ticker on the home screen, so that students see current deadlines.
52. As an Admin, I want to delete Important Dates that are no longer relevant, so that the ticker stays current.
53. As an Admin, I want to edit the Intro Banner copy on the home screen, so that I can publish announcements and welcome messaging to all users.
54. As an Admin, I want to add a Course Linkage (external URL) for a Course by Course code, so that students can access syllabi and department pages from the Course Details view.
55. As an Admin, I want to edit an existing Course Linkage, so that I can update a URL when it changes.
56. As an Admin, I want to delete a Course Linkage, so that outdated links are removed.
57. As an Admin, I want to configure Maintenance Mode with a type (Site or Backend), start/end datetime, and a public message, so that I can schedule planned outages in advance.
58. As an Admin, I want to add a private message to a Maintenance Mode record, so that internal staff have context about what's happening during the outage.
59. As an Admin, I want the site to automatically enter and exit Maintenance Mode at the configured start and end times, so that I don't need to manually toggle it at the moment of outage.
60. As an Admin, I want Admin-only content pages (Terms, Dates, Linkages, Maintenance Mode) to use a DataTable layout, so that I can compare and manage multiple records efficiently on desktop.

### Developer

61. As a Developer, I want all Admin capabilities, so that I can manage the portal's content and configuration in addition to developer-specific tasks.

## Implementation Decisions

### Stack

- **Framework**: Vue 3 + Vite (JavaScript only, no TypeScript)
- **UI components**: PrimeVue in unstyled mode with a global passthrough preset; all styling via Tailwind CSS v4 (ADR-0003)
- **State management**: Pinia
- **Routing**: Vue Router with `meta.roles` on each route and a `beforeEach` role guard
- **API client**: Axios with a configured base URL and auth interceptors
- **Form validation**: Custom `useFormValidation` composable; no VeeValidate or Yup (ADR-0004)
- **Auth v1**: SAML redirect to Sinclair SSO; v2 OIDC migration is documented in ADR-0002 but out of scope here
- **Design**: School Crimson `#ac1a2f` as primary accent; WCAG 2.1 AA required throughout; 8px spacing grid

### Module: App Bootstrap

- Vite project with `@tailwindcss/vite` plugin
- PrimeVue registered globally in unstyled mode with a custom passthrough preset under `src/presets/`
- Pinia installed and mounted
- Vue Router installed; role guard registered via `router.beforeEach`
- App startup checks Maintenance Mode state before mounting views (see below)

### Module: `useAuth` Composable

- Exposes `user`, `role`, `isAuthenticated`, `login()`, `logout()`
- On SAML callback: calls backend to retrieve user from `samlId`; reads `availableRoles`; assigns highest-priority role (Developer → Admin → Student → Visitor)
- Stores return-to-URL in `sessionStorage` before redirect; restores after callback
- Dev environment: supports a mock user flag (`VITE_SKIP_AUTH=true`) for local development

### Module: API Service Layer

- Single Axios instance configured with `VITE_API_BASE_URL` and `VITE_API_APP_PATH`
- Auth interceptor attaches session credentials on every request
- Per-domain service modules (not a catch-all file): `sectionsService`, `cartService`, `programsService`, `registrationService`, `adminService`, `authService`
- Each service exposes named functions (e.g. `searchSections(params)`, `addToCart(sectionId)`)

### Module: Vue Router + Role Guards

- Each route declares `meta.roles: ['Visitor', 'Student', 'Admin', 'Developer']` (or a subset)
- `beforeEach` guard reads `authStore.role`; redirects unauthenticated users to login, unauthorized users to a 403 page
- Student-only routes: Cart, My Schedule, Register
- Admin-only routes: Terms, Important Dates, Intro Banner, Course Linkages, Maintenance Mode management

### Module: Maintenance Mode Gate

- Fetched on app init via a lightweight `/status` API call
- Stored in a `maintenanceStore` Pinia store
- Site mode: router redirects all non-Admin routes to a static maintenance page displaying the public message
- Backend mode: `cartStore` and `registrationService` check `maintenanceStore.isBackendDown` before any mutation; Cart/Register UI surfaces a notice and disables action buttons

### Module: Section Search

- `useSearch` composable holds filter state (Term, Subject, Modality, day/time), fetches results, and exposes a loading state
- Results rendered as a card list (ADR-0005); each card shows: Course code, Section Number, title, instructor, modality, meeting slots, seat availability badge, Register Now button (Students only), Add to Cart button
- Section detail accessible via card expansion or modal; includes Course description, prerequisites, Course Linkage (if configured)
- Pagination or virtual scroll if result set exceeds a manageable threshold

### Module: Schedule Builder

- `useScheduleBuilder` composable manages input state (Course list, filters) and dispatches to a dedicated Web Worker
- Web Worker runs backtracking with early conflict pruning; does not materialize all combinations before filtering (ADR-0001)
- Filters (day/time range, modality, location) applied inside the worker after Sections are fetched; filter changes re-dispatch to the worker without re-fetching
- Day/time filter: 6am–11pm slider with preset snapping (Mornings → 6am–noon, Afternoons → noon–5pm, Evenings → 5pm–11pm)
- Maximum 7 Courses; maximum 50 Schedules returned
- Schedule results displayed as selectable cards showing a weekly mini-grid per Schedule
- "Select Schedule" action adds all Sections to Cart; "Register Now" for authenticated Students submits Add/Waitlist actions for all Sections at once
- Known: SAML redirect triggered from Schedule Builder discards current results; student must rebuild after login. Accepted behavior — not a bug.

### Module: Cart (`useCartStore` Pinia Store)

- Visitor path: reads/writes to `localStorage` under a fixed key; structure is an array of Section objects with their live availability
- Student path: backend is the source of truth; localStorage is used only pre-login
- On login: `cartStore.mergeOnLogin()` POSTs localStorage Sections to the backend merge endpoint; backend deduplicates by Section ID; store clears localStorage; a toast confirms how many Sections were carried over
- Cart display: three-level hierarchy — Current meta-group (Terms D or Y) and Future meta-group (status F), sub-header per Term, flat list of Sections sorted by Course within each Term
- Live availability (Open, Closed, Closed/Waitlist, Cancelled) fetched from backend on each Cart load; stale Sections shown with status badge, not silently removed
- Add to Cart and Waitlist triggered from Cart view; Drop and Waitlist Drop triggered from My Schedule only

### Module: My Schedule

- Registration state loaded from login payload (no separate fetch on load)
- Stores registered and waitlisted Sections in `scheduleStore` Pinia store
- Displays a weekly grid (days × time slots) and a summary list side-by-side or tabbed
- Term selector dropdown; defaults to the current Term (status D)
- Drop and Waitlist Drop trigger `registrationService` calls; store updates on success; per-Section outcome surfaced inline

### Module: Programs

- Program list fetched on mount; search/filter by name
- Program detail: list of required Courses; logged-in Students see Completed Course badges
- Each Course in a Program: click → modal or expand showing current Term Sections with availability
- "Add to Schedule Builder" button on Course or on Section → routes to Schedule Builder with Course pre-populated

### Module: Booklist

- Aggregate view: fetches books for all Sections currently in Cart plus registered Sections; groups by Section
- Per-Section modal: fetches books for a single Section; accessible from Cart cards and My Schedule cards
- Each book entry has title, author, ISBN, and an external link button to the campus bookstore

### Module: Registration Actions

- `registrationService.register(actions[])` submits an array of `{ sectionId, action }` tuples in a single call
- Backend processes each action independently; response is an array of per-Section outcomes
- Frontend surfaces outcomes inline (e.g. success badge, error message per card); partial success is expected and handled
- Action buttons disabled during in-flight submission; re-enabled after response

### Module: Admin Panel

- All Admin views use PrimeVue DataTable (desktop-appropriate columnar layout)
- **Terms**: CRUD table; status dropdown per row (D/Y/F/N); max one Term with status D at a time enforced by backend
- **Important Dates**: CRUD table; date picker + label field; ordered by date ascending
- **Intro Banner**: single rich-text or plain-text textarea; save button; preview display
- **Course Linkages**: CRUD table; Course code lookup + URL field; validates URL format
- **Maintenance Mode**: form with type selector (Site/Backend), datetime range picker (start/end), public message textarea, private message textarea; submit schedules the record on the backend

### Module: `useFormValidation` Composable

- Accepts a field definitions object with value refs and rule functions
- Returns reactive `errors` object keyed by field name and an `isValid` computed
- Rules are plain functions: `(value) => true | 'Error message'`; cross-field rules receive the full form state
- Error messages associated with input elements via `aria-describedby` for WCAG compliance
- Used by: Maintenance Mode form (cross-field: start < end), Important Dates form, Course Linkage form

## Testing Decisions

A good test in this codebase:
- Tests externally observable behavior (what the module returns or emits), not implementation details (which internal functions were called)
- Uses realistic inputs and verifies realistic outputs
- Does not mock internals of the module under test; mocks only external dependencies (API, `localStorage`)

### Cart Store (`useCartStore`)

- Tests cover: add/remove Section for Visitors (localStorage read/write), `mergeOnLogin` dedup logic (Sections in both localStorage and backend → deduped; count in toast is accurate), live availability update on Cart load, stale Section display (Cancelled/Closed Sections remain visible with status), Cart grouping into Current/Future meta-groups
- Mock the Axios service responses; do not mock the store's own methods
- Prior art: Pinia store testing with `setActivePinia(createPinia())` in Vitest; no prior tests exist in this repo yet

### Auth Composable (`useAuth`)

- Tests cover: role priority selection (if `availableRoles` contains both `Admin` and `Student`, resolves to `Admin`; Developer wins all), return-to-URL stored before redirect and restored after callback, `isAuthenticated` reflects login state correctly, `logout()` clears session state
- Mock `authService` API calls and `sessionStorage`
- Does not test the SAML redirect itself (that's a browser navigation side effect)

### Form Validation Composable (`useFormValidation`)

- Tests cover: single-field rule fires on empty value; single-field rule passes on valid value; cross-field constraint (Maintenance Mode: start after end produces an error on the end field); `isValid` is false when any field has an error; `isValid` is true when all rules pass; error clears when field corrected
- No DOM mounting required — composable logic is pure reactive computation; test with `@vue/composition-api` or Vitest + Vue 3's `ref`/`computed`

## Out of Scope

- **OIDC migration (ADR-0002)**: v2 work; SAML is the auth mechanism for v1
- **Developer impersonation**: deferred pending investigation of Sinclair ERP support
- **AI integration in Schedule Builder**: deferred; needs further design
- **Push notifications or email for waitlist openings**: backend concern, not frontend
- **Multi-tab Cart synchronization**: localStorage sync across browser tabs is not required for v1
- **Offline mode / service worker**: not in scope
- **Native mobile app**: web-only, mobile-first responsive design

## Further Notes

- The backend API is a ColdFusion REST API at `resttest.sinclair.edu`. All API contracts must be verified against the live dev endpoint before implementation.
- `.env.development` contains dev credentials (`VITE_API_USER`, `VITE_API_PASS`) — these are committed intentionally for the dev environment only. Confirm before going to production whether they should be in a CI secret instead.
- `VITE_SKIP_AUTH=true` (commented out in `.env.development`) enables mock user injection for local dev without a real SAML session. Implementation should respect this flag.
- The `ScheduleResults.png` wireframe in `.scratch/regportal-v1/samples/` is a reference for the Schedule Builder results layout.
- WCAG 2.1 AA is required — not aspirational. Every interactive component, color choice, and focus ring must pass contrast and keyboard navigation checks before a feature is considered done.
- `sample/saml.js` and `sample/useAuth.js` are reference implementations from a prior version. They encode the SAML API contract (`/authenticate`, `/saml/RetrieveSSOUser/{samlId}`, `/saml/SendRequest`) and session key conventions — read them before implementing auth, but do not copy them verbatim.
