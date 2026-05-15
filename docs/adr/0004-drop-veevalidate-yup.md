# Forms: drop VeeValidate + Yup, use lightweight custom composable

RegPortal does not use VeeValidate or Yup. Form validation is handled by a custom `useFormValidation` composable with reactive field errors and manual rule definitions. Cross-field constraints (e.g. Maintenance Mode start < end datetime) are implemented as explicit rule functions.

All forms in this app — both student-facing filters and Admin management forms — have 3–7 fields at most. No form requires async validation, dynamic field arrays, or deeply nested schemas. VeeValidate + Yup adds significant dependency weight for a problem that does not need a framework-scale solution. The custom composable covers every required case and is easier to audit for accessibility (error message association with `aria-describedby`, etc.).

## Considered Options

- **VeeValidate + Yup (original stack)** — rejected: over-engineered for the actual form complexity; adds ~60kb+ of dependency for forms that max out at 7 fields
- **Lightweight custom composable (chosen)** — reactive errors, manual rules, cross-field validation via explicit functions; no external dependency; full control over error rendering and ARIA association
