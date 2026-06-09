Status: ready-for-agent

## What to build

On app init, fetch a lightweight `/status` endpoint and store the result in a `maintenanceStore` Pinia store. Two modes:

- **Site mode**: router redirects all non-Admin routes to a static maintenance page displaying the public message.
- **Backend mode**: `cartStore` and `registrationService` check `maintenanceStore.isBackendDown` before any mutation; Cart and Register UI surfaces a notice and disables action buttons.

Maintenance state is fetched once on init for v1 (no polling).

## Acceptance criteria

- [x] `/status` is called before any route renders; result stored in `maintenanceStore`
- [x] Site mode: navigating to any non-Admin route redirects to a maintenance page showing the public message
- [x] Site mode: Admin and Developer roles can still navigate normally
- [ ] Backend mode: Cart add/waitlist buttons are disabled and a notice with the public message is visible
- [ ] Backend mode: Section search and browsing remain fully functional
- [x] `maintenanceStore.isBackendDown` is exported and readable from any component or store

## Blocked by

- `01-app-bootstrap`

## Comments

### 2026-06-08 — partial implementation

Completed in this pass:
- `src/stores/maintenance.js` — `useMaintenanceStore` with `mode`, `publicMessage`, `isBackendDown` getter, `setStatus` action
- `src/services/statusService.js` — `getStatus()` calling `GET /status`
- `src/views/MaintenanceView.vue` — displays `publicMessage` from the store
- `src/router/guard.js` — `maintenanceGuard` exported alongside `roleGuard`
- `src/router/index.js` — `/maintenance` route added; `maintenanceGuard` registered as first `beforeEach`
- `src/main.js` — `getStatus()` called on init; app mounts in `finally` so the status is known before any route renders

Remaining: the two backend-mode Cart/Register UI criteria require `cartStore` and the Cart/Register surfaces, which don't exist yet. `maintenanceStore.isBackendDown` is in place and ready to be consumed when those are built.
