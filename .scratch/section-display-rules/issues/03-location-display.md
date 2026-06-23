# Location display via SectionLoc

Status: done

## Parent

`.scratch/section-display-rules/PRD.md`

## What to build

Replace the section row's `iconTitle · location || building` line with a location string derived from `SectionLoc`, `building`, and `satLocation`. The `iconTitle` field is no longer shown on the section row.

**Priority chain for location label:**

1. `isFlexpace === 1` → "FlexPace"
2. `SectionLoc === '320'` → "Online Learning"
3. `SectionLoc === '321'` or `'345'` → "Online Learning with Meeting Times"
4. stripped `building === 'RMT'` or `'VIR'` → "Blended Learning"
5. `SectionLoc` matches lookup table → campus label + room (see table)
6. `SectionLoc` empty → room only (Downtown Dayton is implied, not printed)

**SectionLoc → campus label lookup:**

| SectionLoc | Label |
|---|---|
| `110`, `329` | Centerville Campus |
| `310`, `328` | Huber Heights Learning Center |
| `300`, `327` | Englewood Learning Center |
| `210` | Preble County Learning Center |
| `200`, `326` | Courseview Campus Center (Mason) |
| `330`, `OFF` | Other Off Campus Location |

**Room display:** use `satLocation` when non-empty; otherwise use `building`. Strip `zzz` suffix from both: `value.replace(/zzz$/i, '').trim()`. `SectionLoc` is an empty string (not null) for Downtown Dayton sections — use a truthiness check.

For online/FlexPace/Blended cases where there is no physical room, omit the room entirely.

## Acceptance criteria

- [x] `iconTitle` no longer appears on the section row
- [x] SectionLoc `320` renders "Online Learning" with no room
- [x] SectionLoc `321` / `345` renders "Online Learning with Meeting Times"
- [x] Building `RMTzzz` or `VIRzzz` renders "Blended Learning"
- [x] SectionLoc `110` renders "Centerville Campus" + room
- [x] SectionLoc `310` renders "Huber Heights Learning Center" + room
- [x] SectionLoc `300` renders "Englewood Learning Center" + room
- [x] SectionLoc `210` renders "Preble County Learning Center" + room
- [x] SectionLoc `200` renders "Courseview Campus Center (Mason)" + room
- [x] SectionLoc `330` / `OFF` renders "Other Off Campus Location" + room
- [x] Empty SectionLoc renders room only (no campus label)
- [x] `isFlexpace === 1` renders "FlexPace" regardless of SectionLoc
- [x] `satLocation` non-empty renders instead of `building`
- [x] `zzz` suffix stripped from building and satLocation
- [x] All cases covered in `HomeView.display.test.js`

## Blocked by

- `01-fix-test-seam.md`
