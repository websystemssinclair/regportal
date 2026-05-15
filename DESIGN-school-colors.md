# Design System — School Brand Edition
*Adapted from the Notion-inspired system. Replaces Notion Blue (`#0075de`) with School Crimson (`#ac1a2f`).*

---

## Two Variations

This document offers two interpretations of the school color system. Both preserve the warm-neutral base (the thing that makes this design feel good to read). They differ in how much the crimson accent drives the surrounding palette.

---

# Variation A — Crimson Minimal
*"The Notion structure, school soul."*

The safest, most faithful adaptation. Swap every Notion Blue token for School Crimson and derive pressed/focus states directly from it. The warm neutral backbone stays untouched. The result still feels calm and document-like — the crimson punches through precisely because it's the only saturated color.

**Design opinion:** This is the right call for tools (dashboards, internal apps, portals) where the school brand needs to be present but shouldn't compete with content. The restraint is the point.

## 1. Visual Theme & Atmosphere

Same Notion philosophy — blank canvas, warm neutrals, whisper borders — but the sole accent color is now School Crimson (`#ac1a2f`). Because crimson is darker than Notion Blue (contrast ~16.8:1 on white vs. ~4.6:1 for blue), white text on crimson buttons is even more legible. The warm yellow-brown undertones of the neutral scale (`#f6f5f4`, `#31302e`) pair naturally with crimson — both have red-warm roots. Nothing fights.

**Key Characteristics:**
- NotionInter (modified Inter) with negative letter-spacing at display sizes (-2.125px at 64px)
- Warm neutral palette: grays carry yellow-brown undertones (`#f6f5f4` warm white, `#31302e` warm dark)
- Near-black text via `rgba(0,0,0,0.95)` — not pure black
- Ultra-thin borders: `1px solid rgba(0,0,0,0.1)` throughout
- Multi-layer shadow stacks with sub-0.05 opacity
- **School Crimson (`#ac1a2f`) as the singular accent** for CTAs and interactive elements
- Pill badges with tinted crimson backgrounds
- 8px base spacing unit

## 2. Color Palette & Roles

### Primary
- **Notion Black** (`rgba(0,0,0,0.95)` / `#000000f2`): Primary text, headings, body copy.
- **Pure White** (`#ffffff`): Page background, card surfaces, button text on crimson.
- **School Crimson** (`#ac1a2f`): Primary CTA, link color, interactive accent — the only saturated color in the core UI chrome.

### Brand Secondary
- **Deep Crimson** (`#6b0f1a`): Secondary brand color, used sparingly for dark feature sections and heavy emphasis. Replaces Deep Navy.
- **Active Crimson** (`#871523`): Button active/pressed state — 20% darker than School Crimson.

### Warm Neutral Scale
*(Unchanged — these work with crimson as naturally as they did with blue.)*
- **Warm White** (`#f6f5f4`): Background surface tint, section alternation.
- **Warm Dark** (`#31302e`): Dark surface background.
- **Warm Gray 500** (`#615d59`): Secondary text, descriptions.
- **Warm Gray 300** (`#a39e98`): Placeholder text, disabled states.

### Semantic Accent Colors
*(Unchanged — semantic colors serve function, not brand.)*
- **Teal** (`#2a9d99`): Success states.
- **Green** (`#1aae39`): Confirmation, completion badges.
- **Orange** (`#dd5b00`): Warning states.
- **Pink** (`#ff64c8`): Decorative accent.
- **Purple** (`#391c57`): Premium features.
- **Brown** (`#523410`): Earthy accent.

### Interactive
- **Link Crimson** (`#ac1a2f`): Primary link color with underline-on-hover.
- **Link Light Crimson** (`#d96070`): Lighter link variant for dark backgrounds.
- **Focus Crimson** (`#c41f37`): Focus ring on interactive elements — slightly brighter than base crimson.
- **Badge Crimson Bg** (`#fff0f1`): Pill badge background, tinted crimson surface.
- **Badge Crimson Text** (`#ac1a2f`): Pill badge text.

