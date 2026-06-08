Status: ready-for-human

## What to build

Programs browsing surface. Program list page with name search/filter. Program detail shows required Courses; clicking a Course expands or opens a modal with its current-Term Sections and availability. "Add to Schedule Builder" button on a Course or Section navigates to the Schedule Builder with that Course pre-populated in the Course list. Logged-in Students see a Completed Course badge on Courses they have already taken.

Backend API shape for Programs, required Courses, and Completed Courses to be confirmed in Comments.

## Acceptance criteria

- [ ] Program list loads on mount; name filter narrows results without a page reload
- [ ] Program detail shows required Courses for the selected Program
- [ ] Clicking a Course shows its current-Term Sections with seat availability
- [ ] "Add to Schedule Builder" navigates to the Schedule Builder with the Course pre-populated
- [ ] Logged-in Students see a Completed Course badge on Courses already taken
- [ ] Visitors see Program and Course data but no Completed Course badges
- [ ] API contract for Programs, Courses, and Completed Courses confirmed and documented in Comments

## Blocked by

- `05-section-search`
- `11-schedule-builder`

## Comments

<!-- Maintainer: add backend API shape for Programs list, Program detail (Courses), and Completed Courses endpoint before promoting to ready-for-agent. Also confirm: does "Add to Schedule Builder" navigate to /schedule-builder and pre-populate via route param, or mutate the Schedule Builder store directly? -->
