# Rewrite `useScheduleRegistration` as thin adapter + delete `useRegistrationAction`

Status: done

## What to build

Rewrite `useScheduleRegistration` to be a thin adapter over `useRegistration`. It provides `drop(sectionId)` and `waitlistDrop(sectionId)`. Each resolves credits by searching `authStore.currentCourses` and `authStore.waitlist`, calls `execute` with the appropriate action, then on success splices the section from the correct auth store array. On failure, writes error entries from `results` to `sectionErrorStore`. No `results` or `pending` re-export needed — ScheduleView does not read Registration state from this adapter.

Also rewrite `useScheduleRegistration.test.js` to mock `useRegistration` at the `execute` seam. The `seedAuth` setup is removed. Tests assert on adapter-specific behavior: credits resolution from auth store, `authStore.currentCourses` splice on successful drop, `authStore.waitlist` splice on successful waitlistDrop, `sectionErrorStore` population on failure.

Once all three adapters are migrated (issues #02, #03, and this issue), delete `useRegistrationAction.js` and `useRegistrationAction.test.js`. Verify no remaining imports of `useRegistrationAction` exist in the codebase before deleting.

## Acceptance criteria

- [ ] `useScheduleRegistration` calls `useRegistration().execute(...)` for both `drop` and `waitlistDrop`
- [ ] Credits are resolved from `authStore.currentCourses` and `authStore.waitlist`
- [ ] `authStore.currentCourses` is spliced on successful `drop`
- [ ] `authStore.waitlist` is spliced on successful `waitlistDrop`
- [ ] Failed section errors are written to `sectionErrorStore`
- [ ] `useScheduleRegistration.test.js` mocks `useRegistration`, removes `seedAuth`, and all tests pass
- [ ] `useRegistrationAction.js` is deleted
- [ ] `useRegistrationAction.test.js` is deleted
- [ ] No remaining imports of `useRegistrationAction` exist anywhere in the codebase

## Blocked by

- `.scratch/registration-orchestrator/issues/01-use-registration-deep-module.md`
- `.scratch/registration-orchestrator/issues/02-use-register-now-adapter.md`
- `.scratch/registration-orchestrator/issues/03-use-cart-registration-adapter.md`
