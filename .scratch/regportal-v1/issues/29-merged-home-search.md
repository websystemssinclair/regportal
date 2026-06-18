Status: done

## What to build

Merge the Home and Search views into a single search-first landing page at `/`. The current `HomeView.vue` (intro banner + key dates ticker) and `SearchView.vue` (course search) are dissolved into a new unified `HomeView.vue`. The `/search` route is removed and redirected to `/`.

**Page structure (top to bottom):**

1. **Hero** — white background, centered max-w-3xl column:
   - Intro text from `reference.intro` (sanitized), or a warm default headline if empty
   - Search bar (keyword input + Filters toggle button with active-count badge + Search button)
   - Key dates ticker below the search bar — same scroll animation as current HomeView but on a white/warm-white background with crimson text instead of the full-bleed crimson bar

2. **Results area** — `bg-[#f6f5f4]` background, `max-w-4xl` centered. All existing search result behavior is preserved: expandable course cards, section rows, pagination, loading skeletons, empty states.

3. **Minimal footer** — thin, Home-only. Copyright line only.

**Warm microcopy:**
- Search placeholder: "What would you like to learn?"
- Empty state: "No courses found" / "Try a broader search — there are thousands of courses waiting."
- Results count line: "X courses available"

All composables (`useSearch`, `useCardExpansion`, `useRegisterNow`) and the filter drawer are retained unchanged.

**Cleanup:**
- `src/views/SearchView.vue` is deleted
- Router entry for `/search` is replaced with a redirect to `/`

## Acceptance criteria

- [x] `/` loads with a centered search bar as the primary hero element
- [x] Key dates ticker appears below the search bar (not as a full-bleed crimson bar) — `bg-[#f6f5f4]` rounded band, crimson text, constrained within `max-w-3xl` column
- [x] Intro banner content from `reference.intro` is shown when present — plain prose with `.intro-banner` class for paragraph spacing
- [x] Filter drawer opens and applies filters identically to current Search behavior
- [x] Course results, section expansion, pagination, and registration actions all work as before
- [x] Empty state shows warm microcopy — "Try a broader search — there are thousands of courses waiting."
- [x] Minimal copyright footer is present at the bottom of the page — `© <year> Sinclair College`, dynamic year
- [x] `/search` redirects to `/` with no 404
- [x] `SearchView.vue` no longer exists
- [x] "Courses" nav link added to AppNav as first center item, active only on exact `/` match

## Design decisions (grilled 2026-06-18)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Intro headline | Fallback `h1` only when `reference.intro` is absent; in practice intro always has content |
| 2 | Ticker visual | `bg-[#f6f5f4]` band, crimson text, same scroll animation |
| 3 | Intro banner styling | Plain prose (`text-sm text-gray-700 leading-relaxed`), no card/border |
| 4 | Footer copy | `© {{ new Date().getFullYear() }} Sinclair College`, dynamic year |
| 5 | Auto-fetch on mount | Keep — results load immediately, search bar narrows them |
| 6 | Nav widening | Add "Courses" link to AppNav pointing to `/` |
| 7 | Nav order | Courses · Programs · Schedule Builder · My Schedule |
| 8 | Ticker width | Constrained within `max-w-3xl` hero column, `rounded` |

Implementation notes:
- Search bar buttons invert for white hero: input gets `border border-gray-300`, Filters gets outlined style, Search button gets crimson fill
- Results count microcopy → "X courses available"
- Empty state subtitle → "Try a broader search — there are thousands of courses waiting."
- `/search` → router `redirect: '/'`
- "Courses" active state uses `route.path === '/'` (not `startsWith`, which would match every route)
- Page uses flex-col layout; results section is `flex-1` to push footer to bottom

## Blocked by

- `28-app-nav`
