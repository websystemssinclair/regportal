# Section Search: inline accordion expand, not separate view or modal

Section Search uses a two-level inline accordion: Course cards in the results list expand in place to reveal Section rows and Course Details. v1 navigated to a separate Course Details view on card click; this was a documented user complaint — students lost their scroll position and filter state on every expansion.

The accordion keeps the student in the results list. They can open one Course, scan its Sections, close it, and open the next without a navigation round-trip. Filter state and scroll position are preserved.

The 100+ section edge case (high-enrollment courses like ENG 1101) is handled client-side: the first 20 Section rows are shown on expand; a "Show all X sections" control reveals the rest. The `/Sections/` endpoint returns all sections in one payload so no additional fetch is needed.

## Considered Options

- **Separate view (v1 approach)** — rejected: destroys filter state and scroll position on each expand; documented user complaint
- **Modal** — rejected: interrupts scanning flow; adds a dismiss step between each Course; awkward on mobile when comparing multiple Courses
- **Drawer/side panel** — rejected: works on desktop but competes with the filter panel on small viewports; adds layout complexity
- **Inline accordion (chosen)** — preserves filter state and scroll position; naturally mobile-first; edge case of 100+ sections handled by cap + expand client-side
