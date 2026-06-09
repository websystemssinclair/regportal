# DOMPurify for Intro Banner HTML sanitization

The Intro Banner renders admin-entered HTML (fetched from `/reference.StaticData` as the `intro` field) using `v-html`. DOMPurify sanitizes that HTML client-side before it is passed to `v-html`.

The Intro Banner is visible to unauthenticated Visitors — it is the first thing any user sees. A stored XSS payload in `intro` would execute in every visitor's browser session. Admin accounts can be compromised, and backend storage sanitization may not be guaranteed across API changes. Defense-in-depth on the rendering side closes the XSS vector regardless of what reaches the client.

The alternative — trusting admin-entered content and rendering `v-html` directly — is simpler but leaves the public-facing page exposed to stored XSS if the admin surface or backend is ever compromised. DOMPurify is lightweight and well-maintained; the dependency cost is low relative to the risk on a college portal serving unauthenticated users.

## Considered Options

- **`v-html` directly** — rejected: stored XSS risk on a public, unauthenticated page; relies entirely on backend sanitization being correct and permanent
- **DOMPurify + `v-html` (chosen)** — sanitizes on the client before render; closes the XSS vector even if the backend is compromised; negligible bundle size cost
