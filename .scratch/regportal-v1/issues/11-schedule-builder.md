Status: ready-for-human

## What to build

Schedule Builder takes a list of Courses (soft cap: 7) and optional filters and generates up to 50 non-conflicting Schedule combinations.

**Computation**: `useScheduleBuilder` composable dispatches to a dedicated Web Worker. The worker uses backtracking with early conflict pruning — it does not materialize all combinations before filtering. Filter changes re-dispatch to the worker without re-fetching Sections from the backend.

**Filters** (shared filter contract with Section Search — see `05-section-search` comments): day/time range slider (6am–11pm) with preset snapping (Mornings → 6am–noon, Afternoons → noon–5pm, Evenings → 5pm–11pm); modality; location; day-of-week checkboxes. Filter changes instantly re-run without a new "Build" click.

**Results**: displayed as selectable mini-grid cards (one per Schedule). "Select Schedule" adds all Sections in the chosen Schedule to the Cart at once. Reference `ScheduleResults.png` in `.scratch/regportal-v1/samples/` for layout.

Known constraint: SAML redirect triggered from the Schedule Builder discards current results. Student must rebuild after login. Accepted behavior — not a bug.

## Acceptance criteria

- [ ] Entering Courses and building dispatches to a Web Worker; UI remains responsive during computation
- [ ] Filter changes re-run the worker without a new network request
- [ ] Mornings/Afternoons/Evenings presets snap the time range slider to correct bounds
- [ ] Up to 50 valid, non-conflicting Schedules are returned and displayed as selectable mini-grid cards
- [ ] "Select Schedule" adds all Sections in the chosen Schedule to the Cart in one action
- [ ] Entering more than 7 Courses shows a soft warning (exact copy to be confirmed in Comments)
- [ ] Web Worker message protocol and conflict definition documented in Comments before promoting to ready-for-agent

## Blocked by

- `05-section-search`
- `06-visitor-cart`

## Comments

<!-- Maintainer: add Worker message protocol, conflict definition (time overlap semantics across meeting slots), and any soft-cap behavior for 7+ Courses before promoting to ready-for-agent. Filter param contract comes from 05-section-search comments. -->
