Status: ready-for-human

## What to build

Implement the `useAuth` composable covering the full SAML authentication lifecycle: redirect to Sinclair SSO, callback handling (call backend to retrieve user from `samlId`, read `availableRoles`, assign highest-priority role: Developer → Admin → Student → Visitor), return-to-URL stored in `sessionStorage` before redirect and restored after callback, `VITE_SKIP_AUTH=true` mock user injection for local dev, and `logout()` clearing session state.

Reference `sample/saml.js` and `sample/useAuth.js` for the API contract (`/authenticate`, `/saml/RetrieveSSOUser/{samlId}`, `/saml/SendRequest`) and session key conventions — do not copy verbatim.

## Acceptance criteria

- [ ] `useAuth` exposes `user`, `role`, `isAuthenticated`, `login()`, `logout()`
- [ ] Calling `login()` stores the current URL in `sessionStorage` then redirects to Sinclair SSO
- [ ] After SAML callback, `useAuth` calls backend to resolve `samlId` → user, reads `availableRoles`, assigns highest-priority role
- [ ] If `availableRoles` contains both Admin and Student, `role` resolves to Admin; Developer beats all
- [ ] Return-to-URL from `sessionStorage` is restored after callback; user lands on the page they were on before login
- [ ] `VITE_SKIP_AUTH=true` injects a mock user without a real SAML session; app is fully functional in dev
- [ ] `logout()` clears session state; subsequent route guard checks treat user as Visitor
- [ ] `useAuth` tests cover: role priority, return-to-URL lifecycle, `isAuthenticated` state, `logout()` teardown

## Blocked by

- `01-app-bootstrap`

## Comments

<!-- Maintainer: add full SAML API contract details here before promoting to ready-for-agent -->
