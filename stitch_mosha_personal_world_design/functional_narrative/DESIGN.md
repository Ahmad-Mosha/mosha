---
name: Functional Narrative
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#44474c'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f72'
  primary: '#333e50'
  on-primary: '#ffffff'
  primary-container: '#4a5568'
  on-primary-container: '#becae0'
  inverse-primary: '#bcc7dd'
  secondary: '#555f71'
  on-secondary: '#ffffff'
  secondary-container: '#d6e0f6'
  on-secondary-container: '#596376'
  tertiary: '#303f52'
  on-tertiary: '#ffffff'
  tertiary-container: '#47566a'
  on-tertiary-container: '#bccbe3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fa'
  primary-fixed-dim: '#bcc7dd'
  on-primary-fixed: '#111c2c'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#d9e3f9'
  secondary-fixed-dim: '#bdc7dc'
  on-secondary-fixed: '#121c2c'
  on-secondary-fixed-variant: '#3d4759'
  tertiary-fixed: '#d4e4fc'
  tertiary-fixed-dim: '#b8c8e0'
  on-tertiary-fixed: '#0d1c2e'
  on-tertiary-fixed-variant: '#39485c'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  paper-white: '#FDFDFD'
  slate-gray: '#4A5568'
  cool-border: '#E2E8F0'
  text-main: '#1A202C'
typography:
  display-sm:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-xs:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
  mono-sm:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-page: 24px
  density-tight: 4px
  density-md: 8px
  density-lg: 16px
---

## Brand & Style

The design system evolves the "personal sanctuary" concept into a high-performance workspace. It moves away from the warmth of the previous iteration toward a **Precision-Focused Minimalism**. The brand personality is **Disciplined, Lucid, and Sophisticated**, evoking the feeling of a high-end architectural studio or a technical drafting table.

The aesthetic combines **Modern Corporate** reliability with **Minimalist** clarity. It prioritizes information density and structural order, ensuring that "calm" is achieved through perfect organization rather than excessive whitespace. Visual noise is aggressively reduced to allow data-heavy environments—finance, logs, and technical notes—to feel effortless and legible.

## Colors

The palette is anchored in a "Cool Paper" aesthetic, shifting away from organic creams to a clinical yet premium spectrum of grays and whites.

- **Primary (Slate Blue-Grey):** Used for structural accents, active states, and icon accents. It provides a professional, "ink-on-paper" feel.
- **Background (Paper White):** `#FDFDFD` is the universal canvas. It is cleaner than cream but softer than pure `#FFFFFF`, providing a crisp backdrop for dense data.
- **Neutral/Borders:** Utilizing a range of cool slates (`#E2E8F0` to `#CBD5E0`) for subtle dividers and grid lines.
- **Text:** Primary text uses a deep navy-charcoal (`#1A202C`) to ensure maximum legibility against the paper-white background.

## Typography

This system uses a functional "System-Modern" pairing. 

**Geist** is the primary UI workhorse. Its technical, precise nature is ideal for high-density tables and logs. It should be used for all body text, UI controls, and labels. A monospaced variant (Geist Mono) should be used for numerical data in financial tables or session timestamps.

**EB Garamond** is reserved strictly for high-level page titles and section headers. Unlike the previous system, it is used at much smaller, more "literary" scales. It provides a touch of editorial sophistication without sacrificing the vertical space required for a high-density layout.

## Layout & Spacing

The layout moves to a **Fluid Grid** model with a 4px baseline shift to accommodate high-density information. 

- **Density Rules:** Standard padding is reduced to 8px or 12px for components. Data tables use a 4px/8px vertical rhythm.
- **Desktop:** 12-column grid. Margins are narrowed to 24px-32px to reclaim horizontal real estate for side-by-side views (e.g., a note list next to a note editor).
- **Reflow:** Content should stretch to fill the screen, using max-width containers only for long-form reading segments. Complex views like finance dashboards should utilize a multi-pane layout rather than a centered single column.

## Elevation & Depth

Hierarchy is established through **Low-contrast outlines** and **Tonal Layers** rather than shadows. 

- **Borders:** Use 1px solid dividers in `#E2E8F0` for most structural separation. This creates a "blueprint" feel that is more efficient than shadows in dense layouts.
- **Layers:** Use subtle gray backgrounds (`#F7FAFC`) to differentiate sidebar areas or table headers from the primary content area.
- **Focus:** Shadows are used only for temporary floating elements (tooltips, dropdowns) and should be crisp and minimal: `0 4px 12px rgba(0,0,0,0.05)`.

## Shapes

The shape language is **Soft (Level 1)**. 

- **Components:** Buttons and input fields use a 4px (`0.25rem`) radius. This maintains a structured, professional appearance while avoiding the harshness of sharp corners.
- **Containers:** Large cards or panes use an 8px (`0.5rem`) radius. 
- **Consistency:** The reduced roundedness allows elements to sit closer together without creating awkward "trapped" white space in the corners, supporting the high-density objective.

## Components

- **Data Tables:** High-density rows (32px-36px height). Use `mono-sm` for figures. Cell borders are horizontal-only to emphasize the row-based narrative of finance and logs.
- **Grid Folders:** For notes, use a rigid grid of cards with 1px borders. Headers within cards should use `label-md` for categorical clarity.
- **Buttons:** Small, efficient footprints. Primary buttons are solid Slate (`#4A5568`), while secondary buttons use a "Ghost" style with a 1px border. 
- **Session Logs:** Use a vertical "timeline" thread with small circular nodes and `mono-sm` timestamps.
- **Input Fields:** Rectangular with a 1px border. Backgrounds should be pure white to contrast against the slightly grayer "Surface" containers.
- **Chips:** Rectangular with `0.25rem` rounding. Use high-contrast text and very light gray backgrounds for a "tag" appearance that doesn't distract from the primary content.