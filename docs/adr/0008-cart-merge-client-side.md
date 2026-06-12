# ADR-0008: Cart merge on login is client-side

**Status**: Accepted

## Context

When an authenticated user logs in, their pre-login localStorage Cart must be merged with their existing backend Cart (Preferred Sections from Colleague, delivered in the login payload as `shoppingCart`). The original issue spec called for a backend merge endpoint. During design review, we discovered that the login payload already delivers the full backend cart state, making a round-trip unnecessary.

## Decision

Merge is performed entirely client-side in `cartStore.mergeOnLogin(shoppingCart)`:

1. Seed a Map keyed by `CourseKey` from the `shoppingCart` items in the login payload
2. Add any localStorage items whose `CourseKey` is not already in the Map
3. The delta count (new items from localStorage) drives the toast message
4. Clear localStorage; set store state to the merged Map values
5. Fire `saveCart()` to persist the merged result to Colleague

## Alternatives considered

**Server-side merge endpoint**: POST localStorage sections to a `/cart/merge` endpoint; backend merges with Colleague and returns the result. Rejected because the login payload already contains the full backend cart — a second round-trip buys nothing and adds a new endpoint to maintain.

## Consequences

- No dedicated merge endpoint needed on the backend
- `mergeOnLogin()` must be called with the `shoppingCart` array from the login payload; it is not self-sufficient (cannot re-fetch backend state on its own)
- `shoppingCart` items from the login payload are trusted as authoritative for any duplicate `CourseKey` — their version wins over the localStorage version
