Status: done

## What to build

Strip the per-view crimson header bars from all inner views and replace them with lightweight page titles. With the global nav in place, the `bg-[#ac1a2f]` header bar each view currently renders is redundant and creates a double-header effect.

**Pattern to remove** (present in every inner view):
```html
<div class="bg-[#ac1a2f] px-4 py-5">
  <div class="mx-auto max-w-Xdl">
    <h1 class="text-xl font-bold text-white">Page Title</h1>
  </div>
</div>
```

**Pattern to add** — inside the existing content wrapper, as the first element:
```html
<h1 class="text-2xl font-bold tracking-tight text-gray-900 mb-6">Page Title</h1>
```

Views to update: Programs, Cart, My Schedule, Schedule Builder, Booklist, Program Detail.

Special cases:
- **Cart**: keep the "View Booklist" link — move it inline next to the title as a small text link
- **My Schedule**: keep the term selector — move it inline with the title using `flex items-center justify-between`
- **Schedule Builder**: inspect current header structure and apply the same strip-and-replace

Also update outer background colors from `bg-gray-100` / `bg-gray-50` to `bg-[#f6f5f4]` (warm white) for visual consistency with the new Home.

**Warm microcopy** (same pass):
- Cart empty state: "Your cart is empty — let's find your next class."
- Programs empty state: "No programs match that search. Try clearing the filter."
- My Schedule no-registrations state: "Nothing here yet — head to Search to find your courses."

## Acceptance criteria

- [ ] No inner view renders a `bg-[#ac1a2f]` header bar
- [ ] Each inner view has a lightweight `<h1>` page title in near-black
- [ ] Cart's Booklist link and My Schedule's term selector remain functional, repositioned inline with the title
- [ ] Outer backgrounds use warm white (`#f6f5f4`) across all updated views
- [ ] Cart, Programs, and My Schedule empty states use warm/encouraging copy
- [ ] No regression in any existing view functionality

## Blocked by

- `28-app-nav`
