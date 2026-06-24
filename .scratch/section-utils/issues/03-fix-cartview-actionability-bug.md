# Fix CartView actionability bug — migrate `isActionable` to shared section utils

Status: ready

## What to build

CartView's local `isActionable` omits two guards that HomeView applies: the registration deadline check (`regExpired`) and the `isFuture` flag. This causes CartView to surface Register and Waitlist buttons for sections whose deadline has passed or whose registration window hasn't opened yet — actions that will fail at the API.

Delete CartView's private `isActionable` and import it from `@/utils/section` instead. This is a **behavior change**: CartView will now correctly hide Register/Waitlist buttons for deadline-expired sections and `isFuture` sections.

CartView's current implementation:
```js
function isActionable(sec) {
  return sec.status === 'Open' || (sec.waitListAllowed === 'Y' && sec.status !== 'Cancelled')
}
```

After this change, CartView uses the unified rule from `section.js`:
```
canRegister && !regExpired(sec) && !sec.isFuture
```

Existing CartView test fixtures do not supply `regEndDate` or `isFuture`, so no existing tests break. QA should verify the registration flow for cart items near their deadline.

## Acceptance criteria

- [ ] CartView no longer defines `isActionable` locally
- [ ] CartView imports `isActionable` from `@/utils/section`
- [ ] `actionableInTerm` (which filters via `isActionable`) uses the imported version
- [ ] Register/Waitlist buttons are hidden for sections with an expired `regEndDate`
- [ ] Register/Waitlist buttons are hidden for sections with `isFuture: true`
- [ ] All existing `CartView.actions.test.js` tests pass without modification

## Blocked by

- Issue #01 — `src/utils/section.js` must exist first
