---
name: Sinclair Registration Portal
description: Calm, direct course registration for Sinclair College students.
colors:
  crimson: "#ac1a2f"
  crimson-dark: "#871523"
  warm-canvas: "#faf8f5"
  surface: "#ffffff"
  ink: "#111827"
  ink-secondary: "#374151"
  ink-muted: "#9ca3af"
  warm-gray: "#6b6460"
  warm-gray-light: "#c4bdb8"
  status-open-bg: "#dcfce7"
  status-open-text: "#166534"
  status-waitlist-bg: "#fef3c7"
  status-waitlist-text: "#92400e"
  status-closed-bg: "#fee2e2"
  status-closed-text: "#b91c1c"
  status-neutral-bg: "#f3f4f6"
  status-neutral-text: "#6b7280"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "4px"
  md: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.crimson}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.crimson-dark}"
  button-outlined:
    backgroundColor: "transparent"
    textColor: "{colors.crimson}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  chip-active:
    backgroundColor: "{colors.crimson}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chip-inactive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
---

# Design System: Sinclair Registration Portal

## 1. Overview

**Creative North Star: "The Clear Path"**

RegPortal exists to clear every obstacle between a student and a registered seat. Registration is a high-stakes moment — seats fill, deadlines loom, schedules are complex. The design language responds with radical calm: white surfaces, one accent, information at exactly the density students need and no more. Nothing decorates that doesn't earn its place.

The reference is Notion's restraint: the product recedes and the task comes forward. School Crimson (`#ac1a2f`) appears only where something can be acted upon — a primary button, an active nav link, a selected filter chip. Neutrals carry everything else. The result is a portal that feels considered, not configured. Students who are used to Blackboard or Banner immediately sense the difference without being able to name it.

This system explicitly rejects the visual language of legacy college portals: banner-heavy layouts, multi-colour chrome, inconsistent component vocabularies, and the general impression that the interface was assembled rather than designed. The benchmark is the category's best tools — if a student fluent in Notion or Linear sat down to use RegPortal, they should not pause at a single subtly-off interaction.

**Key Characteristics:**
- Single accent — School Crimson on ≤10% of any screen; its rarity is the point
- Flat surfaces with whisper borders (`1px solid rgba(0,0,0,0.06)`); shadow only on elevated elements
- System font stack (Inter / system-ui) at a compact, fixed scale — no fluid type, no display fonts in UI labels
- Status always explicit — every Section shows Open / Waitlist / Closed via colour + label, never colour alone
- 8px base unit with consistent component vocabulary across all views
- Monospace for Section codes (e.g. `ACC-1100-100`) — functional distinction, not decoration

---

## 2. Colors: The Sinclair Palette

One saturated accent surrounded by warm neutrals. Crimson commands; everything else supports.

### Primary
- **School Crimson** (`#ac1a2f`): The system's sole accent. Primary CTAs (Search, Register All, Add to Cart), active navigation links, focus rings, selected filter chips, the wordmark, section codes, and critical inline links. Used sparingly — its presence signals "you can act here."
- **Active Crimson** (`#871523`): The hover/pressed state of School Crimson. Provides immediate tactile feedback on interactive elements. Never used at rest.

### Neutral
- **Warm Canvas** (`#faf8f5`): Page background. Warm-tinted off-white that reads as open and readable without the sterile cold of pure white. Also used as the filter drawer panel background.
- **Pure White** (`#ffffff`): Card surfaces, navigation bar, expanded section panels, modal overlays. Sits slightly above Warm Canvas to create gentle depth without shadows.
- **Ink** (`#111827`): Primary headings and high-emphasis body text. Near-black via Tailwind `gray-900`.
- **Ink Secondary** (`#374151`): Body text, nav links, label text at rest. Tailwind `gray-700`.
- **Ink Muted** (`#9ca3af`): Captions, metadata lines, timestamps, placeholder text. Tailwind `gray-400`. **Verify 4.5:1 contrast when placed on Warm Canvas.**
- **Warm Gray** (`#6b6460`): CSS-var warm counterpart to Tailwind grays. Used in secondary text roles where a warmer undertone is desirable (e.g., alongside crimson-tinted elements).
- **Warm Gray Light** (`#c4bdb8`): Disabled states and decorative dividers.

