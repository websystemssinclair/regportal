# Rewrite `useCartRegistration` as thin adapter + remove `registeringTerms` from cart store

Status: ready-for-agent

## What to build

Rewrite `useCartRegistration` to be a thin adapter over `useRegistration`. It resolves credits by looking up each `sectionId` in `cartStore.sections`, calls `execute`, then calls `cartStore.removeRegistered([...succeeded])` and writes error entries from `results` to `sectionErrorStore` on failure. Returns `{ succeeded: count }` where count is the number of entries where `results[id].status === 'success'`. Exposes `pending` from `useRegistration` as part of its return value.

Simultaneously, remove `registeringTerms` from the cart store state. CartView's loading indicator switches from reading `cartStore.registeringTerms` to reading `pending` from the `useCartRegistration` composable instance. The adapter should expose a derived `isTermRegistering(termId)` computed (or equivalent) if CartView needs per-term filtering — check CartView's template to determine the right shape.

Also rewrite `useCartRegistration.test.js` to mock `useRegistration` at the `execute` seam. The `seedAuth` setup is removed. Tests assert on adapter-specific behavior: credits resolution from cart sections, cart removal on success, `sectionErrorStore` population on failure, `pending` exposed in return value, `succeeded` count returned.

## Acceptance criteria

- [ ] `useCartRegistration` calls `useRegistration().execute(...)` rather than `useRegistrationAction().register(...)`
- [ ] Credits are resolved from `cartStore.sections` before calling `execute`
- [ ] `cartStore.removeRegistered` is called with succeeded section IDs after `execute`
- [ ] Failed section errors are written to `sectionErrorStore`
- [ ] `pending` from `useRegistration` is exposed in the return value
- [ ] `{ succeeded: count }` is returned with the correct count
- [ ] `registeringTerms` is removed from `cart.js` state and all its mutation sites
- [ ] CartView loading indicator reads from the composable's `pending` (not `cartStore.registeringTerms`) and `cart.test.js` has no assertions on `registeringTerms`
- [ ] `useCartRegistration.test.js` mocks `useRegistration`, removes `seedAuth`, and all tests pass

## Blocked by

- `.scratch/registration-orchestrator/issues/01-use-registration-deep-module.md`
