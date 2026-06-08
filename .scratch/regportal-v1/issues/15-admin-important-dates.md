Status: ready-for-agent

## What to build

Admin-only Important Dates management. PrimeVue DataTable showing all Important Dates ordered by date ascending. Each row has a label and a date. Admins can add, edit, and delete entries. Changes feed the scrolling ticker on the home page.

## Acceptance criteria

- [ ] Important Dates route is Admin/Developer only
- [ ] DataTable lists all Important Dates ordered by date ascending
- [ ] Admin can add a new Important Date with a label and date
- [ ] Admin can edit an existing entry's label or date
- [ ] Admin can delete an entry; it is removed from the table and no longer appears in the home page ticker
- [ ] Table updates without a full page reload after any CRUD operation

## Blocked by

- `03-saml-auth`
