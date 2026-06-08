Status: ready-for-agent

## What to build

Admin-only Intro Banner editor. Single textarea with a save button and a preview of how the banner will appear on the home page. Saved content is immediately reflected on the home page for all users.

## Acceptance criteria

- [ ] Intro Banner route is Admin/Developer only
- [ ] Textarea shows current banner content on load
- [ ] Admin can edit and save banner content; save calls the backend
- [ ] Preview display reflects the saved content as it will appear on the home page
- [ ] Home page Intro Banner updates to reflect new content after save (no hard reload required for the admin; Visitors see the new content on their next page load)

## Blocked by

- `03-saml-auth`
- `04-home-page`
