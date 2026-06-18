Status: done

## What to build

Add a persistent white top nav bar that appears on every route. The nav gives students a consistent wayfinding anchor and replaces the current pattern of ad-hoc navigation buttons scattered across views.

**Nav structure (left → right):**
- Logo / wordmark → links to `/`
- Center links (desktop): Programs · Schedule Builder · My Schedule
- Right: Cart icon with section-count badge · Sign In button (unauthenticated) or signed-in indicator (authenticated)
- Mobile: hamburger button that opens a full-width drawer below the nav bar with the same links

**Visual spec (Variation A):**
- White background, `1px solid rgba(0,0,0,0.1)` bottom border, sticky top, z-index above content
- Active route link gets crimson text
- Cart badge: crimson pill, white text
- Sign In: crimson pill button (primary style)
- Max-width inner content: `max-w-6xl` centered

**App.vue change:** render `<AppNav />` above `<Toast />` and `<RouterView />`.

Auth: use `authStore.isAuthenticated` to toggle Sign In vs signed-in indicator; `authStore.login()` for the Sign In action. My Schedule is visible to all users — the existing route guard handles unauthorized access.

## Acceptance criteria

- [x] `AppNav.vue` component exists and is rendered in `App.vue` on all routes
- [x] Nav shows Logo, Programs, Schedule Builder, My Schedule, Cart icon, and Sign In/signed-in indicator
- [x] Active route link is styled with crimson text
- [x] Cart badge shows section count and updates reactively when cart changes
- [x] Sign In button calls `authStore.login()`; signed-in state shows a visual indicator
- [x] On viewports below `md` breakpoint, center links are hidden and a hamburger button appears
- [x] Hamburger opens a drawer with all nav links; drawer closes on link click or backdrop tap
- [x] Nav is sticky (stays at top on scroll)

## Blocked by

- `27-design-tokens-preset`
