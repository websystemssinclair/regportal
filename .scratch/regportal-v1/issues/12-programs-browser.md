Status: done

## What to build

Programs browsing surface. Program list page with name search/filter and career filter chips. Program detail shows program metadata and required Courses; clicking a Course expands an inline accordion with its D-term Sections and seat availability. "Add to Schedule Builder" button on the Course row navigates to `/schedule-builder?course=ACC-1100` with that Course pre-populated. Logged-in Students see a Completed Course badge on Courses they have already taken.

## Acceptance criteria

- [x] Program list loads on mount from the reference store (no separate network call); name filter and career filter narrow results without a page reload
- [x] Career filter chips appear above the program list; each program card shows a career badge; filters combine with AND logic
- [x] Programs list deduplicates by `programCode` (reference data contains duplicates)
- [x] Program detail route is `/programs/:programCode`; shows `programName`, `certificateType`, `description`, `accreditation`, `creditHours`, `department`, `division`, then the course list
- [x] Program detail fetches via `GET /programs/:programCode` (returns full detail in one payload)
- [x] Course list renders all three `dspType` values: `Course` rows get expand chevron + "Add to Schedule Builder" button + Completed Course badge; `Add.Req` and `Elective` rows are plain text only
- [x] Clicking a `Course` row accordion loads its D-term Sections via `getCourseSections`; shows Section number, faculty, days/time, location, and seat availability badge — no per-section action buttons
- [x] "Add to Schedule Builder" on a Course row navigates to `/schedule-builder?course=<CourseCode>` (e.g. `ACC-1100`); `ScheduleBuilderView` reads the param on mount, calls `addCourse()`, then replaces the URL to clear the param
- [x] Logged-in Students see a Completed Course badge on `Course`-type rows for courses in `auth.completedCourses`
- [x] Visitors see Program and Course data (including Section expansion) but no Completed Course badges
- [x] `auth.completedCourses` is populated from `completedCourses` in the `getUserData` login payload (no separate fetch)
- [x] `careers` and `programs` are added to the reference store and read from the existing `refData.json` payload

## Blocked by

- `05-section-search`
- `11-schedule-builder`

## API contract

### Programs list
Source: reference store (`refData.json` payload — field `programs`). No separate endpoint.
```json
{ "programName": "Accounting (AAS)", "programCode": "ACC.S.AAS", "careerId": 12 }
```

### Careers list
Source: reference store (`refData.json` payload — field `careers`). No separate endpoint.
```json
{ "careerName": "Business & Information Technology", "id": 12 }
```

### Program detail
`GET /programs/:programCode` — returns full detail including metadata and courses in one payload.
```json
{
  "results": 1,
  "success": true,
  "rows": [{
    "programName": "Accounting",
    "certificateType": "Associate of Applied Science",
    "description": "...",
    "accreditation": "...",
    "creditHours": "64 Credit Hours",
    "department": "Accounting",
    "division": "Business and Public Services",
    "programCode": "ACC.S.AAS",
    "programcourses": [
      { "dspType": "Course",   "creditHours": 3.0, "LongName": "Intro to Financial Accounting", "CourseCode": "ACC-1210" },
      { "dspType": "Add.Req",  "creditHours": 3.0, "LongName": "COM 2211 OR COM 2225",          "CourseCode": "" },
      { "dspType": "Elective", "creditHours": 3.0, "LongName": "Accounting Elective",            "CourseCode": "" }
    ]
  }]
}
```
`dspType` values: `Course` (has `CourseCode`, actionable), `Add.Req` (text only), `Elective` (text only).

### D-term Sections for a Course
`GET /Sections/:subject/:number/:termId` — existing `getCourseSections` service. `termId` is the reference store's D-term (`toView === 'D'`). Displays: Section number, faculty, days/time, location, seat availability badge. No action buttons.

### Completed Courses
Source: `completedCourses` array in `getUserData` login payload — add to `auth.completedCourses` alongside existing `currentCourses`. No separate endpoint.
```json
{ "courseCode": "ACC-1210", "SubjectCode": "ACC", "CourseNo": "1210", "Title": "..." }
```
Match against `programcourses[].CourseCode` (same format, case-sensitive).

## Design decisions

- **"Add to Schedule Builder" handoff**: route query param (`/schedule-builder?course=ACC-1100`). `ScheduleBuilderView` reads `route.query.course` on mount, calls `addCourse()`, then replaces the URL. Stateless, survives refresh, works from any surface.
- **`getPrograms()` removed**: programs come from the reference store. `programsService` keeps only `getProgram(programCode)`.
- **Sections in Program detail**: D-term only, no term selector. Browse-only — no Cart or Register Now buttons.
- **Non-Course entries**: shown as plain text rows with no interactive affordances.
- **Programs list**: all programs rendered at once, client-side filter. No pagination.
