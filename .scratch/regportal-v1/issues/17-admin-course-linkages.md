Status: ready-for-agent

## What to build

Admin-only Course Linkages management. PrimeVue DataTable with Course code and URL columns. Admins can add, edit, and delete Course Linkages. URL format is validated via `useFormValidation` before submission. Saved linkages surface in the Section Search Section detail modal (Course Details) as the Course Linkage field.

## Acceptance criteria

- [ ] Course Linkages route is Admin/Developer only
- [ ] DataTable lists all Course Linkages with Course code and URL columns
- [ ] Admin can add a new linkage; URL is validated for format via `useFormValidation` before submission
- [ ] Admin can edit an existing linkage's URL; same validation applies
- [ ] Admin can delete a linkage; it is removed from the table and no longer appears in Course Details
- [ ] A valid Course Linkage appears in the Section Search Section detail modal for that Course code

## Blocked by

- `03-saml-auth`
- `05-section-search`
