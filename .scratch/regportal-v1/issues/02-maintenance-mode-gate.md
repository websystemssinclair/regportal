Status: ready-for-agent

## What to build

On app init, fetch a lightweight `/status` endpoint and store the result in a `maintenanceStore` Pinia store. Two modes:

- **Site mode**: router redirects all non-Admin routes to a static maintenance page displaying the public message.
- **Backend mode**: `cartStore` and `registrationService` check `maintenanceStore.isBackendDown` before any mutation; Cart and Register UI surfaces a notice and disables action buttons.

Maintenance state is fetched once on init for v1 (no polling).

## Acceptance criteria

- [ ] `/status` is called before any route renders; result stored in `maintenanceStore`
- [ ] Site mode: navigating to any non-Admin route redirects to a maintenance page showing the public message
- [ ] Site mode: Admin and Developer roles can still navigate normally
- [ ] Backend mode: Cart add/waitlist buttons are disabled and a notice with the public message is visible
- [ ] Backend mode: Section search and browsing remain fully functional
- [ ] `maintenanceStore.isBackendDown` is exported and readable from any component or store

## Blocked by

- `01-app-bootstrap`
