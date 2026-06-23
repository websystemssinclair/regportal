# Action button gating for isFuture and regExpired

Status: done

## Parent

`.scratch/section-display-rules/PRD.md`

## What to build

Update `isActionable` and the section row action area to correctly gate Register/Waitlist buttons when registration is not currently available, while keeping "Add to Cart" always accessible for non-Cancelled sections.

**Updated `isActionable` logic:**
```
canRegister = (status === 'Open') || (waitListAllowed === 'Y' && status !== 'Cancelled')
isActionable(sec) = canRegister && !regExpired(sec) && !sec.isFuture
```

`regExpired` is implemented in issue 02 — reuse it here.

**"Add to Cart" availability:** shown for all sections where `status !== 'Cancelled'`, regardless of `regExpired` or `isFuture`. This is a change from the current behavior where the cart button was implicitly gated.

**"Registration opens" hint:** when `sec.isFuture === true`, render a static text hint "Registration opens [formatted regStartDate]" in place of the Register/Waitlist button. Use the `formatDate` utility from issue 04.

**"Sign in to register" link:** only shown when `isActionable(sec)` is true (i.e., currently registerable). Not shown for future or expired sections.

## Acceptance criteria

- [x] `isFuture` section: "Add to Cart" present, "Register Now" absent, "Registration opens [date]" shown
- [x] `isFuture` section: "Sign in to register" not shown for unauthenticated users
- [x] `regExpired` section: "Add to Cart" present, "Register Now" absent, no "Registration opens" hint
- [x] `regExpired` section: "Sign in to register" not shown for unauthenticated users
- [x] Cancelled section: "Add to Cart" not shown
- [x] Normal open section: all existing behavior unchanged
- [x] Waitlist section: "Waitlist Now" blocked when `regExpired`
- [x] "Registration opens" date formatted as "Aug 24, 2026"
- [x] All cases covered in `HomeView.display.test.js`

## Blocked by

- `02-status-badges.md` (provides `regExpired`)
- `04-additional-schedule-rows.md` (provides `formatDate`)
