Status: done

## What to build

Implement SAML authentication as actions on `authStore` (`login()`, `handleCallback(samlId)`, `logout()`) plus a thin `useAuth` composable alias. `LoginView` auto-redirects to SSO on load when no `?ID` param is present; handles the callback when `?ID` is present.

Reference `authService.js` for the three API calls — do not add new HTTP calls.

## API contract

### `getApiToken()` — app init only
Called once in `main.js` before mount. Stores the returned token in `localStorage` under the key `apiKey` for the `apiClient` interceptor. This is a service-level token that persists for the session; it is never swapped out per user.

### `sendSamlRequest()` — called by `login()`
Returns a raw ID string. `login()` builds the SSO redirect URL:
```
https://sso.sinclair.edu/EasyConnect/REST/default.aspx?ID={id}
```
Then sets `window.location.href` to that URL.

### SAML callback
Sinclair SSO redirects back to `VITE_TARGET_URL` with `?ID=ABC123`. The `ID` query param is the `samlId` passed to `handleCallback(samlId)`.

### `retrieveUserFromSaml(samlId)` — called by `handleCallback`
Response shape:
```json
{
  "success": true,
  "targetUrl": "search",
  "firstName": "Brian",
  "lastName": "Cooney",
  "email": "Brian.Cooney@sinclair.edu",
  "tartanId": 521272,
  "username": "brian.cooney",
  "imageLink": "https://tartanimages.sinclair.edu/0521272.jpg?ssp=...",
  "availableRoles": [
    { "role": "Developer", "roleId": "81", "access": [...] }
  ],
  "currentRole": "",
  "password": "(placeholder — ignore)",
  "isActive": 1
}
```

## Role priority

Extract role strings with `availableRoles.map(r => r.role)`. Assign the highest-priority role present:

```
Developer → Admin → Student → Visitor
```

`Visitor` is the default when `availableRoles` is empty or the user is unauthenticated.

## Return-to-URL

- Before `login()` redirects: `sessionStorage.setItem('regportal:returnTo', window.location.href)`
- After `handleCallback()` resolves: read and clear `sessionStorage.getItem('regportal:returnTo')`; if present, `router.replace()` to that URL
- If sessionStorage key is absent, fall back to `response.targetUrl` (treat as a route name, e.g. `"search"`)

## `authStore` additions

New actions alongside existing state:

```js
login()               // saves returnTo, calls sendSamlRequest, redirects to SSO
handleCallback(id)    // calls retrieveUserFromSaml, sets user/role/isAuthenticated, restores returnTo
logout()              // clears isAuthenticated, user, currentRole; removes 'regportal:returnTo' from sessionStorage
```

`authStore.user` stores: `{ firstName, lastName, email, tartanId, username, imageLink }`.

## `useAuth` composable

`src/composables/useAuth.js` — thin alias satisfying the acceptance criteria interface:

```js
export function useAuth() {
  const store = useAuthStore()
  return {
    user: computed(() => store.user),
    role: computed(() => store.currentRole),
    isAuthenticated: computed(() => store.isAuthenticated),
    login: store.login,
    logout: store.logout,
  }
}
```

## `VITE_SKIP_AUTH=true` mock

When the env var is set, `handleCallback` is skipped entirely and `authStore` is pre-populated on init:

```js
{ firstName: 'Dev', lastName: 'User', email: 'dev@sinclair.edu', tartanId: 0, username: 'dev', imageLink: '' }
```

Role: `Developer`. `isAuthenticated: true`.

## `LoginView` behavior

- On mount: if `?ID` query param is present → call `handleCallback(id)`. If absent → call `login()` (auto-redirect, no button).

## Logout

Client-side only for v1 (IdP logout deferred). Clears `authStore` state and `sessionStorage`. Redirects to `/login`.

## Acceptance criteria

- [x] `useAuth` exposes `user`, `role`, `isAuthenticated`, `login()`, `logout()`
- [x] Calling `login()` stores the current URL in `sessionStorage` (`regportal:returnTo`) then redirects to Sinclair SSO
- [x] After SAML callback, `handleCallback` calls backend to resolve `samlId` → user, reads `availableRoles`, assigns highest-priority role
- [x] If `availableRoles` contains both Admin and Student, `role` resolves to Admin; Developer beats all
- [x] Return-to-URL from `sessionStorage` is restored after callback; falls back to `response.targetUrl`
- [x] `VITE_SKIP_AUTH=true` injects a Developer mock user without a real SAML session
- [x] `logout()` clears session state; subsequent route guard checks treat user as Visitor
- [x] `useAuth` tests cover: role priority, return-to-URL lifecycle, `isAuthenticated` state, `logout()` teardown

## Blocked by

- `01-app-bootstrap`
