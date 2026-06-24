# Cart ↔ Auth Decoupling

Status: ready-for-agent

## Problem Statement

Developers working on Cart persistence or auth login flow must initialize both the Cart store and the Auth store together — they cannot be reasoned about or tested in isolation. The Cart store reaches into the Auth store in four places to decide persistence strategy and build HTTP payloads. The Auth store calls Cart's merge action and owns the post-login navigation, coupling auth to two unrelated concerns. Adding a new Cart mutation site silently inherits this coupling.

## Solution

Introduce a `useCart` composable as the single place that knows about both Cart state and auth context. The Cart store becomes pure state management with no knowledge of auth. `buildSavePayload` becomes a pure function in `cartService`. Auth's `handleCallback` returns login data instead of orchestrating side effects — `LoginView` sequences the merge and navigation. Auth drops its Cart and router imports entirely.

## User Stories

1. As a developer testing Cart state mutations, I want the Cart store to have no auth dependency, so that I can initialize it and assert on its state without setting up an auth store mock.
2. As a developer testing auth login flow, I want `handleCallback` to have no Cart or router dependency, so that I can test SAML resolution and user-data population without mocking cart merge or navigation.
3. As a developer adding a new Cart mutation (e.g. a bulk-remove action), I want persistence decisions to live in `useCart`, so that I don't accidentally introduce a new auth coupling in the store.
4. As a developer debugging a payload-shaping bug, I want `buildSavePayload` to be a pure function I can call with fixture data, so that I don't need a running auth store to reproduce it.
5. As a developer reading `LoginView`, I want the login orchestration sequence (resolve SAML → merge Cart → navigate) to be visible in one place, so that I understand the post-login flow without tracing through store action calls.
6. As a developer testing `LoginView`, I want `handleCallback` to return `{ shoppingCart, targetUrl }` rather than driving side effects, so that I can assert on merge and navigation independently.
7. As a developer reading the Cart store, I want its actions to express only state changes, so that the store is immediately understandable without knowledge of auth behavior.
8. As a developer reading `useCart`, I want it to be the authoritative place for "when does a Cart mutation hit the server vs. localStorage?", so that the persistence rule is defined once and not scattered across callers.
9. As a developer writing a view that mutates the Cart, I want a single `useCart` import that exposes both Cart state and mutation actions, so that I don't need to import the store directly.
10. As a developer testing `useCart`, I want to mock `saveCart` and `writeStorage` at the service boundary, so that I can assert on auth-aware persistence without a real backend or localStorage implementation.

## Implementation Decisions

### Cart store: pure state only

The Cart store drops its `useAuthStore` import. All four call sites that currently read from auth (`_buildSavePayload`, `add`, `remove`, `removeRegistered`) are refactored. The store's actions mutate `this.sections` and `this.mergeCarryOver` only — they never decide whether to persist to the server or localStorage, and they never build HTTP payloads.

`mergeOnLogin(shoppingCart)` retains its current merge logic (local-vs-server deduplication, carryover count) but no longer calls `saveCart` internally. It sets `this.mergeCarryOver` as before. The save — if carryover exists — is triggered by `useCart` after the merge.

`_buildSavePayload` is deleted from the store entirely.

### `buildSavePayload` moves to `cartService` as a pure function

Signature: `buildSavePayload(sections, creds)` where `creds` is `{ tartanId, colleagueToken, username }`.

The function maps domain data to the HTTP payload shape the backend expects. It has no store imports and no side effects.

### New composable: `useCart`

The single integration point between Cart state and auth context. Views import this instead of `useCartStore` directly.

Interface (proxies all Cart store state and actions):

```
useCart() → {
  sections,           // reactive, from cartStore
  mergeCarryOver,     // reactive, from cartStore
  add(section),
  remove(courseKey),
  removeRegistered(courseKeys),
  mergeOnLogin(shoppingCart),
  loadAvailability(),
}
```

`add`, `remove`, and `removeRegistered` call the corresponding store action, then check `authStore.isAuthenticated`:
- Authenticated: call `saveCart(buildSavePayload(cartStore.sections, creds))`
- Visitor: write to localStorage

`mergeOnLogin(shoppingCart)` calls `cartStore.mergeOnLogin(shoppingCart)`, then if `cartStore.mergeCarryOver > 0`, calls `saveCart(buildSavePayload(...))`. The auth credentials (`tartanId`, `colleagueToken`, `username`) are read from `authStore` inside `useCart` — never passed as parameters by the caller.

