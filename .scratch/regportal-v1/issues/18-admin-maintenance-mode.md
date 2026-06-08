Status: ready-for-agent

## What to build

Admin-only Maintenance Mode configuration. Form with: type selector (Site or Backend), datetime range picker (start and end), public message textarea, private message textarea. Validated via `useFormValidation` with a cross-field rule: start must be before end. Submitting schedules the maintenance record on the backend; the backend auto-activates and deactivates it at the configured times.

## Acceptance criteria

- [ ] Maintenance Mode route is Admin/Developer only
- [ ] Form renders with type selector, start/end datetime pickers, and public/private message fields
- [ ] `useFormValidation` fires an error on the end field when end is before or equal to start
- [ ] `isValid` is false while any validation error is present; form cannot be submitted in that state
- [ ] Submitting a valid form POSTs the record to the backend; a success toast confirms
- [ ] Backend auto-activates and deactivates Maintenance Mode at the scheduled times without manual action
- [ ] `useFormValidation` composable tests cover: cross-field start < end constraint, `isValid` false with any error, error clears when field is corrected

## Blocked by

- `02-maintenance-mode-gate`
- `03-saml-auth`
