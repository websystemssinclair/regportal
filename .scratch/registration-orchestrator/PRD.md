# Registration Orchestrator — Deep Module Refactor

Status: ready-for-agent

## Problem Statement

Developers adding or modifying Registration behavior must learn three separate composable interfaces, each implementing the same reactive-state / async-execute / reset pattern with slight variations. Every new Registration surface duplicates the pattern again. Bugs in state management (pending tracking, result dismissal, network error handling) must be fixed in multiple places. There is no single test surface for core Registration mechanics — tests pierce through to the HTTP layer from each adapter, requiring full auth store setup even to test side effects.

## Solution

Introduce a single deep `useRegistration` module that owns all Registration state management. The three existing composables (`useRegisterNow`, `useCartRegistration`, `useScheduleRegistration`) become thin adapters — they resolve call-site-specific data, call `execute`, and apply their own side effects. `useRegistrationAction` is absorbed into the deep module's implementation and deleted. The cart store stops tracking transient UI loading state.

## User Stories

1. As a developer adding a new Registration surface, I want a single composable interface for Registration state, so that I don't have to re-implement the pending/results/reset pattern.
2. As a developer fixing a Registration state bug, I want the fix to apply to all Registration surfaces at once, so that I don't have to hunt for equivalent code in three files.
3. As a developer writing tests for Registration mechanics, I want a single composable to mock `registerSections` against, so that I don't need a fully-initialized auth store in every adapter test.
4. As a developer writing an adapter test, I want to mock `useRegistration` at the `execute` seam, so that I can test adapter-specific side effects without re-testing HTTP mechanics.
5. As a developer reading a Registration adapter, I want to see only the logic specific to that call site (action derivation, credits resolution, side effects), so that the adapter is immediately understandable.
6. As a developer reading a Registration error, I want the network error path to be handled in one place, so that I don't have to check whether each adapter catches correctly.
7. As a developer testing CartView loading state, I want the spinner to be driven by the composable's `pending` Set rather than the cart store, so that transient UI state is not mixed into persistent store state.

## Implementation Decisions

### New module: `useRegistration`

The deep module. Owns all Registration state and the HTTP call. Interface:

```
useRegistration() → { execute, results, pending, dismissResult, reset }

execute(sections: Array<{ sectionId, action, credits }>): Promise<void>
results: reactive Record<sectionId, { status: 'success' | 'error', message: string }>
pending: reactive Set<sectionId>
dismissResult(sectionId): void
reset(): void
```

- `execute` adds all section IDs to `pending`, calls the HTTP endpoint, populates `results`, then removes from `pending` — all in one atomic flow.
- Success messages are derived from `action` internally: `add → 'Registered'`, `waitlist → 'Waitlisted'`, `drop → 'Dropped'`, `waitlistDrop → 'Removed from waitlist'`.
- Network errors are caught inside `execute`. All pending sections receive `{ status: 'error', message: 'Registration failed — please try again.' }`. The promise resolves (does not reject) so adapters never need their own try/catch for network failures.
- Credentials (token, studentId, username) are read from the auth store inside the module's implementation — not exposed through the interface.
- HTTP payload construction and response parsing (currently in `useRegistrationAction`) are private implementation details of this module.

### Deleted module: `useRegistrationAction`

Absorbed into `useRegistration`. Not exported after the refactor. Its callers (the three adapters) are updated to use `useRegistration` instead.

### Adapter: `useRegisterNow`

Derives `action` from `sec.status` (`'Open' → 'add'`, otherwise `'waitlist'`). Builds a single-element sections array with credits from `sec.CreditHours`. After `execute`, checks `results[courseKey].status === 'success'` and removes the section from the cart store if present. Re-exports `results` as `sectionResults` and `pending` as `registeringSections` to preserve the interface that `HomeView` and `SearchView` depend on.

### Adapter: `useCartRegistration`

Resolves credits by looking up each `sectionId` in `cartStore.sections`. After `execute`, calls `cartStore.removeRegistered([...succeeded])` and writes error entries from `results` to `sectionErrorStore`. Stops mutating `cartStore.registeringTerms` — that field is removed from the cart store. Returns `{ succeeded: count }` to the caller (count of entries where `results[id].status === 'success'`).

