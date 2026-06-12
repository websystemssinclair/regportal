# RegPortal

Course registration portal for Sinclair College. Students search, plan, and register for Sections each Term.

## Language

**Course**:
An abstract subject offered by the college, identified by a code (e.g. ACC-1100).
_Avoid_: Class, subject

**Section Number**:
A numeric/alpha identifier that distinguishes one scheduled offering of a Course from another within the same Term (e.g. the "100" in ACC-1100-100).
_Avoid_: Section, offering code

**Section**:
A specific scheduled offering of a Course in a given Term, identified by combining the Course code and Section Number (e.g. ACC-1100-100). Has one or more meeting slots (each with days, start time, end time, and room), an instructor, modality, and seat count.
_Avoid_: Class section, course offering

**Cart**:
An authenticated user's collection of Sections they intend to act on. Persisted to the backend (for authenticated users) and to localStorage (for Visitors before login, merged on login — localStorage cleared after merge). Merge is silent and automatic: client-side deduplication by CourseKey (login payload's cart wins for duplicates), localStorage is cleared, and a toast confirms how many new Sections were carried over. No merge confirmation UI. Not scoped to a single Term — stale Sections (full, closed, cancelled) are shown with status; the user removes them manually.

Cart is a save/retrieval mechanism only — it does not track registration state or reserve seats. Section availability (Open, Closed, Closed/Waitlist, Cancelled) is checked live against the backend on each Cart load. Add and Waitlist actions are performed from the Cart; Drop and Waitlist Drop are performed from My Schedule.

Cart display is a three-level hierarchy:
- Meta-group: **Current** (Terms with status D or Y) and **Future** (status F)
- Sub-header per Term within each meta-group
- Flat list of Sections sorted by Course within each Term
_Avoid_: Basket, wishlist

**Registration**:
The act of performing an action (Add, Drop, Waitlist, or Waitlist Drop) on a Section in the Cart via the backend.
_Avoid_: Enrollment (use Registration), signup

**Registration Actions**:
- **Add** — enroll in a Section when seats are available. Triggered from Cart or Register Now.
- **Waitlist** — join the waitlist for a full Section. Triggered from Cart or Register Now / Waitlist Now.
- **Drop** — remove yourself from an enrolled Section. Triggered from My Schedule.
- **Waitlist Drop** — remove yourself from the waitlist. Triggered from My Schedule.

Each Registration Action is processed independently by the backend. A Schedule can have partial success — some Sections register and others fail (e.g., a Section fills between viewing results and submitting). The frontend must surface per-Section outcomes.

**Register Now / Waitlist Now**: A single button that bypasses the Cart and submits an Add or Waitlist action directly, auto-detecting which based on seat availability (Open → Add, Closed/Waitlist → Waitlist). Appears in Section Search results and Schedule Builder results. Only available to authenticated Students. From Schedule Builder, submits actions for all Sections in a Schedule at once.

**My Schedule**:
A view of a Student's currently registered and waitlisted Sections. Displays a weekly grid and a summary list for the selected Term. Shows the current Term by default; dropdown to switch if the student has registrations in other available Terms. Drop and Waitlist Drop actions are performed here. Registration state is included in the login payload — no separate fetch required on load. Separate from the Cart.
_Avoid_: My registrations, enrollment view

**Term**:
An academic period (e.g. "Fall 2025"). Has a status that controls frontend visibility and registration availability. Wire field: `toView`.

| `toView` | Meaning |
|----------|---------|
| `D` | Default — current registration term, pre-selected in the UI |
| `Y` | Available — open for browsing and registration |
| `F` | Future — visible to all users, labeled "not open", registration not blocked by frontend |
| `N` | Not available — hidden from Students and Visitors; visible to Admins only |

_Avoid_: Semester (use Term), period

**Program**:
A degree or certificate path offered by the college (e.g. "AAS in Accounting"). Contains a list of required Courses. Students browse Programs, select Courses from them, and send those Courses to the Schedule Builder. Clicking a Course within a Program shows its current Term offerings. Logged-in students see which Program Courses they have already completed.
_Avoid_: Degree, major, curriculum

**Booklist**:
Required textbooks for Sections. Has two surfaces: (1) a top-level view aggregating books across all Cart and registered Sections; (2) a per-Section modal accessible from Cart and My Schedule showing that Section's books only. Each book entry has an external link button (e.g., campus bookstore). Visible to all roles including Visitors (who have a localStorage Cart).
_Avoid_: Book list, textbook list

**Completed Course**:
A Course a logged-in student has already taken, surfaced within the Programs view to help them identify remaining requirements.
_Avoid_: Taken course, finished course

**Schedule**:
A proposed conflict-free combination of Sections, one per desired Course, generated by the Schedule Builder from a student-supplied Course list and filters.
_Avoid_: Timetable, plan

**Schedule Builder**:
The core feature. Takes a list of Courses (soft cap: 7) and optional filters (Term, location, day/time, modality) and generates non-conflicting Schedule combinations for the student to choose from. Computation runs in a Web Worker to keep the UI responsive. Displays up to 50 valid Schedules. Uses backtracking with early conflict pruning — does not materialize all combinations before filtering.