### Semantic
These four roles are reserved for availability and system state only. Never use them for decoration.

- **Open** — `#dcfce7` bg / `#166534` text: Section has available seats
- **Waitlist** — `#fef3c7` bg / `#92400e` text: Section is full but waitlist is open
- **Closed** — `#fee2e2` bg / `#b91c1c` text: Section full, no waitlist; also used for errors
- **Cancelled** — `#f3f4f6` bg / `#6b7280` text: Section withdrawn

### Named Rules

**The One Accent Rule.** School Crimson is used on ≤10% of any given screen at rest. It appears on primary CTAs, active nav links, selected chips, and focus rings — and nowhere else. When crimson appears, it means "act here." When it appears everywhere, it means nothing.

**The State-Only Semantic Rule.** Green, amber, and red carry one meaning in this system: Section availability. Do not repurpose them for alerts, success toasts, brand accents, or decorative highlights. Semantic colour diluted is semantic colour broken.

---

## 3. Typography

**Font:** Inter, system-ui, -apple-system, sans-serif (no custom font loading — system stack only)

**Character:** A single family in multiple weights. Inter's geometric neutrality fits the task — familiar, highly legible at small sizes, never asserting a personality that competes with content. The tighter tracking on display sizes creates authority without shouting.

### Hierarchy

- **Display** (700, 1.5rem / 24px, lh 1.3, ls -0.025em): Page-level headings — "My Cart", "Schedule Builder", "My Schedule". One per view.
- **Headline** (600, 1.25rem / 20px, lh 1.4, ls -0.02em): Sub-page sections and panel headings — term group headers, drawer headings.
- **Title** (600, 0.875rem / 14px, lh 1.4): Card and section row primary text — course long names, component labels. Semibold at body size for density without scale bloat.
- **Body** (400, 0.875rem / 14px, lh 1.5): General content — descriptions, filter labels, form copy. Max line length 65–75ch for prose surfaces (intro banner, course descriptions).
- **Label** (500, 0.75rem / 12px, lh 1.4, ls 0.01em): Badges, captions, metadata lines, chip text, inline counts. Medium weight keeps readability without competing with body.

**Section codes** (`ACC-1100-100`) render in a monospace stack (`'Courier New', monospace`). This is a functional distinction — codes scan differently from prose names — not a typographic flourish.

### Named Rules

**The Fixed Scale Rule.** This is a product UI viewed at consistent DPI, not a marketing page. Do not use `clamp()` for heading sizes. A fluid h1 that shrinks inside a sidebar panel is worse, not better. Use Tailwind's fixed rem scale (`text-sm`, `text-xl`, `text-2xl`).

**The Single Family Rule.** Do not introduce a second typeface for display, pull quotes, or feature sections. Inter across weights is the vocabulary. A second family signals "this is special" when the tool's job is to disappear.

---

## 4. Elevation

This system is flat by default. Surfaces are differentiated by background colour first (Warm Canvas → Pure White), then by border, then by shadow. Shadows are a last resort — they appear only when an element genuinely floats above the document.

### Surface Layers (no shadow)

| Layer | Color | Use |
|-------|-------|-----|
| Ground | Warm Canvas `#faf8f5` | Page background |
| Raised | Pure White `#ffffff` | Cards, nav bar, section rows |
| Inset | `#f9fafb` (gray-50) | Expanded card content panels |

### Shadow Vocabulary

- **Card Shadow** (`0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)`): Minimal lift for section cards, result rows, and Cart items sitting on a tinted background. Soft and tight — barely perceptible at rest.
- **Overlay Shadow** (`box-shadow: Tailwind shadow-2xl`): Right-slide filter drawer and any full-page overlay panel. Signals "this floats above everything."

### Border Vocabulary

- **Whisper** (`1px solid rgba(0,0,0,0.06)`): Structural dividers — nav bottom border, card inner panels.
- **Standard** (`1px solid rgba(0,0,0,0.10)` or `border-gray-200`): Component boundaries — cards, inputs at rest.
- **Focus** (`2px ring #ac1a2f` / `focus:ring-2 focus:ring-[#ac1a2f]`): Keyboard-visible focus on all interactive elements.

