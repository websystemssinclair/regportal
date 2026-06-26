Status: done

## What to build

Create a new `useBuilderCourses` composable that owns the `regportal:builder:courses` localStorage key. It exposes a reactive list of course code strings and four operations: `add(codes[])` (dedup merge), `remove(code)`, `clear()`, and read-on-init so state survives across composable instances and page reloads.

This is the persistence foundation that both the ProgramDetailView checkbox bar and ScheduleBuilderView hydration depend on. Model the pattern after `useCart.js` — read on init, write after every mutation.

Course codes are strings like `"ACC-1210"`. Raw section data is not persisted here.

## Acceptance criteria

- [x] `add(codes[])` appends new codes; calling it with a code already in the list does not create a duplicate
- [x] `add(codes[])` with multiple codes adds all of them in one call
- [x] `remove(code)` removes the matching code and leaves others untouched
- [x] `clear()` empties the list
- [x] On composable init the existing codes are read from localStorage, so a second composable instance in the same app sees the same state
- [x] After any mutation the updated list is written back to localStorage
- [x] Full unit test file exists (modeled on `useCart.test.js`), with `localStorage.clear()` in `beforeEach`

## Blocked by

None — can start immediately
