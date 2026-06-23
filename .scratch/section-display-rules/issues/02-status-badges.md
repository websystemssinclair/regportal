# Status badges and registration expiry

Status: done

## Parent

`.scratch/section-display-rules/PRD.md`

## What to build

Rewrite the `seatBadgeLabel` and `seatBadgeClass` functions in HomeView to implement the correct six-case precedence. Add a `regExpired` function that compares a section's `regEndDate` against today, with a 2-day grace window for SectionLoc-320 (pure async Online Learning) sections.

Add `HomeView.display.test.js` covering all badge cases and the `regExpired` edge cases.

**Status badge precedence:**

| Condition | Label | Color |
|---|---|---|
| `status === 'Cancelled'` | "Cancelled" | gray |
| `status === 'Closed'` + `waitListAllowed === 'Y'` | "Waitlist Available" | amber |
| `status === 'Closed'` + `waitListAllowed === 'N'` | "Closed" | red |
| `status === 'Open'` + `regExpired(sec)` | "Registration Closed" | gray |
| `status === 'Open'` + `openSeats > 0` | "Open · X seats" | green |
| `status === 'Open'` + `openSeats === 0` | *(render nothing)* | — |

`openSeats` arrives as a float from the API — display as an integer.

**`regExpired` logic:**
```
deadline = parse(sec.regEndDate)   // format: "MM/DD/YYYY HH:MM"
today    = now()
if sec.SectionLoc === '320':
  today = today − 2 days           // 2-day grace window for async online sections
return deadline < today
```

The grace window applies only to SectionLoc `'320'`. SectionLoc `'321'` and `'345'` (online with meeting times) use the raw deadline.

## Acceptance criteria

- [x] Cancelled section renders "Cancelled"
- [x] Closed section with `waitListAllowed: 'Y'` renders "Waitlist Available"
- [x] Closed section with `waitListAllowed: 'N'` renders "Closed"
- [x] Open section past `regEndDate` renders "Registration Closed"
- [x] Open section with `openSeats > 0` renders "Open · X seats" (integer, not float)
- [x] Open section with `openSeats === 0` renders no badge text
- [x] SectionLoc-320 section 1 day past deadline does NOT show "Registration Closed" (grace window)
- [x] SectionLoc-320 section 3 days past deadline shows "Registration Closed"
- [x] SectionLoc-321 section 1 day past deadline shows "Registration Closed" (no grace)
- [x] All cases covered in `HomeView.display.test.js`

## Blocked by

- `01-fix-test-seam.md`
