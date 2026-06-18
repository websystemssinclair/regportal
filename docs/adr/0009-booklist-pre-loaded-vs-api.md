# ADR 0001: Booklist data source — pre-loaded payload vs. always fetching the API

**Status**: Accepted

## Context

The `/Books` API can be called for any Section to retrieve its required textbooks. The login payload also includes a `booklist` array on each entry in `currentCourses` and `waitlist`, pre-populated by the backend at login time.

Two approaches were considered for the Booklist feature:

1. **Always call the API** — fetch books for every Section (Cart, registered, waitlisted) via the API on demand. Consistent, but fires redundant network requests for sections already loaded.

2. **Use pre-loaded data for registered/waitlisted sections** — trust the `booklist` field on `currentCourses` and `waitlist` from the login payload; only call the API for Cart-only sections (which have no pre-loaded payload).

## Decision

Use the pre-loaded `booklist` field for registered and waitlisted Sections. Only call the API for Cart-only Sections (via POST `/Books` per Term for the aggregate view; via GET `/Books/{subjectCode}/{courseNumber}/{term}/{sectionNo}` for the per-Section modal).

## Rationale

- The field is confirmed to be reliably populated at login time.
- Avoids N API calls when the data is already in memory.
- The asymmetry (pre-loaded vs. fetched) is scoped to a service layer, not visible in the UI.

## Consequences

- If the backend stops populating `booklist` on the login payload, registered/waitlisted sections will silently show "no books" rather than fetching fresh data. This would require a code change to add a fallback fetch.
- Cart-only sections always require a live fetch — they have no login-payload cache.