`loadAvailability()` delegates directly to the store — no auth logic needed.

### `auth.handleCallback` loses Cart and router imports

`handleCallback(samlId)` resolves SAML, sets auth state, fetches user data, and returns `{ shoppingCart, targetUrl }`. It does not call `cartStore.mergeOnLogin` and does not call `router.replace`. Auth drops both `useCartStore` and `router` imports.

### `LoginView` orchestrates post-login sequence

```
const { shoppingCart, targetUrl } = await auth.handleCallback(id)
await cart.mergeOnLogin(shoppingCart)
router.replace(targetUrl)
```

`LoginView` imports `useCart` and `useRouter`. It owns the sequencing: auth resolution first, then cart merge (which may trigger a save), then navigation.

The `try/catch` that currently swallows `getUserData` failures remains — if `getUserData` throws, `handleCallback` throws, and `LoginView` can handle or surface that.

## Testing Decisions

**What makes a good test:** assert on observable outputs — store state, return values, calls to service boundaries (`saveCart`, `writeStorage`). Do not assert on internal function calls or implementation wiring. Each layer tests only what it owns.

### `cartService` — `buildSavePayload` (new tests)

Pure function: call with fixture `sections` and `creds`, assert the output payload shape. No mocks needed. Prior art: `src/services/__tests__/services.test.js`.

### `cartStore` tests (simplified)

Drop the `vi.mock('@/stores/auth', ...)` mock entirely — the store has no auth dependency after the refactor. Tests for `add`, `remove`, `removeRegistered` assert only on `store.sections` and localStorage state. Auth-aware persistence tests move to `useCart`. Prior art: `src/stores/__tests__/cart.test.js` — keep structure, delete auth mock and auth-aware describe blocks.

### `useCart` tests (new)

Primary test surface for auth-aware persistence. Mock `saveCart` (from cartService) and `localStorage`. Set up `authStore` via Pinia (no mock needed — `useCart` reads it as a real store). Prior art: `src/composables/__tests__/useCartRegistration.test.js` — same Pinia setup pattern, `makeSection` factory.

Key cases:
- `add` when authenticated: `saveCart` called, localStorage not written
- `add` when Visitor: localStorage written, `saveCart` not called
- `remove` when authenticated: `saveCart` called with updated sections
- `remove` when Visitor: localStorage updated
- `removeRegistered` when authenticated: `saveCart` called with remaining sections
- `mergeOnLogin` with carryover: `cartStore.mergeOnLogin` called, then `saveCart` called, `mergeCarryOver` set
- `mergeOnLogin` without carryover (server cart only): `saveCart` not called
- `mergeOnLogin` with empty both: no-op

### `auth.handleCallback` tests (simplified)

Drop `vi.mock('@/stores/cart', ...)` and `vi.mock('@/router', ...)` — auth has no dependency on either after the refactor. Assert that `handleCallback` resolves to `{ shoppingCart, targetUrl }` with correct values from the API response. Prior art: `src/stores/__tests__/auth.test.js` — keep all existing cases, delete cart mock setup and navigation assertions.

### `LoginView` tests (new or updated)

Mock `useAuthStore.handleCallback` to return `{ shoppingCart: [...], targetUrl: 'home' }`. Mock `useCart.mergeOnLogin`. Assert that `mergeOnLogin` is called with the shoppingCart and that navigation fires after. Prior art: `src/views/__tests__/CartView.actions.test.js` — same mount-with-pinia pattern.

## Out of Scope

- Any change to the Registration flow or Registration composables
- Changes to `cartStore.loadAvailability` (no auth dependency today)
- The `VITE_SKIP_AUTH` dev-mode path in the auth store initial state — no change needed; `useCart` reads `isAuthenticated` which the dev stub already sets to `true`
- Candidate 4 (deepening the service layer past HTTP pass-through) — `buildSavePayload` moves to `cartService` but the service's HTTP boundary is otherwise unchanged
- Candidate 5 (reference data initialization seam)

## Further Notes

- The `try/catch` in `handleCallback` around `getUserData` means `shoppingCart` and `targetUrl` are only available in the happy path. The catch block should either rethrow or return a sensible default so `LoginView` can handle failure gracefully. The current behavior (login succeeds, cart merge deferred until re-login) is acceptable to preserve.
- `useCart` becomes the authoritative answer to "how does a Cart mutation reach the backend?" — document this in a comment if the persistence branching logic is non-obvious.
- ADR recorded at `docs/adr/0001-break-cart-auth-bidirectional-coupling.md`.
