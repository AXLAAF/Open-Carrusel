---
name: SwipeForge Editorial Workshop
colors:
  surface: '#121318'
  surface-dim: '#121318'
  surface-bright: '#38393f'
  surface-container-lowest: '#0d0e13'
  surface-container-low: '#1a1b21'
  surface-container: '#1e1f25'
  surface-container-high: '#292a2f'
  surface-container-highest: '#34343a'
  on-surface: '#e3e1e9'
  on-surface-variant: '#e5beb2'
  inverse-surface: '#e3e1e9'
  inverse-on-surface: '#2f3036'
  outline: '#ac897e'
  outline-variant: '#5c4037'
  surface-tint: '#ffb59c'
  primary: '#ffb59c'
  on-primary: '#5c1900'
  primary-container: '#ff5708'
  on-primary-container: '#511500'
  inverse-primary: '#aa3600'
  secondary: '#ffb3b1'
  on-secondary: '#680011'
  secondary-container: '#ad0224'
  on-secondary-container: '#ffb8b5'
  tertiary: '#f3afff'
  on-tertiary: '#4e155e'
  tertiary-container: '#b979c7'
  on-tertiary-container: '#470c57'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcf'
  primary-fixed-dim: '#ffb59c'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#822700'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b1'
  on-secondary-fixed: '#410007'
  on-secondary-fixed-variant: '#92001c'
  tertiary-fixed: '#fcd7ff'
  tertiary-fixed-dim: '#f3afff'
  on-tertiary-fixed: '#340043'
  on-tertiary-fixed-variant: '#682e77'
  background: '#121318'
  on-background: '#e3e1e9'
  surface-variant: '#34343a'
typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.04em
  display-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  title-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.1em
  caption-xs:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid-base: 0.5rem
  pad-xs: 0.25rem
  pad-sm: 0.5rem
  pad-md: 1rem
  pad-lg: 1.5rem
  pad-xl: 2rem
  gutter-canvas: 1.5rem
  gutter-panel: 1rem
  safezone-inline: 2rem
  safezone-block: 2.5rem
---

## Brand & Style

This design system establishes a high-performance editorial environment crafted for discerning designers, technical creators, and digital publication architects. The aesthetic synthesizes the discipline of International Typographic Style (Swiss Modernism) with the hyper-functional tactility of modern IDE developer tooling. 

The emotional tone balances absolute editorial precision with thermal energy: dark-mode computational rigor illuminated by incandescent gradients of molten heat, forge orange, and deep ultraviolet. Interfaces project confidence, extreme utility, and typographic mastery—deliberately rejecting generic templates in favor of structural clarity, visible safe-zones, aspect ratio indicators (4:5, 1:1, 9:16), and razor-sharp framing.

## Colors

The palette is engineered around an ultra-dark cold obsidian ground coupled with high-temperature thermal emissions:

- **Canvas & Surfaces:** Deep void black (`#0C0D12`) and tinted charcoal container surfaces (`#12141C`, `#171A24`).
- **Thermal Accents:** Primary Forge Orange (`#FF5500`) serves as the dominant interactive signal, cascading into Crimson Flame (`#E63946`) and deep Violet Ember (`#642B73`) for heat-map transitions and progressive glow effects.
- **Structural Borders:** Fine-line borders (`#232736`) delineate modules without visually overwhelming content.
- **Typography & Monochrome:** Stark pure white (`#FFFFFF`) for primary headlines, calibrated high-legibility zinc (`#9496A1`) for metadata/labels, and muted slate (`#4B4F63`) for grid markings and inactive states.

## Typography

The typographic hierarchy implements an uncompromising three-family architecture:
- **Headlines (`Space Grotesk`):** Delivers aggressive geometric clarity, tightly tracked for high-density editorial impact and headline impact.
- **Body (`Geist`):** Provides razor-clean, neutral readability across long-form instructional copy, editor sidebars, and property panels.
- **Labels, Tokens & Badges (`JetBrains Mono`):** Grounds interface elements in technical tooling aesthetics, handling slide indexes, hex tokens, dimension tags, and aspect ratio markers with monospaced precision.

## Layout & Spacing

The workspace operates on an invariant 8px fundamental grid system. 

