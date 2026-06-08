Status: ready-for-agent

## What to build

My Schedule shows a Student's registered and waitlisted Sections. Registration state is loaded from the login payload — no separate fetch on page load. Displays a weekly grid (days × time slots) and a summary list side-by-side or tabbed on mobile. Term selector dropdown defaults to the current Term (status D); shown only when the student has registrations in multiple available Terms. Drop and Waitlist Drop actions call `registrationService`; per-Section outcome is surfaced inline.

## Acceptance criteria

- [ ] My Schedule route is Student-only; Visitors and unauthenticated users are redirected
- [ ] Registration state is consumed from the login payload; no separate API call fires on mount
- [ ] Weekly grid renders registered and waitlisted Sections at their correct day/time slots for the selected Term
- [ ] Summary list shows Section details (instructor, room, modality) alongside the weekly grid
- [ ] Term selector dropdown switches the displayed Term; defaults to status-D Term
- [ ] Drop button calls `registrationService.register([{ sectionId, action: 'drop' }])`; Section is removed from grid and list on success
- [ ] Waitlist Drop button calls `registrationService.register([{ sectionId, action: 'waitlistDrop' }])`; Section removed on success
- [ ] Per-Section outcome (success/error) is shown inline; partial success handled

## Blocked by

- `03-saml-auth`
- `08-cart-registration-actions`
