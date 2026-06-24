# Decouple `handleCallback` and wire `LoginView` as post-login orchestrator

## What to build

`handleCallback(samlId)` currently owns Cart merge and navigation in addition to auth resolution — it imports both `useCartStore` and `router`. Separate these concerns so each module owns exactly one thing.

`handleCallback` becomes a pure auth concern: resolve SAML, set user state, fetch user data, and return `{ shoppingCart, targetUrl }`. It does not call `cartStore.mergeOnLogin` and does not call `router.replace`. Auth drops both `useCartStore` and `router` imports.

`LoginView` becomes the post-login orchestrator. It sequences:

```
const { shoppingCart, targetUrl } = await auth.handleCallback(id)
await cart.mergeOnLogin(shoppingCart)
router.replace(targetUrl)
```

`LoginView` imports `useCart` and `useRouter`. The `try/catch` that currently swallows `getUserData` failures remains — if `getUserData` throws, `handleCallback` throws and `LoginView` handles or surfaces the failure. The existing behavior (login succeeds, Cart merge deferred until re-login) is acceptable to preserve.

## Acceptance criteria

- [ ] `handleCallback` returns `{ shoppingCart, targetUrl }` and has no `useCartStore` or `router` imports
- [ ] `LoginView` calls `auth.handleCallback`, then `cart.mergeOnLogin`, then navigates — in that order
- [ ] Auth store tests drop `vi.mock('@/stores/cart', ...)` and `vi.mock('@/router', ...)` and their associated setup; existing handleCallback tests are updated to assert on the return value rather than cart mock calls and router.replace calls
- [ ] `LoginView` has tests asserting: `mergeOnLogin` is called with the shoppingCart from `handleCallback`, navigation fires after merge, error from `handleCallback` surfaces correctly
- [ ] All existing tests pass

## Blocked by

Issue 02 — introduce `useCart` composable (LoginView needs `useCart.mergeOnLogin`).
