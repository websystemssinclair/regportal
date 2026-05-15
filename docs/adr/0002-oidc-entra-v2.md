# Auth: migrate from SAML to OIDC (Microsoft Entra) in v2

Status: proposed (v2) — v1 ships with SAML

RegPortal v1 authenticates via SAML redirect to Sinclair SSO, which is backed by Microsoft Entra. Because Entra supports OIDC natively on the same tenant, v2 should migrate to OIDC using `@azure/msal-browser`. OIDC is more SPA-friendly: `handleRedirectPromise()` processes the callback in the existing SPA session (no full page reload), `acquireTokenSilent()` handles token refresh transparently, and Bearer tokens replace session cookies on every API call. The ColdFusion backend must add JWT validation against Entra's JWKS endpoint and expose a custom API scope (e.g. `api://regportal/access`). App Roles (`Student`, `Admin`, `Developer`) are defined in the Entra app registration and arrive in `idTokenClaims.roles[]` — the authStore interface and Vue Router guards are unchanged.

## Considered Options

- **SAML (v1, current)** — works today; no Entra app registration changes required; full page reload after IdP redirect; session-cookie auth on API calls
- **OIDC via `@azure/msal-browser` (v2, chosen for migration)** — same Entra IdP, no redirect handled client-side, silent token refresh, Bearer token auth; requires new SPA + API app registrations and backend JWT validation middleware
