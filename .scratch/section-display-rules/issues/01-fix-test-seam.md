# Fix HomeView test seam

Status: done

## Parent

`.scratch/section-display-rules/PRD.md`

## What to build

The existing test file `SearchView.actions.test.js` imports from `@/views/SearchView.vue`, which does not exist — the file was renamed to `HomeView.vue`. Fix the import so the test suite compiles and all existing tests pass.

Also update the `makeSection()` factory in that file to reflect the real API field shapes. The current factory includes stale fields (`iconTitle: 'Face to Face'`, `location: 'Main Campus'`) and is missing all the fields that the upcoming display rules depend on. After this issue, `makeSection()` should include sensible defaults for: `SectionLoc`, `regEndDate`, `regStartDate`, `isFuture`, `additionalSched`, `otherFee`, `labFee`, `printedComments`, `startDate`, `endDate`, `restrictions`, `satLocation`, `isFlexpace`, `building`, `waitListAllowed`.

This is purely a prefactor — no new behavior, no new tests.

## Acceptance criteria

- [x] `SearchView.actions.test.js` imports from `HomeView.vue` and all tests pass
- [x] `makeSection()` factory includes defaults for all fields listed above
- [x] `iconTitle` and `location` removed from `makeSection()` (no longer part of the display contract)
- [x] No existing test assertions are broken by the factory change

## Blocked by

None — can start immediately.
