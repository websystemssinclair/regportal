Status: ready-for-agent

## What to build

Register Now is a single button that bypasses the Cart and submits an Add or Waitlist action directly. Appears in two surfaces:

1. **Section Search results**: one button per Section card; auto-detects Add vs Waitlist based on seat availability (Open → Add, Closed/Waitlist → Waitlist). Visitors see a login CTA instead.
2. **Schedule Builder results**: one button per Schedule card; submits Add or Waitlist for all Sections in that Schedule at once.

Student-only on both surfaces. Uses `registrationService.register(actions[])` — same service as the Cart, same per-Section outcome surfacing.

## Acceptance criteria

- [ ] Register Now button is visible on Section Search cards for authenticated Students
- [ ] Button auto-detects action: Open seats → Add; Closed/Waitlist → Waitlist
- [ ] Visitors see a login CTA in place of Register Now on Section Search cards
- [ ] Per-Section outcome (success/error) is shown inline on Section Search cards after response
- [ ] Register Now button is visible on Schedule Builder result cards for authenticated Students
- [ ] Clicking Register Now on a Schedule submits Add/Waitlist for all Sections in that Schedule in one call
- [ ] Per-Section outcomes for the Schedule submission are surfaced inline on the Schedule card
- [ ] Buttons are disabled during in-flight submission on both surfaces

## Blocked by

- `03-saml-auth`
- `05-section-search`
- `08-cart-registration-actions`
- `11-schedule-builder`