### Named Rules

**The Flat-By-Default Rule.** Surfaces rest flat. Shadow appears only as a direct response to state: a card hovers, a drawer opens, a dropdown floats. Never use shadow decoratively on content that stays in the flow.

**The No Ghost Card Rule.** Do not combine a `1px solid` border with a `box-shadow` with blur ≥16px on the same element. Pick one: a precise border at the brand's gray tone, or a tight shadow at ≤8px blur. Ghost-card (both at once) is a visible AI tell.

---

## 5. Components

Precise and familiar — standard affordances at exact, consistent application. Every component has the same vocabulary screen to screen.

### Buttons

Buttons come in three distinct shapes serving different contexts:

- **Shape (sm):** `border-radius: 4px` — all buttons except the nav Sign In pill
- **Shape (pill):** `border-radius: 9999px` — Sign In in the navigation, Cart count badge

**Primary** (`bg-[#ac1a2f] text-white rounded px-4 py-2 font-medium`): Main page-level actions — Search, Register All, Apply Filters. `hover:bg-[#871523]`. Focus: `focus-visible:ring-2 ring-[#ac1a2f]`. Disabled: `opacity-60 cursor-not-allowed`.

**Compact Primary** (`bg-[#ac1a2f] text-white rounded px-2.5 py-1 text-xs font-medium`): Inline row-level actions — Add, Waitlist, Register All inside term headers. Same colours as primary, smaller padding.

**Outlined** (`border border-[#ac1a2f] text-[#ac1a2f] rounded px-3 py-1.5 text-xs font-medium`): Secondary action paired with a primary — "Register Now / Waitlist Now" alongside "Add to Cart". `hover:bg-[#ac1a2f] hover:text-white`. Communicates equal-weight alternative.

**Ghost/Utility** (`border border-gray-300 text-gray-500 rounded px-2.5 py-1 text-xs`): Destructive or low-priority row actions — Remove, Books, Dismiss. Hover shifts border and text toward the action's semantic colour (red for Remove, blue for Books).

### Status Chips

Full-pill badges, 11px medium weight. Four variants, all paired with colour AND label text — colour is never the sole signal.

| State | BG | Text | Label pattern |
|-------|-----|------|---------------|
| Open | `#dcfce7` | `#166534` | `Open · {seats}/{cap}` |
| Waitlist | `#fef3c7` | `#92400e` | `Waitlist · {seats}/{cap}` |
| Closed | `#fee2e2` | `#b91c1c` | `Closed · {seats}/{cap}` |
| Cancelled | `#f3f4f6` | `#6b7280` | `Cancelled` |

### Filter / Toggle Chips

Day-of-week toggles and similar multi-select filters use a border-toggle pattern (not pill):
- **Active:** `bg-[#ac1a2f] text-white border-[#ac1a2f] rounded px-2.5 py-1 text-xs font-medium`
- **Inactive:** `bg-white text-gray-600 border-gray-300 rounded px-2.5 py-1 text-xs font-medium hover:border-[#ac1a2f]`

### Course Chips (Schedule Builder)

Selected courses in the Schedule Builder render as crimson pills with a `×` remove button:
`rounded-full bg-[#ac1a2f] px-3 py-1 text-xs font-medium text-white`

### Cards / Section Rows

Section rows in search results and Cart items:
- **Background:** Pure White `#ffffff`
- **Border:** `1px solid rgb(229 231 235)` (gray-200)
- **Radius:** 8px (`rounded-lg`)
- **Shadow:** Card shadow at rest
- **Padding:** `px-4 py-3` (16px/12px)
- **No hover shadow escalation** — hover is `bg-gray-50` background tint only (on expandable rows)

Section code renders in monospace crimson: `font-mono font-semibold text-[#ac1a2f]`

### Inputs / Fields

- **Style:** `border border-gray-300 rounded-lg px-4 py-3 text-sm` (search bar) or `border border-gray-300 rounded px-3 py-2 text-sm` (filter drawer inputs)
- **Focus:** `focus:ring-2 focus:ring-[#ac1a2f] focus:outline-none` — 2px crimson ring, removes default outline
- **Placeholder:** `text-gray-400` or `text-gray-500` — ensure 4.5:1 contrast against white backgrounds
- **Error:** Red ring and red helper text (`text-red-600`)
- **Disabled:** `opacity-60 cursor-not-allowed`

