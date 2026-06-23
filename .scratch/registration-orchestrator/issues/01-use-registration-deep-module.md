# Create `useRegistration` deep module

Status: done

## What to build

Introduce a new `useRegistration` composable that owns all Registration state and the HTTP call. This is the foundational module for the Registration Orchestrator refactor — the three adapter composables will be migrated to it in subsequent issues.

The module exposes:

```
useRegistration() → { execute, results, pending, dismissResult, reset }

execute(sections: Array<{ sectionId, action, credits }>): Promise<void>
results: reactive Record<sectionId, { status: 'success' | 'error', message: string }>
pending: reactive Set<sectionId>
dismissResult(sectionId): void
reset(): void
```

`execute` adds all section IDs to `pending`, builds the HTTP payload (using credentials from the auth store), calls `registerSections`, parses the response, populates `results` with per-section success or error entries, then clears `pending`. Network errors are caught inside `execute` — all pending sections receive `{ status: 'error', message: 'Registration failed — please try again.' }` and the promise resolves rather than rejects.

Success messages are derived from `action` inside the module: `add → 'Registered'`, `waitlist → 'Waitlisted'`, `drop → 'Dropped'`, `waitlistDrop → 'Removed from waitlist'`.

The HTTP payload construction and response parsing currently in `useRegistrationAction` move here as private implementation details. No existing files change in this issue — adapters are migrated in issues #02–#04.

Also create `src/composables/__tests__/useRegistration.test.js` covering:
- all-success: `results` has correct success messages per action, `pending` empty after resolution
- partial failure: succeeded entries `status: 'success'`, failed entries `status: 'error'` with backend message
- all-failure: all `results` entries `status: 'error'`
- network error: all sections get `status: 'error'`, promise resolves (no throw)
- `pending` contains all section IDs during flight, clears after
- `dismissResult(sectionId)` removes one entry from `results`, leaves others
- `reset()` clears all `results` and `pending`

Prior art for test setup: `useCartRegistration.test.js` — same Pinia setup, `seedAuth` helper, `makeSection` factory, `successResponse` helper.

## Acceptance criteria

- [ ] `src/composables/useRegistration.js` exists and exports `useRegistration`
- [ ] `execute` populates `results` with the correct success message for each action (`add`, `waitlist`, `drop`, `waitlistDrop`)
- [ ] `execute` populates `results` with `status: 'error'` and backend message for each failed section
- [ ] `execute` catches network errors and resolves (does not reject); all sections in the batch receive `status: 'error'`
- [ ] `pending` contains every section ID submitted to `execute` during the in-flight period and is empty after resolution
- [ ] `dismissResult(sectionId)` removes exactly one entry from `results`
- [ ] `reset()` clears both `results` and `pending`
- [ ] `src/composables/__tests__/useRegistration.test.js` covers all cases above and passes
- [ ] No existing files are modified

## Blocked by

None — can start immediately