### Adapter: `useScheduleRegistration`

Provides `drop(sectionId)` and `waitlistDrop(sectionId)`. Resolves credits by searching `authStore.currentCourses` and `authStore.waitlist`. After `execute`, checks `results[sectionId].status === 'success'` and splices the section from the appropriate auth store array. Writes error entries from `results` to `sectionErrorStore` on failure. No local `results` or `pending` re-export needed — ScheduleView does not read Registration state from this adapter.

### Cart store: remove `registeringTerms`

`cartStore.registeringTerms` is removed. CartView's loading indicator switches to reading `pending` from the `useCartRegistration` composable instance. The adapter exposes `pending` from `useRegistration` as part of its return value.

### Pending state granularity

`pending` tracks by `sectionId` (CourseKey string). For `useCartRegistration`, CartView can check whether any section in a given term is pending by filtering `pending` against the term's section IDs — or the adapter can expose a derived `isTermRegistering(termId)` computed if that proves cleaner.

## Testing Decisions

**What makes a good test:** assert on the observable interface — `results`, `pending`, return values, and store state after the call. Never assert on internal function calls (HTTP payload shape belongs in `useRegistration` tests, not adapter tests). Each layer tests only what it owns.

### `useRegistration.test.js` (new)

Primary test surface for Registration mechanics. Mocks `registerSections` directly (same HTTP boundary the existing tests use). Prior art: `useCartRegistration.test.js` — same Pinia setup, `seedAuth` helper, `makeSection` factory, `successResponse` helper.

Key cases:
- `execute` with all-success: `results` populated with correct success messages per action (`add → 'Registered'`, etc.), `pending` empty after resolution
- `execute` with partial failure: succeeded entries show `status: 'success'`, failed entries show `status: 'error'` with backend message
- `execute` with all-failure: all entries in `results` with `status: 'error'`
- Network error (rejected promise): all sections in batch get `status: 'error'`, promise resolves (no throw)
- `pending` contains all section IDs during flight, clears after
- `dismissResult(sectionId)` removes one entry from `results`, leaves others
- `reset()` clears all `results` and `pending`

### Adapter tests (rewritten)

Mock `useRegistration` at `execute` (`vi.mock('@/composables/useRegistration')`). `seedAuth` setup removed from adapter tests — credential shape is `useRegistration`'s concern, not the adapter's.

- `useCartRegistration.test.js`: assert cart removal on success, `sectionErrorStore` population on failure, `pending` exposed, `succeeded` count returned
- `useRegisterNow.test.js`: assert action derivation (`Open → add`, else `waitlist`), cart removal when section is in cart, no removal when not in cart, `sectionResults`/`registeringSections` aliases correct
- `useScheduleRegistration.test.js`: assert `authStore.currentCourses` splice on drop success, `authStore.waitlist` splice on waitlistDrop success, `sectionErrorStore` population on failure

### View tests (unchanged)

`CartView.actions.test.js`, `ScheduleView.actions.test.js`, `HomeView.display.test.js`, `SearchView.actions.test.js` all mock at the composable seam and are unaffected by this refactor.

## Out of Scope

- Any change to the Registration HTTP API or payload format
- Error display or toast UI changes
- The `useScheduleRegistration` composable (Schedule Builder) referenced in the report — the existing `useScheduleRegistration` covers My Schedule drop/waitlist-drop only; Schedule Builder registration goes through `useRegisterNow`
- Moving `registeringTerms` removal to a separate cart store refactor — it is in scope here since it is a direct consequence of moving pending state into the deep module
- Candidate C2 (Section display logic extraction) and other architecture candidates from the review session

## Further Notes

- `useRegistrationAction` currently reads `authStore.colleagueToken`, `authStore.user.tartanId`, and `authStore.user.username` to build the HTTP payload. These reads move into `useRegistration`'s implementation. The auth store coupling is intentional and stays — it is not part of this refactor.
- The three adapter composables keep their exported function names unchanged. No view files need to change their import paths.
- `sectionResults` and `registeringSections` in `useRegisterNow`'s return value are aliases for `results` and `pending` from the deep module — same reactive objects, different names for backward compatibility with HomeView and SearchView templates.