Select dropdowns follow the same pattern as inputs. PrimeVue's overlay (`<ul>` dropdown) uses `absolute z-50 bg-white border border-gray-200 rounded shadow-lg` — ensure it escapes any `overflow: hidden` ancestor.

### Navigation

Sticky top bar, 56px height, white surface with whisper bottom border:
- **Wordmark:** `text-[#ac1a2f] font-semibold text-lg tracking-tight` — the sole brand presence at the system level
- **Nav links:** `text-sm font-medium text-gray-600 hover:text-gray-900`, active state `text-[#ac1a2f]`
- **Sign In CTA:** Pill button — `bg-[#ac1a2f] text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-[#871523]`
- **Cart icon:** Icon button with crimson pill count badge (`-top-1 -right-1`)
- **Mobile:** Hamburger → full-width drawer with same link vocabulary

### Filter Drawer

Right-side slide panel, full height, `w-80 bg-white shadow-2xl`:
- Opens via `translate-x-0`, closes via `translate-x-full`, `transition-transform duration-200`
- Backdrop: `fixed inset-0 bg-black/30 z-40`
- "Apply Filters" CTA is a full-width primary button at bottom

### Maintenance Banner

`rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800` — uses the semantic warning colour (amber/waitlist). Appears above page content, below the nav.

---

## 6. Do's and Don'ts

### Do:

- **Do** use School Crimson (`#ac1a2f`) exclusively for primary actions, active links, active selection states, and focus rings. Never use it for decorative borders, backgrounds, or section dividers.
- **Do** pair every colour-coded status with a text label. `"Open"`, `"Waitlist"`, `"Closed"`, `"Cancelled"` must appear alongside the status chip — colour alone is not sufficient for accessibility.
- **Do** keep body and label text at sufficient contrast: `text-gray-700` (`#374151`) on white meets 4.5:1; `text-gray-400` (`#9ca3af`) on white does **not** — restrict muted text to captions and metadata where WCAG allows it for large text or non-essential context.
- **Do** use `focus:ring-2 focus:ring-[#ac1a2f]` on every interactive element. Keyboard navigation is a first-class requirement.
- **Do** render Section codes (`ACC-1100-100`) in monospace (`font-mono`). This is a functional convention — codes scan differently from prose.
- **Do** use skeleton loaders (`animate-pulse rounded-lg bg-white`) for loading states, not spinners inline with content.
- **Do** keep card radius at `rounded-lg` (8px) or `rounded` (4px). Do not exceed 12–16px on cards.

### Don't:

- **Don't** make the portal look like Blackboard, Banner Self-Service, or any legacy SIS UI — avoid overcrowded layouts, multi-colour header bars, bordered-table section lists, or anything that reads as "configured not designed."
- **Don't** use `border-left` wider than 1px as a coloured accent stripe on cards, list items, or alerts. This is a banned pattern in this system — rewrite with a tinted background or nothing at all.
- **Don't** apply gradient text (`background-clip: text`). School Crimson is a solid colour for a reason. Gradient text on a school brand reads as cheap.
- **Don't** add a second typeface for headlines, pull-quotes, or feature sections. One family, multiple weights.
- **Don't** use the semantic colours (green, amber, red) for anything other than Section availability and system state. Do not use green for "success" toasts, amber for info alerts, or red for brand accents.
- **Don't** place `text-gray-400` or lighter text on `bg-[#f6f5f4]` (Warm Canvas) for small body copy — the contrast falls below 4.5:1. Use `text-gray-500` minimum, prefer `text-gray-600`.
- **Don't** combine a `1px solid` border with a `box-shadow` with blur ≥16px on the same element (the ghost-card pattern). Pick one.
- **Don't** use `border-radius` greater than 16px on cards, section rows, or panel containers. `rounded-full` is reserved for pills, badges, and the Sign In nav CTA only.
- **Don't** add orchestrated page-load animation sequences. Students are mid-task; they don't want to watch the UI arrive.
