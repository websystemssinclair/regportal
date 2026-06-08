Status: ready-for-agent

## What to build

Admin-only Terms management. PrimeVue DataTable showing all Terms with columns for name and status (D/Y/F/N). Admins can add a new Term and change an existing Term's status via an inline dropdown per row. The backend enforces that only one Term can have status D at a time — the UI surfaces the backend error inline.

## Acceptance criteria

- [ ] Terms route is Admin/Developer only; other roles are redirected
- [ ] DataTable lists all Terms with name and status columns
- [ ] Admin can add a new Term with a name and initial status
- [ ] Admin can change a Term's status via an inline dropdown; change is persisted to the backend
- [ ] Backend error for duplicate status-D Term is shown inline (not a full-page error)
- [ ] Table updates without a full page reload after add or status change

## Blocked by

- `03-saml-auth`