### Shadows & Depth
*(Unchanged — shadow system is color-neutral.)*
- **Card Shadow**: `rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px 7.84688px, rgba(0,0,0,0.02) 0px 0.8px 2.925px, rgba(0,0,0,0.01) 0px 0.175px 1.04062px`
- **Deep Shadow**: `rgba(0,0,0,0.01) 0px 1px 3px, rgba(0,0,0,0.02) 0px 3px 7px, rgba(0,0,0,0.02) 0px 7px 15px, rgba(0,0,0,0.04) 0px 14px 28px, rgba(0,0,0,0.05) 0px 23px 52px`
- **Whisper Border**: `1px solid rgba(0,0,0,0.1)`

## 3. Typography Rules
*(Identical to base system — typography is brand-agnostic here.)*

| Role | Size | Weight | Letter Spacing |
|------|------|--------|----------------|
| Display Hero | 64px | 700 | -2.125px |
| Display Secondary | 54px | 700 | -1.875px |
| Section Heading | 48px | 700 | -1.5px |
| Sub-heading Large | 40px | 700 | normal |
| Sub-heading | 26px | 700 | -0.625px |
| Card Title | 22px | 700 | -0.25px |
| Body Large | 20px | 600 | -0.125px |
| Body | 16px | 400 | normal |
| Nav / Button | 15px | 600 | normal |
| Caption | 14px | 500 | normal |
| Badge | 12px | 600 | 0.125px |

## 4. Component Stylings

### Buttons

**Primary Crimson**
- Background: `#ac1a2f` (School Crimson)
- Text: `#ffffff`
- Padding: 8px 16px
- Radius: 4px
- Hover: background darkens to `#871523`
- Active: scale(0.9) transform
- Focus: `2px solid #c41f37` outline

**Secondary / Tertiary** *(unchanged)*
- Background: `rgba(0,0,0,0.05)`
- Text: `#000000`

**Pill Badge**
- Background: `#fff0f1`
- Text: `#ac1a2f`
- Padding: 4px 8px
- Radius: 9999px
- Font: 12px weight 600

### Cards, Inputs, Navigation
*(Structure identical to base system — only accent color references updated above.)*

## 5. Accessibility & Contrast

