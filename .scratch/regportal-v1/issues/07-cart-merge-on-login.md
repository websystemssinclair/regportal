Status: done

## What to build

When a user logs in via SAML, silently merge their localStorage Cart into their backend Cart (Preferred Sections in Colleague). The merge is **client-side** — no backend merge endpoint. The login payload already delivers the full backend cart state as `shoppingCart`.

`cartStore.mergeOnLogin(shoppingCart)` is called by `authStore.handleCallback()` before `router.replace()`, passing `userData.user.shoppingCart` from the POST /UserData response (see authStore changes below).

After merge, `saveCart()` persists the merged result to Colleague via `POST /ShoppingCart`. localStorage is cleared. If new sections were carried over, a toast confirms the count. No confirmation dialog.

## Architecture decisions

- **Merge is client-side** (see ADR-0008). The login payload delivers the full backend cart; no round-trip needed.
- **All authenticated roles** can have a Cart (not just Students). Admins also take courses.
- **`shoppingCart` shape** is a superset of the localStorage section shape — same key fields (`CourseKey`, `Term`, `SubjectCode`, `CourseNo`, `SectionNo`, `LongName`, `CreditHours`, `status`, `waitListAllowed`), plus richer display fields (`dayModels`, `Faculty`, `startDate`, etc.). No normalization needed.
- **`shoppingCart` version wins** for duplicate `CourseKey` — it has fresher availability and richer data.
- **No `loadAvailability()` after merge** — `shoppingCart` items include inline `status`.
- **Toast via pending state** — `cartStore.mergeCarryOver` (number | null). `App.vue` watches it, fires PrimeVue toast, then sets to null.

## Merge algorithm (`mergeOnLogin`)

```
1. Build a Map<CourseKey, section> from shoppingCart items
2. For each localStorage section:
     if CourseKey not in Map → add to Map, increment carryOverCount
3. Clear localStorage
4. Set this.sections = [...Map.values()]
5. If carryOverCount > 0: call saveCart() (fire and forget)
6. Set this.mergeCarryOver = carryOverCount (only if > 0)
```

If localStorage is empty and shoppingCart is empty, skip entirely — no sections to set, no save, no toast.

If localStorage is empty but shoppingCart has items: set `sections = shoppingCart` (step 4), skip saveCart (server state unchanged), no toast.

## saveCart

Replaces Colleague Preferred Sections in bulk. Called after every mutation (add, remove, merge) for authenticated users. Fire-and-forget.

**Endpoint**: `POST /ShoppingCart`

**Payload**:
```json
{
  "token": "<authStore.colleagueToken>",
  "studentId": 521272,
  "username": "brian.cooney",
  "password": "",
  "sections": [
    { "Credits": 3, "SectionId": "352086", "StudentId": 521272 }
  ]
}
```

Field mappings from store:
- `token` ← `authStore.colleagueToken`
- `studentId` / `StudentId` ← `parseInt(authStore.user.tartanId)` (leading zero stripped)
- `username` ← `authStore.user.username`
- `Credits` ← `section.CreditHours`
- `SectionId` ← `section.CourseKey`

## authStore changes required

`handleCallback()` currently makes one call. It needs a second call added after `retrieveUserFromSaml`.

**Call 1** — `retrieveUserFromSaml(samlId)` — flat response shape (current mapping is correct):
```json
{ "success": true, "targetUrl": "search", "firstName": "Brian", "lastName": "Cooney",
  "email": "...", "tartanId": 521272, "username": "brian.cooney",
  "imageLink": "...", "availableRoles": [{ "role": "Student", ... }] }
```
Provides: user profile, role, targetUrl. Current `data.firstName` / `data.availableRoles` mapping is correct — no changes needed here.

**Call 2** — `POST /UserData` with `{ tartanId, username }` from call 1 — nested response shape:
```json
{ "success": true, "user": { "colleagueToken": "...", "shoppingCart": [...], "userName": "...", ... } }
```
`userName` (capital N) in this response equals `username` from call 1 — same field, different casing from the two endpoints.

