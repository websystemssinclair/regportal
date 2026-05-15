# RegPortal

Course registration portal - Sinclair College

## Stack

- **Vue 3** + Vite
- **PrimeVue** — DataTable, form components
- **Pinia** — state management
- **Vue Router** — role-based route guards
- **Axios** — API client with SAML auth
- **VeeValidate + Yup** — form validation
- **Tailwind CSS v4** — utility classes (via `@tailwindcss/vite`)
- **Important** No TypeScript. JavaScript only.

Backend: ColdFusion REST API at `rest.sinclair.edu`. Authentication: SAML via Sinclair SSO.

## Modules
- landing page
- login - only required to register and save cart - SAML redirect
- search course sections - by term, subject, modality, day/time meet
- schedule builder - auto create schedules based on course list + filters (term, location, day/time)
- view available programs - search by selected courses; link to schedule builder
- shopping cart - save, add, remove course sections (backend and localstorage?)
- booklist
- admin control
 - course linkages - url link to course number
 - available terms - name and status (Y - yes; N - no; D - default/current; F - future)
 - important dates - homescreen calendar ticker
 - intro banner - copy
 - maintenance mode - start/end date/time, type (site v. backend only), public msg, private msg

## Roles

`Visitor` · `Student` · `Admin` · `Developer`

Each route declares `meta.roles`; the router guard enforces access. Role is set after SAML login from the user's `availableRoles` list.

## Thoughts
- mobile first
- accessibility forward
- WCAG 2.1 level AA required