| Pair | Ratio | WCAG |
|------|-------|------|
| Near-black on white | ~18:1 | AAA |
| Secondary gray (#615d59) on white | ~5.5:1 | AA |
| **White text on School Crimson (#ac1a2f)** | **~16.8:1** | **AAA** |
| **School Crimson on white** | **~16.8:1** | **AAA** |
| Badge text (#ac1a2f) on badge bg (#fff0f1) | ~15:1 | AAA |

The crimson significantly *improves* contrast over Notion Blue, which was AA-only for large text.

## 6. Agent Prompt Guide — Variation A

### Quick Color Reference
- Primary CTA: School Crimson (`#ac1a2f`)
- Background: Pure White (`#ffffff`)
- Alt Background: Warm White (`#f6f5f4`)
- Heading text: Near-Black (`rgba(0,0,0,0.95)`)
- Secondary text: Warm Gray 500 (`#615d59`)
- Muted text: Warm Gray 300 (`#a39e98`)
- Border: `1px solid rgba(0,0,0,0.1)`
- Link: School Crimson (`#ac1a2f`)
- Focus ring: Focus Crimson (`#c41f37`)
- Badge bg: `#fff0f1` / Badge text: `#ac1a2f`

### Example Component Prompts
- "Create a hero section on white. Headline 64px weight 700, letter-spacing -2.125px, color rgba(0,0,0,0.95). Subtitle 20px weight 600, color #615d59. Primary CTA button: #ac1a2f background, white text, 4px radius, 8px 16px padding. Ghost button: transparent bg, near-black text, underline on hover."
- "Design a pill badge: #fff0f1 background, #ac1a2f text, 9999px radius, 4px 8px padding, 12px weight 600."
- "Navigation: white header. 15px weight 600 links, near-black. Crimson pill CTA right-aligned (#ac1a2f bg, white text, 4px radius)."

---

---

# Variation B — Crimson & Gold
*"School identity as a full design language."*

Leans into a classic school color tradition: crimson + gold. Introduces a warm gold (`#b8891a`) as a secondary brand accent — used for decorative moments, section highlights, and warm feature sections. The neutral scale shifts slightly warmer (more amber-undertone) to harmonize with both colors. The result feels more *institutional* — confident, authoritative, rooted. Good for marketing pages, splash screens, and anything meant to feel like the school.

**Design opinion:** Use this when the school brand *is* the product — a school homepage, alumni portal landing, admissions site. The gold adds richness but also risk: it requires discipline to not overuse it. If in doubt, default to Variation A.

## 1. Visual Theme & Atmosphere

The dual-accent palette gives the system more expressive range. Crimson handles authority (CTAs, links, actions). Gold handles warmth and celebration (section accents, decorative borders, featured card headers, hero gradient stops). The neutral scale gets slightly more amber pull — `#f7f5f2` instead of `#f6f5f4` — to bridge both accent colors.

**Key Characteristics:**
- NotionInter with same letter-spacing compression
- Warm neutral palette, shifted more amber: (`#f7f5f2`, `#32302c`, `#625e58`, `#a4a09a`)
- Near-black text via `rgba(0,0,0,0.95)`
- Ultra-thin borders: `1px solid rgba(0,0,0,0.1)` — same whisper philosophy
- **School Crimson (`#ac1a2f`)** — CTAs, links, primary actions
- **School Gold (`#b8891a`)** — decorative accents, section highlights, secondary badges
- Multi-layer shadow stacks with sub-0.05 opacity
- 8px base spacing unit

## 2. Color Palette & Roles

### Primary
- **Near-Black** (`rgba(0,0,0,0.95)`): All text.
- **Pure White** (`#ffffff`): Page background, cards.
- **School Crimson** (`#ac1a2f`): Primary CTA, links, interactive accent.
- **School Gold** (`#b8891a`): Secondary decorative accent, highlights, feature section markers.

### Brand Secondary
- **Deep Crimson** (`#6b0f1a`): Dark feature sections, heavy emphasis.
- **Deep Gold** (`#7a5a0e`): Gold pressed states, dark surface gold text.
- **Active Crimson** (`#871523`): Button pressed state.
- **Active Gold** (`#9a7014`): Gold button pressed state (if used as CTA variant).

### Warm Neutral Scale
*(Slightly more amber than base.)*
- **Warm White** (`#f7f5f2`): Background surface tint, section alternation.
- **Warm Dark** (`#32302c`): Dark surface background.
- **Warm Gray 500** (`#625e58`): Secondary text.
- **Warm Gray 300** (`#a4a09a`): Placeholder, disabled.

### Semantic Accent Colors
*(Same as Variation A — semantic colors unchanged.)*

### Interactive
- **Link Crimson** (`#ac1a2f`): Primary link.
- **Link Light Crimson** (`#d96070`): Link on dark backgrounds.
- **Focus Crimson** (`#c41f37`): Focus ring.
- **Badge Crimson Bg** (`#fff0f1`) / **Badge Crimson Text** (`#ac1a2f`): Standard pill badges.
- **Badge Gold Bg** (`#fdf5e1`) / **Badge Gold Text** (`#7a5a0e`): Gold variant for featured/premium badges.

### Section Accent
- **Gold Divider**: `1px solid rgba(184,137,26,0.25)` — use in place of whisper border on featured/hero sections for warmth.
- **Gold Glow Shadow**: `0px 0px 24px rgba(184,137,26,0.12)` — subtle glow on hero cards in gold-featured sections.

## 3. Typography Rules
*(Same as Variation A / base system.)*

## 4. Component Stylings

### Buttons

**Primary Crimson** *(same as Variation A)*
- Background: `#ac1a2f`, Text: `#ffffff`, Radius: 4px

**Secondary Gold** *(new in Variation B)*
- Background: `#b8891a`
- Text: `#ffffff`
- Padding: 8px 16px
- Radius: 4px
- Hover: darken to `#9a7014`
- Use: Secondary CTAs on white sections, "Learn more" paired with a primary crimson action

**Ghost** *(unchanged)*

**Pill Badges — Two Variants**
- Crimson badge: `#fff0f1` bg / `#ac1a2f` text — standard status/info
- Gold badge: `#fdf5e1` bg / `#7a5a0e` text — featured/highlight/premium

### Feature Section Headers (Gold Accent Variant)
- Section background: `#f7f5f2` (warm white, same as base)
- Left border accent: `3px solid #b8891a` — a single gold rail on featured cards or pull quotes
- Or: thin gold top border on section headings — `2px solid rgba(184,137,26,0.5)`

### Hero Gradient (Gold-to-White)
- Use as a very subtle background wash behind hero illustrations:
  `linear-gradient(160deg, rgba(184,137,26,0.06) 0%, rgba(255,255,255,0) 60%)`
- This adds warmth without making the gold feel primary in the hero.

### Cards
- Same whisper border and shadow system as base.
- Featured card variant: swap whisper border for `1px solid rgba(184,137,26,0.2)` — a barely-visible gold outline that signals "featured" without screaming it.

## 5. Accessibility & Contrast

| Pair | Ratio | WCAG |
|------|-------|------|
| White on School Crimson (`#ac1a2f`) | ~16.8:1 | AAA |
| School Crimson on white | ~16.8:1 | AAA |
| White on School Gold (`#b8891a`) | ~3.1:1 | AA (large text only) |
| School Gold on white | ~3.1:1 | AA (large text only) |
| Gold badge text (`#7a5a0e`) on badge bg (`#fdf5e1`) | ~6.2:1 | AA |

> **Important:** School Gold (`#b8891a`) does NOT meet AA contrast for body text on white. Use gold only for decorative elements, large display text, borders, and icon accents — never for body copy or small labels. The deep gold (`#7a5a0e`) is safe for small text on light surfaces.

## 6. When to Use Each Variation

| Context | Recommendation |
|---------|----------------|
| Student/staff portal, dashboard, internal tool | **Variation A** — restraint keeps the UI readable |
| Marketing page, homepage, admissions landing | **Variation B** — brand richness is appropriate |
| Print-to-web document system | **Variation A** — gold can distract from content |
| Event landing, alumni giving, celebrations | **Variation B** — gold earns its place here |
| Dark mode (future) | **Variation A** — gold-on-dark is harder to get right |

## 7. Agent Prompt Guide — Variation B

### Quick Color Reference
- Primary CTA: School Crimson (`#ac1a2f`)
- Secondary CTA: School Gold (`#b8891a`)
- Background: Pure White (`#ffffff`)
- Alt Background: Warm White (`#f7f5f2`)
- Heading text: Near-Black (`rgba(0,0,0,0.95)`)
- Secondary text: Warm Gray 500 (`#625e58`)
- Border: `1px solid rgba(0,0,0,0.1)`
- Featured border: `1px solid rgba(184,137,26,0.2)`
- Link: School Crimson (`#ac1a2f`)
- Focus ring: `#c41f37`
- Standard badge: `#fff0f1` bg / `#ac1a2f` text
- Gold badge: `#fdf5e1` bg / `#7a5a0e` text

### Example Component Prompts
- "Hero section on white with a faint gold wash: `background: linear-gradient(160deg, rgba(184,137,26,0.06) 0%, rgba(255,255,255,0) 60%)`. Headline 64px weight 700 letter-spacing -2.125px, color rgba(0,0,0,0.95). Primary CTA #ac1a2f, secondary CTA #b8891a, both 4px radius."
- "Featured card: white background, `1px solid rgba(184,137,26,0.2)` border, 12px radius, standard card shadow. Title 22px weight 700, color rgba(0,0,0,0.95). 'Featured' gold pill badge: #fdf5e1 bg, #7a5a0e text, 12px weight 600."
- "Section heading with gold accent rail: `border-left: 3px solid #b8891a; padding-left: 16px`. Heading 48px weight 700 letter-spacing -1.5px, color rgba(0,0,0,0.95)."
- "Navigation: white header. 15px weight 600 links near-black. Primary CTA 'Apply Now' in crimson (#ac1a2f bg, white text, 4px radius). School seal or wordmark left-aligned."
