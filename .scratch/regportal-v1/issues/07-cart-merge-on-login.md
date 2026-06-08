Status: ready-for-agent

## What to build

When a Student logs in, silently merge their localStorage Cart into their backend Cart. `cartStore.mergeOnLogin()` POSTs all localStorage Sections to the backend merge endpoint. The backend deduplicates by Section ID. After the response, `cartStore` clears `localStorage`, switches to the backend-sourced Cart, and shows a toast confirming how many Sections were carried over. No confirmation dialog — merge is automatic and silent.

## Acceptance criteria

- [ ] `mergeOnLogin()` is called automatically after successful SAML callback
- [ ] All localStorage Sections are POSTed to the backend merge endpoint in a single call
- [ ] If a Section ID exists in both localStorage and the backend Cart, it appears exactly once in the merged Cart
- [ ] Toast message confirms the count of Sections carried over (e.g. "3 sections added to your Cart")
- [ ] `localStorage` Cart is cleared after merge regardless of partial success
- [ ] If localStorage Cart is empty at login time, no merge call is made and no toast appears
- [ ] `useCartStore` tests cover: dedup logic (Section in both sources → one entry), carry-over count accuracy, localStorage cleared post-merge

## Blocked by

- `03-saml-auth`
- `06-visitor-cart`
