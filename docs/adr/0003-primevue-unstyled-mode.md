# UI: PrimeVue unstyled (passthrough) mode

RegPortal uses PrimeVue in unstyled mode with a global passthrough preset (`src/presets/`). All component styling is applied via Tailwind CSS utility classes. Per-instance `pt` overrides are used only for one-off variants. PrimeVue's built-in theme engine (Aura, Lara, etc.) is not used.

WCAG 2.1 AA compliance is required, and Sinclair's school colors must be applied consistently. Unstyled mode gives the frontend full ownership of focus rings, color contrast ratios, and interactive states — no fighting PrimeVue's default styles or CSS variable specificity. Styled mode would create two competing design systems (PrimeVue tokens + Tailwind) with no clear authority on contrast or focus behavior.

## Considered Options

- **Styled mode (default)** — rejected: PrimeVue owns component styles via CSS variables; overriding for WCAG compliance requires fighting specificity and auditing every token against contrast requirements
- **Unstyled mode with global passthrough preset (chosen)** — Tailwind owns all styles; accessible focus, contrast, and interactive states are written once in the preset and applied consistently across all components
