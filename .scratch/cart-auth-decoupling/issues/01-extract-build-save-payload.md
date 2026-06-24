# Extract `buildSavePayload` as a pure function in `cartService`

## What to build

Move the payload-shaping logic currently inside `cartStore._buildSavePayload` into `cartService` as a named export `buildSavePayload(sections, creds)`, where `creds` is `{ tartanId, colleagueToken, username }`. The function maps domain data to the HTTP payload shape the backend expects — no store imports, no side effects.

Add tests asserting the output payload shape from fixture inputs. No behavioral change anywhere in the app — this is a pure prefactor that establishes the seam used by the `useCart` composable in the next issue.

## Acceptance criteria

- [ ] `buildSavePayload(sections, creds)` is a named export from `cartService`
- [ ] The function has no imports from any store
- [ ] `cartStore._buildSavePayload` is updated to call `buildSavePayload` (delegating, not duplicating) — full deletion deferred to the next issue when the store is stripped of auth
- [ ] New tests in `cartService` test file assert the output payload shape: `token`, `studentId` (parsed integer), `username`, and `sections` array with `Credits`, `SectionId`, `StudentId` per entry
- [ ] All existing tests pass

## Blocked by

None — can start immediately.