### Carousel Stage & Grid Matrix
- **Workbench Canvas:** Centers the live carousel viewport flanked by responsive tool rails. The canvas exposes toggleable Swiss grid overlays (8-column vertical layout guides, baseline rules, and boundary safe zones).
- **Aspect Ratio Enclosures:** Strict support for aspect ratios: `4:5` (social carousel default), `1:1` (square), and `9:16` (full story/reel). Outer margins represent true platform clipping areas.
- **Bento Grid Architecture:** Secondary dashboards, slide selectors, and property inspectors utilize modular bento arrangements with fixed 16px (`pad-md`) gutters.

### Breakpoint Strategy
- **Mobile (< 768px):** Single-column stacked mode. Workspace focuses on swipeable single-slide preview with bottom-sheet configuration trays.
- **Tablet (768px - 1199px):** Split layout with fixed slide viewport (centered) and retractable bottom/right tool palettes.
- **Desktop (1200px+):** Tri-pane studio suite: left navigation/slide sequence timeline, center high-resolution stage with real-time gradient forge engines, and right-hand typographic property inspector.

## Elevation & Depth

This system achieves hierarchy through sharp contrast, micro-borders, and atmospheric thermal lighting rather than muddy structural dropshadows:

1. **Substrate (Level 0):** Pure `#0C0D12` base canvas.
2. **Structural Panels (Level 1):** Solid `#12141C` backdrops bounded by 1px solid borders in `#232736`. Zero spread shadow.
3. **Active Workspaces & Bento Modules (Level 2):** Elevated `#171A24` surfaces with subtle internal inset strokes (`rgba(255, 255, 255, 0.04)`).
4. **Thermal Glow Projections:** Accent elements and active slide frames emit vibrant, diffused multi-stop Gaussian halos (`0 8px 32px rgba(255, 85, 0, 0.18)` blending into `0 16px 64px rgba(100, 43, 115, 0.25)`).
5. **Floating Tooltips & Popovers:** Backdrop filter blur (16px) over translucent `#12141Cee` with razor 1px borders in `#FF5500` at 40% opacity.

## Shapes

The geometric personality adheres strictly to Level 1 ("Soft" / Architectural). UI controls, bento cards, and panels feature tight 4px (`rounded-sm`) to 8px (`rounded-lg`) corner radii, preserving a hard-edged engineering character. Aspect ratio chips, tag pills, and directional swipe nodes allow fully pill-shaped rounding (`9999px`) to visually contrast against the rigid rectilinear Swiss grid.

## Components

### Buttons
- **Primary (Forge Action):** High-density background gradient from `#FF5500` to `#E63946`, solid `#FFFFFF` typography (`Space Grotesk`, semi-bold), 8px border-radius, and a thermal radiant glow on hover (`box-shadow: 0 0 20px rgba(255, 85, 0, 0.4)`).
- **Secondary / Ghost:** Transparent background with 1px border in `#232736`, transitioning to pure white text and border `#FF5500` on hover.
- **Icon / Step Triggers:** Monospaced 36x36px square buttons with directional arrows, styled in matte `#171A24`.

### Chips & Aspect Ratio Badges
- **Technical Ratio Chips:** Built with `JetBrains Mono` at 11px uppercase (`4:5`, `1:1`, `9:16`). Contained in dark capsule tags (`#12141C`) with a 1px border and a luminous thermal indicator dot next to the active format.
- **Hex Badges:** Distinct tactile pills featuring a dual structure: a color swatch box followed by monospaced copy (e.g., `#642B73`), bounded by an outer keyline border.

### Input Fields & Controls
- **Numeric & Typographic Inputs:** Low-profile recessed containers in `#0C0D12` with 1px borders in `#232736`. Font set in `JetBrains Mono`. Focus states illuminate the border with a sharp `#FF5500` outline without glow spread.
- **Sliders (Gradient Angle / Mesh Warp):** Custom 2px track in `#232736` filled with active `#FF5500` gradient progress, anchored by a 12px circular thumb carrying an intense center core.

### Cards & Carousel Slides
- **Bento Slide Canvas:** 1px hairline border in `#232736`, surface filled with `#12141C`, carrying optional Swiss grid guidelines (`rgba(255, 255, 255, 0.05)`). Slide index numbering sits in the upper-right corner using bold, oversized monospaced numerals.
- **Code & Syntax Blocks:** Jet-black container with an inset horizontal status bar, terminal-style line numbers, and high-contrast syntax highlighting calibrated to match the thermal spectrum.

### Checkboxes & Radio Swatches
- **Radio Swatches:** Compact geometric square frames featuring inset selection checks or solid thermal core fills. Checked state commands an active `#FF5500` keyline border.