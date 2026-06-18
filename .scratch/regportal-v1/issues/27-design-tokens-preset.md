Status: done

## What to build

Swap the global color system from blue to crimson as a prefactor before the nav and layout work. Two files change:

1. **`src/style.css`** — add Variation A CSS custom properties after the Tailwind import (crimson, dark crimson, focus crimson, warm neutrals, card shadow, whisper border token).

2. **`src/presets/index.js`** — replace all `blue-700`/`blue-800`/`blue-50` Tailwind references with crimson equivalents (`#ac1a2f`, `#871523`, etc.) across the Button, InputText, and Select component shapes.

The crimson color (`#ac1a2f`) is already used inline throughout the views — this issue standardizes the PrimeVue component layer to match.

## Acceptance criteria

- [x] `src/style.css` defines CSS custom properties for the Variation A token set (crimson, dark crimson, focus crimson, warm-white, warm-dark, warm-gray-500, warm-gray-300, card shadow, whisper border)
- [x] Primary Button renders with crimson background (`#ac1a2f`) and white text instead of blue
- [x] Outlined Button renders with crimson border and text instead of blue
- [x] InputText and Select focus rings are crimson instead of blue
- [x] Select's selected-option highlight is crimson instead of blue
- [x] No visual regressions in views that already use `#ac1a2f` inline

## Blocked by

None — can start immediately
