Status: done

## What to build

Register Now / Waitlist Now is a button that bypasses the Cart and submits an Add or Waitlist action directly from Section Search results. Student-only. Uses `registrationService.registerSections(payload)` — same service and payload shape as Cart registration.

**Scope:** Section Search only. Schedule Builder surface is deferred to issue 11.

## Design decisions

**Button placement and role visibility:**
- Students see two buttons per section row: "Add to Cart" (existing) and "Register Now" / "Waitlist Now" (new). They coexist.
- Button label is contextual: Open seats → "Register Now"; Closed/Waitlist (`waitListAllowed === 'Y'`) → "Waitlist Now". Cancelled and Closed-no-waitlist sections show neither button nor Visitor CTA.
- Visitors see a small "Sign in to register" text link in place of the action button (actionable sections only). Clicking it triggers `authStore.login()`.
- Admins/Developers: no Register Now button (Student-only).

**Outcome state — `useRegisterNow` composable:**
- Local composable state (not cart store): `sectionResults: { [courseKey]: { status: 'success'|'error', message } }` and `registeringSections: Set<courseKey>`.
- State lives for the duration of SearchView's mount. Cleared when `resetExpansion()` fires (pagination, new search).
- No toast — the inline badge is the outcome signal.

**Success:**
- The action button and "Add to Cart" are both replaced by a "Registered" or "Waitlisted" badge.
- If the section is present in the student's Cart, `cartStore.removeRegistered([courseKey])` is called to remove it.

**Error:**
- Inline error message replaces the button; student can dismiss it to restore the button.

**In-flight:**
- The button is disabled while the section's `courseKey` is in `registeringSections`.

**Maintenance mode:**
- Button is disabled (but rendered) when `maintenanceStore.isBackendDown`. Visitor CTA is unaffected (login is still possible).

## Acceptance criteria

<!-- Legend: ✅ done · ⬡ composable ready, SearchView not wired · ❌ not started -->

- [x] "Register Now" button is visible on Section Search section rows for authenticated Students when the section is Open ✅
- [x] "Waitlist Now" button is visible on Section Search section rows for authenticated Students when the section is Closed/Waitlist (`waitListAllowed === 'Y'`) ✅
- [x] Cancelled and Closed-no-waitlist sections show neither button nor Visitor CTA ✅
- [x] Clicking Register Now / Waitlist Now calls `registrationService.registerSections` with the correct payload (`token`, `studentId`, `username`, `password`, `sections: [{ SectionId, Action, Credits }]`) ✅
- [x] On success, action button and Add to Cart are replaced by a "Registered" / "Waitlisted" badge ✅
- [x] On success, if the section is in the student's Cart, it is removed from Cart state ✅
- [x] On error, an inline error message replaces the button; dismissing it restores the button ✅
- [x] Button is disabled during in-flight submission; re-enabled (or replaced by outcome) after response ✅
- [x] Visitors see a "Sign in to register" text link on actionable section rows (Open / Closed/Waitlist only); clicking triggers login ✅
- [x] Register Now / Waitlist Now button is disabled when `maintenanceStore.isBackendDown` ✅
- [x] Outcome state clears when the search resets (pagination, new search) ✅

## API contract

Same as issue 08 — `POST /registration` with `{ token, studentId, username, password, sections: [{ SectionId, Action, Credits }] }`.

`Credits` comes from `sec.CreditHours` on the section object. **Implementation note:** verify that `getCourseSections` returns `CreditHours` per section; if not, fall back to `course.minCreditHours` from the parent course card.

## Composable interface

```js
// src/composables/useRegisterNow.js
export function useRegisterNow() {
  // sectionResults: { [courseKey]: { status: 'success'|'error', message } }
  // registeringSections: reactive Set of courseKeys in-flight

  async function registerNow(sec) { ... }   // auto-detects action from sec.status / sec.waitListAllowed
  function dismissResult(courseKey) { ... } // clears result, restores button
  function reset() { ... }                  // called from SearchView when resetExpansion() fires

  return { sectionResults, registeringSections, registerNow, dismissResult, reset }
}
```

## Blocked by

- `03-saml-auth`
- `05-section-search`
- `08-cart-registration-actions`
