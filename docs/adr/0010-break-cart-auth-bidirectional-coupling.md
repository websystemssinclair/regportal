# ADR 0001 — Break the Cart ↔ Auth bidirectional coupling

**Status:** Accepted  
**Date:** 2026-06-24

## Context

`cart.js` imports `useAuthStore` in four places to read `isAuthenticated`, `tartanId`, `colleagueToken`, and `username`. `auth.js` imports `useCartStore` to call `mergeOnLogin` after login. Neither store is independently testable.

`auth.js` also imports `router` to navigate after `handleCallback` completes, coupling auth to the routing layer unnecessarily.

## Decision

Break the coupling with four coordinated changes:

**1. Cart store becomes pure state.**  
`cart.js` drops its `useAuthStore` import. It manages section state only — it never decides whether to persist to the server or localStorage, and it never builds HTTP payloads.

**2. `buildSavePayload` moves to `cartService.js` as a pure function.**  
Signature: `buildSavePayload(sections, creds)` where `creds` is `{ tartanId, colleagueToken, username }`. Payload shaping is an HTTP contract detail; it belongs in the service layer.

**3. A `useCart` composable owns persistence and proxies all cart operations.**  
It wraps both `useCartStore` and `useAuthStore`. It decides whether to call `saveCart` or `writeStorage` after mutations. Views import `useCart` exclusively — the store is a private implementation detail.

**4. `handleCallback` becomes a pure auth concern.**  
It drops its `router` and `useCartStore` imports. It resolves SAML, sets auth state, fetches user data, and returns `{ shoppingCart, targetUrl }`. `LoginView` calls it, then calls `useCart().mergeOnLogin(shoppingCart)`, then navigates. `LoginView` owns the login orchestration sequence.

## Alternatives considered

**Event bus / watch**: auth emits a login event; a watcher in `useCart` triggers the merge. Rejected — implicit coordination is harder to trace than an explicit call sequence in `LoginView`.

**Mediator store**: a third store that imports both and coordinates. Rejected — it concentrates coupling rather than eliminating it; both stores would still be untestable in isolation.

**Keep bidirectional coupling**: no change. Rejected — every new Cart mutation site must know about auth, and neither store can be unit-tested without initializing the other.

## Consequences

- `cart.js` and `auth.js` can be tested without initializing each other.
- `buildSavePayload` can be tested as a pure function.
- `handleCallback` no longer owns navigation — `LoginView` does. This is a mild increase in `LoginView` responsibility but makes `handleCallback` easier to test.
- All views that previously called `cartStore` directly must switch to `useCart`. This is a mechanical change with no behavioral impact.
