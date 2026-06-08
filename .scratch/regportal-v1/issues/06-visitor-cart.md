Status: ready-for-agent

## What to build

Visitor Cart backed by localStorage. Implement `useCartStore` (Pinia) with two behaviors:

- **Visitor path**: reads/writes to `localStorage` under a fixed key; structure is an array of Section objects.
- **Student path**: backend is source of truth — wired in `07-cart-merge-on-login`.

Cart display uses a three-level hierarchy: Current meta-group (Terms with status D or Y) and Future meta-group (status F), sub-header per Term, flat list of Sections sorted by Course code within each Term.

On each Cart load, fetch live availability (Open, Closed, Closed/Waitlist, Cancelled) for all Sections from the backend. Stale Sections are shown with a status badge and not silently removed — the student removes them manually.

## Acceptance criteria

- [ ] Visitor can add a Section to Cart; it persists in `localStorage` across page refreshes
- [ ] Visitor can remove a Section from Cart; `localStorage` updates immediately
- [ ] Cart display groups Sections into Current and Future meta-groups with per-Term sub-headers
- [ ] Sections within each Term are sorted by Course code
- [ ] Live availability is fetched on each Cart load; each Section card shows an Open/Closed/Closed/Waitlist/Cancelled badge
- [ ] A Cancelled or Closed Section remains visible in the Cart with its status badge; it is not removed automatically
- [ ] `useCartStore` tests cover: add/remove for Visitors (localStorage read/write), grouping into Current/Future meta-groups, live availability update on load, stale Section display

## Blocked by

- `05-section-search`
