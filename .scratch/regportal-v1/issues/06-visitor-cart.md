Status: done

## What to build

Visitor Cart backed by localStorage. Implement `useCartStore` (Pinia) — **Visitor path only** in this issue (Student path wired in `07-cart-merge-on-login`).

Also in scope:
- Extend `referenceStore` to populate `terms` and `currentTerm` from the reference payload
- `CartView.vue` at route `/cart` (name: `cart`)
- Wire "Add to Cart" button in `SearchView.vue` section rows to `useCartStore.add()`

### useCartStore — Visitor path

Reads/writes `localStorage` under key `regportal:cart`. Structure: array of full Section payload objects (the complete object as returned by the backend, stored on add).

**Deduplication key**: `CourseKey`. Adding a Section already in the cart is a no-op.

**Add**: store full Section payload; deduplicate on `CourseKey`.

**Remove**: filter by `CourseKey`; write updated array back to localStorage immediately.

### Availability fetch (Visitor path)

On each Cart load, call `GET /sections/availability?courseKeys=A,B,C` with all `CourseKey` values in the cart.

Response shape: `{ results: N, success: true/false, rows: [{ courseKey, status }, ...] }`

Overlay `status` onto each Section in the store. Sections with stale/bad status remain visible — the student removes them manually.

### Cart display

Three-level hierarchy:

- **Meta-group**: **Current** (Terms with `toView: D` or `Y`, plus Terms with `toView: N`) and **Future** (`toView: F`)
- **Sub-header** per Term within each meta-group
- **Flat list** of Sections sorted by `SubjectCode.trim() + CourseNo.trim()` (alphabetical ascending) within each Term

Availability badge per Section card: `Open` (green) / `Closed/Waitlist` (amber, when `waitListAllowed: Y`) / `Closed` (red) / `Cancelled` (gray).

### SearchView wiring

Add to Cart button on each Section row:
- Calls `useCartStore.add(section)` — stores full Section payload
- Shows distinct "In Cart" state (disabled or visually marked) when `CourseKey` is already in the store

## Acceptance criteria

- [x] Visitor can add a Section to Cart; it persists in `localStorage` under `regportal:cart` across page refreshes
- [x] Adding a Section already in the cart is a no-op (deduplicates on `CourseKey`)
- [x] Visitor can remove a Section from Cart; `localStorage` updates immediately
- [x] "Add to Cart" button in SearchView reflects "In Cart" state when the Section is already saved
- [x] `referenceStore` populates `terms` and `currentTerm` from `/reference.StaticData`
- [x] Cart display groups Sections into Current (D/Y/N) and Future (F) meta-groups with per-Term sub-headers
- [x] Sections within each Term are sorted by `SubjectCode.trim() + CourseNo.trim()`, alphabetical ascending
- [x] Live availability is fetched on each Cart load via `GET /sections/availability?courseKeys=...`; each Section card shows an Open/Closed/Closed Waitlist/Cancelled badge
- [x] Sections with `toView: N` terms appear in the Current meta-group
- [x] A Cancelled or Closed Section remains visible in the Cart with its status badge; it is not removed automatically
- [x] `useCartStore` tests cover: add (dedup), remove (localStorage read/write), grouping into Current/Future meta-groups, availability overlay on load, stale Section display

## API contracts

```
GET /sections/availability?courseKeys=A,B,C
→ { results: N, success: bool, rows: [{ courseKey, status }] }
```

Backend `GET /cart` (Student path, deferred to issue 07) includes `status` per Section inline.

## Wire field notes

- Section identity: `CourseKey` (e.g. `"348325"`)
- Term status: `toView` field (`D` / `Y` / `F` / `N`)
- `SubjectCode` and `CourseNumber` in Section payload have trailing spaces — trim before use

## Blocked by

- `05-section-search`
