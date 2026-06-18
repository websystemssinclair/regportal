Status: done

## What to build

Booklist has two surfaces:

1. **Aggregate view** (`/booklist` route): collects all Cart Sections, registered Sections (`currentCourses`), and waitlisted Sections (`waitlist`); deduplicates by `CourseKey` (registered wins over cart); groups results by Section within each Term.
2. **Per-Section modal**: shows books for a single Section; accessible from Cart cards and My Schedule cards (appears on every row regardless of whether books exist).

Each book entry shows title, author, ISBN, and required/optional status. Each Term group has one "Buy Books at Campus Store" button linking to the ecampus bookstore for all Sections in that Term. Visible to all roles including Visitors (who have a localStorage Cart).

## Acceptance criteria

- [x] Aggregate Booklist route (`/booklist`) is accessible to Visitors and Students (no role guard)
- [x] Aggregate view collects Cart Sections, registered Sections, and waitlisted Sections; deduplicates by CourseKey
- [x] Books are grouped by Section within each Term in the aggregate view
- [x] Each Term group has one "Buy Books at Campus Store" button (ecampus URL)
- [x] Per-Section modal opens from a Cart card and shows books for that Section only
- [x] Per-Section modal opens from a My Schedule card and shows books for that Section only
- [x] "Books" button appears on every section row (Cart and My Schedule) regardless of booklist content
- [x] Each book entry shows title, author, ISBN, required/optional
- [x] Sections with no books (or non-SUCCESS API result) show "No books required"
- [x] `/booklist` is linked from the CartView header

## Blocked by

- `06-visitor-cart`
- `10-my-schedule`

## API

### Books for Cart-only sections

**Aggregate view** — POST `/Books` per Term, in parallel:
```json
{ "courseCodes": ["ACC-1100-101"], "term": "26SU" }
```
- `courseCodes`: `SubjectCode.trim() + '-' + CourseNo.trim() + '-' + SectionNo` (no zero-padding)
- `term`: `sec.Term` directly (e.g. `"26SU"`, no slash)
- Non-SUCCESS `CourseResult` → treat as no books (silent)

**Per-Section modal** — GET `/Books/{subjectCode}/{courseNumber}/{term}/{sectionNo}`
- All params raw-trimmed, term in `26SU` format (no slash, no zero-padding)

### Books for registered/waitlisted sections

Pre-loaded in login payload as `booklist: [...]` on each entry in `currentCourses` and `waitlist`. No API call needed.

### Sample response row
```json
{
  "Title": "ND SINCLAIR COMM COLL LOOSE LEAF ACCOUNTING...",
  "Author": "MARSHALL",
  "ISBN": 9781265286712,
  "Required": "Required",
  "Edition": "Custom",
  "Publisher": "MCG",
  "NewPrice": 180.20,
  "SubjectCode": "ACC",
  "CourseNo": "1100",
  "SectionNo": "101",
  "Term": "26/FA",
  "CourseResult": "SUCCESS"
}
```

## Ecampus bookstore URL

One button per Term group (aggregate view) or per Section (per-Section modal):

```
https://www.ecampus.com/autocourselist.asp
  ?sintschoolid=6373
  &semestername={YY/SS}         ← term with slash: "26SU" → "26/SU"
  &courses={subjects}           ← SubjectCode.trim() values joined by |
  &courses2={courseNos}         ← CourseNo.trim() zero-padded to 4 digits, joined by |
  &courses3={sectionNos}        ← SectionNo.trim() values joined by |
```

Note: zero-padding (`1100` stays `1100`; `164` → `0164`) is **only** for the ecampus URL, not for API calls.

## Architecture notes

- Registered + waitlisted sections: use pre-loaded `booklist` from auth store — no API call (see ADR `docs/adr/0001-booklist-pre-loaded-vs-api.md`)
- Cart-only sections: fetch via API on view mount (aggregate) or modal open (per-Section)
- Deduplication: build a Set of `CourseKey` from registered + waitlisted first; skip cart sections whose `CourseKey` is already in the set
- New service: `src/services/booklistService.js`
- New view: `src/views/BooklistView.vue`
- New component (modal): inline or extracted as needed
