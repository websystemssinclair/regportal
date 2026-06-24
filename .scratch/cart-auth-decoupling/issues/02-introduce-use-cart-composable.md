# Introduce `useCart` composable and strip auth from the Cart store

## What to build

Create a `useCart` composable that is the single integration point between Cart state and auth context. Strip `useAuthStore` entirely from the Cart store — the store becomes pure state management. Migrate all views and composables that mutate the Cart to call `useCart` instead of `useCartStore` directly.

`useCart` proxies all Cart store state and actions, and owns the auth-aware persistence decision after each mutation:

```
useCart() → {
  sections,
  mergeCarryOver,
  add(section),
  remove(courseKey),
  removeRegistered(courseKeys),
  mergeOnLogin(shoppingCart),
  loadAvailability(),
}
```

For `add`, `remove`, and `removeRegistered`: call the store action, then check `authStore.isAuthenticated` — if authenticated, call `saveCart(buildSavePayload(sections, creds))`; otherwise write to localStorage.

For `mergeOnLogin`: call `cartStore.mergeOnLogin(shoppingCart)` (which handles deduplication and sets `mergeCarryOver`), then if `cartStore.mergeCarryOver > 0`, call `saveCart(buildSavePayload(...))`. Credentials are read from `authStore` inside `useCart` — callers pass no auth data.

The Cart store's `add`, `remove`, `removeRegistered`, and `mergeOnLogin` actions are stripped of their `useAuthStore()` calls and `saveCart`/`writeStorage` side effects. `_buildSavePayload` is deleted from the store. `mergeOnLogin` retains its deduplication and `mergeCarryOver` logic only.

## Acceptance criteria

- [ ] `useCart` composable exists and exposes the interface above
- [ ] Cart store has no `useAuthStore` import and no `saveCart` or `writeStorage` calls
- [ ] `_buildSavePayload` is deleted from the Cart store
- [ ] All views and composables that previously called `cartStore.add`, `cartStore.remove`, or `cartStore.removeRegistered` now call `useCart` equivalents
- [ ] Cart store tests drop the `vi.mock('@/stores/auth', ...)` mock and all auth-aware describe blocks — they assert only on `store.sections` and localStorage state
- [ ] New `useCart` tests cover: add/remove/removeRegistered when authenticated (saveCart called, localStorage not written), add/remove when Visitor (localStorage written, saveCart not called), mergeOnLogin with carryover (saveCart called), mergeOnLogin server-cart-only (saveCart not called), mergeOnLogin empty both (no-op)
- [ ] All existing view and composable tests pass without modification

## Blocked by

Issue 01 — extract `buildSavePayload` as a pure function.
