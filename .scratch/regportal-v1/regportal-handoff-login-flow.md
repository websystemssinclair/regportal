# Handoff: Login Flow Discussion

**Project**: `C:\Users\brian.cooney\workspace\regportal-vue`
**Date**: 2026-06-10
**Next focus**: Discuss and clarify the SAML login flow, specifically the response payload shape and how `authStore.handleCallback()` should map fields from it.

---

## What happened this session

Ran a `/grill-with-docs` session on issue `07-cart-merge-on-login`. All major design decisions were resolved and the issue was rewritten with full implementation context.

**Key artifacts updated this session:**
- `.scratch/regportal-v1/issues/07-cart-merge-on-login.md` — fully rewritten with resolved decisions, merge algorithm, saveCart contract, and open questions
- `CONTEXT.md` — Cart definition updated: "logged-in students" → "authenticated users"; "backend deduplicates" → "client-side deduplication by CourseKey"
- `docs/adr/0008-cart-merge-client-side.md` — new ADR documenting the client-side merge decision and why a backend merge endpoint was rejected

---

## Resolved decisions (issue 07)

All decisions are documented in the rewritten issue. Summary:
- Merge is **client-side** in `mergeOnLogin(shoppingCart)` — login payload delivers `shoppingCart` directly, no backend endpoint needed (ADR-0008)
- `saveCart` is `POST /ShoppingCart` with a bulk payload `{ token, studentId, username, password: "", sections: [{Credits, SectionId, StudentId}] }`
- `colleagueToken` from the login payload is the JWT for the `token` field in `POST /ShoppingCart` — not yet mapped in `authStore`
- All authenticated roles (not just Students) can have a Cart
- Toast via `cartStore.mergeCarryOver` pending state, consumed by `App.vue`

---

## Open question — the main reason for the next session

**Login payload mapping path is unconfirmed.**

The SAML response from `retrieveUserFromSaml(samlId)` — what does the raw Axios `data` object look like?

Reference sample: `.scratch/regportal-v1/userData.json`

That file shows: `{ success: true, user: { firstName, lastName, tartanId, username, imageLink, colleagueToken, shoppingCart, ... } }`

But `authStore.handleCallback()` (`src/stores/auth.js:43`) currently maps `data.firstName`, `data.tartanId`, etc. — as if the user fields are at the top level of `data`, not nested under `data.user`.

**Either** there's a bug in `handleCallback()` (it should be `data.user.firstName`) **or** the actual SAML endpoint returns the user object unwrapped (unlike `userData.json`).

This needs to be confirmed before issue 07 can be safely implemented. It also affects:
- Where `colleagueToken` is mapped from (`data.colleagueToken` vs `data.user.colleagueToken`)
- Where `shoppingCart` is mapped from
- Whether `availableRoles` (used by `resolveRole`) is at `data.availableRoles` or `data.user.availableRoles`

---

## Codebase state

- `src/stores/auth.js` — `handleCallback()` needs `colleagueToken` mapped; payload path unconfirmed
- `src/stores/cart.js` — Visitor path only (issue 06). No `mergeOnLogin`, no `saveCart`, no auth-awareness yet
- `src/services/cartService.js` — has `addToCart`/`removeFromCart` (per-item, wrong shape — to be removed); needs `saveCart(payload)` added
- Issue 06 (`06-visitor-cart.md`) is also `ready-for-agent` and is a blocker for 07

---

## Suggested skills

- `/grill-with-docs @.scratch/regportal-v1/issues/03-saml-auth.md` — grill the SAML auth issue to nail down the login payload shape and confirm the `data` vs `data.user` question before 07 is built
- `/gsd-plan-phase` — once login flow is confirmed, plan implementation of issue 07
- `/tdd` — issue 07 has explicit test requirements; TDD is appropriate for the merge/dedup logic
