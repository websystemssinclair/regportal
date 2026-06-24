# Rewrite `useRegisterNow` as thin adapter

Status: done

## What to build

Rewrite `useRegisterNow` to be a thin adapter over `useRegistration`. It derives `action` from `sec.status` (`'Open' → 'add'`, otherwise `'waitlist'`), calls `execute` with a single-element sections array using credits from `sec.CreditHours`, then on success checks `results[courseKey].status === 'success'` and removes the section from the cart store if present.

The public interface is unchanged: `useRegisterNow` continues to return `{ sectionResults, registeringSections, registerNow, dismissResult, reset }`. `sectionResults` and `registeringSections` are aliases for `results` and `pending` from `useRegistration` — same reactive objects, different names for backward compatibility with HomeView and SearchView.

Also rewrite `useRegisterNow.test.js` to mock `useRegistration` at the `execute` seam (`vi.mock('@/composables/useRegistration')`). The `seedAuth` setup is removed from this test — credential handling is `useRegistration`'s concern. Tests assert on adapter-specific behavior only: action derivation, cart removal on success, no removal when section is absent from cart, and correct re-export of `sectionResults`/`registeringSections` aliases.

## Acceptance criteria

- [ ] `useRegisterNow` calls `useRegistration().execute(...)` rather than `useRegistrationAction().register(...)`
- [ ] `action` is `'add'` when `sec.status === 'Open'`, `'waitlist'` otherwise
- [ ] On success, section is removed from the cart store if present; no removal if absent
- [ ] `sectionResults` and `registeringSections` are the same reactive objects as `results` and `pending` from `useRegistration`
- [ ] `dismissResult` and `reset` are forwarded from `useRegistration` unchanged
- [ ] `useRegisterNow.test.js` mocks `useRegistration` (not `registerSections`), removes `seedAuth`, and all tests pass
- [ ] HomeView and SearchView require no import or template changes

## Blocked by

- `.scratch/registration-orchestrator/issues/01-use-registration-deep-module.md`
