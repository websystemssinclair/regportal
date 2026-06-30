Status: done

## Parent

`.scratch/schedule-builder-results-redesign/issues/04-adaptive-mini-grid.md`

## What to build

Optimize the mini-grid so `gridRange` is called once per schedule card rather than once per rendered block.

Currently, `:style="blockStyle(sec, gridRange(schedule))"` sits inside a `v-for` over blocks. `gridRange` iterates all sections of the schedule on every block render. At scale (many schedule cards, each with multiple sections across multiple days), this is O(cards × sections-per-card × blocks) instead of O(cards).

The recommended fix is a `scheduleRanges` computed property that builds a `Map` keyed by `scheduleKey`:

```js
const scheduleRanges = computed(() => {
  const map = new Map()
  for (const s of sortedSchedules.value) {
    map.set(scheduleKey(s), gridRange(s))
  }
  return map
})
```

Then update the template binding to:
```html
:style="blockStyle(sec, scheduleRanges.get(scheduleKey(schedule)))"
```

This is a pure performance change — no behavior difference. Verify `npm run test` passes after the change.

**Before implementing:** confirm with the team that the added abstraction (`scheduleRanges` computed Map) is warranted for this codebase's expected card count. If the portal realistically displays ≤ 20 cards, the optimization is not load-bearing and this issue can be closed as `wontfix`.

## Acceptance criteria

- [ ] `gridRange` is no longer called inside the block `v-for`
- [ ] `scheduleRanges` computed Map (or equivalent per-card caching) drives `blockStyle`
- [ ] `npm run test` passes
- [ ] No behavior change — mini-grid renders identically to before

## Blocked by

- Issue 05 (code-review fixes must be committed first)