Filters: day-of-week checkboxes; time range slider (6am–11pm) with preset snapping (Mornings → 6am–noon, Afternoons → noon–5pm, Evenings → 5pm–11pm); location; modality. Filters are applied client-side inside the Web Worker — sections are fetched unfiltered and re-filtering re-runs the worker without a new network request.

Known constraint: triggering login (SAML redirect) from the Schedule Builder discards current results. The student must rebuild after returning. This is accepted behavior — Schedule state is not persisted across the redirect.
_Avoid_: Planner, scheduler

**Important Dates**:
Admin-entered deadline dates (e.g. "Last day to drop: Oct 15") displayed as a scrolling ticker on the home screen.
_Avoid_: Key dates, deadlines

**Intro Banner**:
Admin-editable copy displayed on the home screen. Used for announcements and notices (e.g. course subject code changes, exam software requirements). Rendered as HTML — sanitized client-side before display.
_Avoid_: Hero, announcement banner

**Modality**:
How a Section is delivered — e.g. in-person, online, hybrid. A filter in the Schedule Builder and Section search.
_Avoid_: Format, delivery mode

**Maintenance Mode**:
An Admin-configured state with a scheduled start/end time and two types:
- **Site** — full site closed; users see a maintenance page only. Wire value: `maintType: "regular"`
- **Backend** — registration and Cart are disabled, but browsing and search remain usable. Wire value: `maintType: "webadvisor"`

Has a **Public Message** (`maintCopy` on the wire, displayed to all users as a notice) and a **Private Message** (internal Admin/Developer record only, not surfaced by the API).

The active maintenance state is returned as the `maintenance` array in the reference data payload (`/reference.StaticData`). The backend pre-filters to currently active entries only; an empty array means no active maintenance. The frontend reads `maintenance[0]` when the array is non-empty.
_Avoid_: Downtime, outage mode

**Course Linkage**:
An Admin-configured record attached to a Course with two URL fields: `topicLink` (subject/topic URL) and `previewLink` (course preview URL). Either or both may be populated. Only active linkages are returned by the API (`isActive` filtered server-side). Surfaces on the Course Details view alongside course description, prerequisites, co-requisites, and the list of Sections for the current Term. Each URL shown only when non-empty.
_Avoid_: Course link, external link

**Course Details**:
A view showing a Course's description, prerequisites (`preReqs`), co-requisites (`coReqs`), Course Linkage, and its available Sections for the current Term. Prerequisites and co-requisites are shown only when non-empty/non-"None".
_Avoid_: Course page, course info

## Roles

**Visitor**: Unauthenticated user. Can browse, search, use the Schedule Builder, and maintain a localStorage Cart. Cannot Register.

**Student**: Authenticated via SAML. Can do everything a Visitor can, plus Register and persist Cart to the backend.

**Admin**: Authenticated staff. Can manage Terms, Important Dates, Intro Banner, Course Linkages, and Maintenance Mode.

**Developer**: Superset of Admin. Additional capabilities TBD. Impersonation deferred — pending investigation of whether Sinclair's ERP supports it.

Role priority (highest wins): Developer → Admin → Student → Visitor. When a user's `availableRoles` list contains multiple roles, the highest-privilege role is auto-assigned. No role switcher UI. In practice, Developer is the only role that has multiple roles.

## Example Dialogue

> **Dev:** "When a **Visitor** builds a **Schedule**, do we add those **Sections** to the **Cart** before or after login?"
> **Domain expert:** "Before — they add to the localStorage Cart as a Visitor. On login, the Cart merges into the backend."

> **Dev:** "If a **Term** has status `F`, can a **Student** still **Add** a **Section** from it?"
> **Domain expert:** "The frontend doesn't block it — the backend will reject it. We label it 'not open' but don't disable the button."

> **Dev:** "Is a **Schedule** saved, or is it ephemeral?"
> **Domain expert:** "Ephemeral — once you add it to the **Cart**, the Schedule itself isn't stored. The Cart is what persists."

## Open Questions

- **AI integration in Schedule Builder**: Exploring preference/ranking layer on top of client-side combination algorithm. Deferred — needs further design thought.
- **Developer impersonation**: Deferred — depends on whether Sinclair's ERP supports it.

## Flagged Ambiguities

- "Enrollment" was used informally — resolved: use **Registration** exclusively. Enrollment is the college's back-office term; Registration is the student-facing action in this portal.
- "Section" is ambiguous on its own (could mean the numeric code or the full Section). Resolved: **Section Number** = the identifier suffix only; **Section** = the full scheduled offering.

## Relationships

- A **Course** has one or more **Sections** per **Term**
- A **Section** belongs to exactly one **Course** and one **Term**
- A **Cart** belongs to one **Student** and contains zero or more **Sections**
- A **Registration** action is performed on a **Section** in a **Cart**
- Selecting a **Schedule** from the builder adds all its **Sections** to the **Cart** in one action
- A **Program** contains one or more **Courses**; selecting Courses from a Program feeds the **Schedule Builder**
