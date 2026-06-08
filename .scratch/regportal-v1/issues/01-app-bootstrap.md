Status: done

## What to build

Wire up the Vite project with all foundational infrastructure: PrimeVue registered globally in unstyled mode with a custom passthrough preset under `src/presets/`, Pinia installed and mounted, Vue Router installed with a `beforeEach` role guard that reads `meta.roles` on each route and redirects unauthenticated users to login and unauthorized users to a 403 page, and a single Axios instance configured with `VITE_API_BASE_URL` and `VITE_API_APP_PATH` with auth interceptors. Per-domain service modules (`sectionsService`, `cartService`, `programsService`, `registrationService`, `adminService`, `authService`) are scaffolded as named-export modules — no catch-all file.

## Acceptance criteria

- [x] Vite dev server starts with `@tailwindcss/vite` plugin; Tailwind v4 utility classes apply
- [x] PrimeVue is registered in unstyled mode with a passthrough preset; a sample PrimeVue component renders without default PrimeVue styles
- [x] Pinia store is mountable and readable from a component
- [x] Vue Router is installed; navigating to a Student-only route while unauthenticated redirects to login
- [x] Axios instance is exported and uses `VITE_API_BASE_URL` + `VITE_API_APP_PATH`; per-domain service files exist as named-export modules
- [x] `VITE_SKIP_AUTH=true` is recognized by the app (no crash; can be toggled in `.env.development`)

## Blocked by

None — can start immediately.
