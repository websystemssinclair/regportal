Status: ready-for-agent

## What to build

Add and Waitlist Registration Actions triggered from the Cart. `registrationService.register(actions[])` submits an array of `{ sectionId, action }` tuples; the backend processes each independently and returns per-Section outcomes. The Cart surfaces outcomes inline: success badge or error message per Section card.

Additional behaviors:
- Action buttons disabled during in-flight submission; re-enabled after response
- When `maintenanceStore.isBackendDown` is true, all action buttons are disabled with a visible maintenance notice
- Sections from a Term with status F are labeled "not open"; button is still rendered — frontend does not block the action
- Stale Sections (Cancelled/Closed) remain visible with status badge; student removes them manually

## Acceptance criteria

- [ ] Add button triggers `registrationService.register([{ sectionId, action: 'add' }])` for Open Sections
- [ ] Waitlist button triggers `registrationService.register([{ sectionId, action: 'waitlist' }])` for Closed/Waitlist Sections
- [ ] Per-Section outcome (success badge or error) is shown inline after response; partial success is handled correctly
- [ ] Action buttons are disabled and show a loading state during in-flight submission
- [ ] When `maintenanceStore.isBackendDown` is true, all action buttons are disabled and a maintenance notice is visible
- [ ] Future-Term Sections (status F) are labeled "not open"; Add/Waitlist button is still rendered
- [ ] Registration state in `useCartStore` reflects the backend response without requiring a full Cart reload

## Blocked by

- `02-maintenance-mode-gate`
- `03-saml-auth`
- `06-visitor-cart`