After call 2:
- Set `this.colleagueToken = userData.user.colleagueToken` (new top-level field on authStore, not inside `user`)
- Pass `userData.user.shoppingCart` to `cartStore.mergeOnLogin()`

If call 2 fails: login still succeeds. `colleagueToken` stays null. Cart merge is skipped. `saveCart()` will silently fail on subsequent mutations until re-login.

Add `colleagueToken: null` to authStore's initial state.

## authService changes

Add to `authService.js` (using `authClient`):

```js
export const getUserData = (payload) => authClient.post('UserData', payload)
```

Called in `handleCallback()` with `{ tartanId: data.tartanId, username: data.username }` from the SAML response.

## cartService changes

Remove `addToCart` and `removeFromCart` (per-item endpoints — wrong shape). Replace with:

```js
export const saveCart = (payload) => apiClient.post('ShoppingCart', payload)
```

The store constructs the full payload before calling. `cartStore` imports `useAuthStore` directly to access `colleagueToken`, `user.tartanId`, and `user.username` when building the payload.

## Carry-over count (toast)

Delta count: number of localStorage sections whose `CourseKey` was NOT already in `shoppingCart`. This is what "carried over" means — genuinely new additions, not total localStorage count.

Toast wording: `"X sections added to your Cart"` (PrimeVue Toast, severity: success).
No toast if carry-over count is 0.

## Acceptance criteria

- [x] `mergeOnLogin(shoppingCart)` is called in `authStore.handleCallback()` before navigation — `auth.js:60`, `auth.test.js` asserts call order via `invocationCallOrder`
- [x] If localStorage Cart is empty and shoppingCart is empty, skip entirely — no sections set, no save, no toast — `cart.js:88` early return; covered by `skips entirely when both localStorage and shoppingCart are empty`
- [x] If localStorage Cart is empty but shoppingCart has items, sections are loaded from shoppingCart — no save, no toast — `cart.js:90-105` carryOverCount stays 0; covered by `loads sections from shoppingCart when localStorage is empty`
- [x] Merged cart = shoppingCart items + localStorage items not already present (by CourseKey) — `cart.js:92-100`; covered by `merges non-overlapping localStorage into shoppingCart`
- [x] shoppingCart version wins for duplicate CourseKey — `cart.js:90` Map seeded from shoppingCart first; covered by `shoppingCart version wins for duplicate CourseKey and does not increment carry-over count`
- [x] localStorage is cleared after merge — `cart.js:99` unconditional `removeItem`; asserted via `expect(localStorage.getItem(STORAGE_KEY)).toBeNull()`
- [x] `saveCart()` is called after merge only when carryOverCount > 0 (fire and forget) — `cart.js:102-104`; multiple mergeOnLogin tests assert called/not-called accordingly
- [x] Toast shows carry-over count (delta only) when > 0; no toast when 0 — `App.vue:14-21` watches `mergeCarryOver`; `cart.js:104` only sets it when > 0
- [x] `add()` and `remove()` call `saveCart()` fire-and-forget for authenticated users; localStorage write only for Visitors — `cart.js:67-84`; covered by `add() — auth-aware` and `remove() — auth-aware`
- [x] `authStore` stores and exposes `colleagueToken` from login payload — `auth.js:30,59`; covered by `stores colleagueToken from getUserData response`
- [x] `useCartStore` tests cover: dedup (CourseKey in both → shoppingCart version kept, count not incremented), carry-over count accuracy, localStorage cleared post-merge, no save/toast when localStorage is empty — all four scenarios have dedicated test cases; 29/29 tests pass

## Open questions

None — login payload mapping confirmed. See "authStore changes required" above.

## Blocked by

- `03-saml-auth`
- `06-visitor-cart`
