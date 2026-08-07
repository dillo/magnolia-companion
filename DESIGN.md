---
name: Magnolia Companion
description: A warm, senior-readable daily companion organized like a personal daybook.
colors:
  magnolia-petal: "#FAF6EE"
  leaf-ink: "#2A2E22"
  quiet-moss: "#5C6250"
  burnished-copper: "#A0501F"
  linen-hairline: "#E3DCCB"
  porcelain-card: "#FFFFFF"
  warm-sand: "#EEE9DC"
typography:
  display:
    fontFamily: "Fraunces, Iowan Old Style, Palatino, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(1.25rem, 7.3vw - 2px, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  headline:
    fontFamily: "Fraunces, Iowan Old Style, Palatino, Palatino Linotype, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Fraunces, Iowan Old Style, Palatino, Palatino Linotype, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "normal"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.05em"
rounded:
  panel: "8px"
  card: "12px"
  feature: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.burnished-copper}"
    textColor: "{colors.magnolia-petal}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.porcelain-card}"
    textColor: "{colors.quiet-moss}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.burnished-copper}"
    textColor: "{colors.magnolia-petal}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  card:
    backgroundColor: "{colors.porcelain-card}"
    textColor: "{colors.leaf-ink}"
    rounded: "{rounded.card}"
    padding: "16px 20px"
  card-feature:
    backgroundColor: "{colors.porcelain-card}"
    textColor: "{colors.leaf-ink}"
    rounded: "{rounded.feature}"
    padding: "16px 20px"
  input-search:
    backgroundColor: "{colors.porcelain-card}"
    textColor: "{colors.leaf-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "12px 20px 12px 48px"
---

# Design System: Magnolia Companion

## Overview

**Creative North Star: "The Magnolia Daybook"**

Magnolia Companion should feel like a well-kept personal daybook opened on a familiar writing desk: warm paper, legible entries, gentle botanical marks, and clear signals about what matters now. Its craft is visible but quiet. The interface is warm, dignified, calm, and reassuring, with enough character to feel personal and none of the visual language of a clinical portal.

The system is tactile and reassuring. Generous touch targets, pill-shaped controls, softly rounded cards, and unmistakable selected states make daily tasks feel dependable across phone, tablet, and desktop. Density stays comfortable, typography stays senior-readable, and motion is brief enough to orient without delaying the answer.

**Key Characteristics:**

- Warm paper neutrals with copper used as a purposeful signal.
- Fraunces display type paired with a plain, highly readable system sans.
- Hairline borders and quiet ambient lift rather than dramatic depth.
- Rounded, touch-friendly controls with explicit active and current states.
- Magnolia line art, tabular numbers, and restrained material textures as signature details.

The confirmed anti-references are clinical portals, childish “senior tech,” and generic corporate dashboards.

## Colors

The palette is botanical and paper-led: warm off-whites establish calm, leaf-toned neutrals carry content, and burnished copper identifies action, emphasis, and temporal importance.

### Primary

- **Burnished Copper** (`#A0501F`): Primary action, active navigation, time-sensitive labels, important links, notification emphasis, and the center of the magnolia mark. It is the clearest state signal and should remain visually scarce enough to retain authority.

### Secondary

- **Quiet Moss** (`#5C6250`): Secondary text, supporting metadata, inactive controls, and subdued iconography. It provides hierarchy without resorting to low-opacity text.

### Tertiary

Activity dimensions use soft backgrounds, accessible foregrounds, and stronger dots as a functional taxonomy. These colors label content; they do not replace the core brand palette.

- **Physical:** soft sky (`#D9E5F1`), deep blue (`#2B4E75`), dot blue (`#4A7FB5`).
- **Emotional:** blush (`#F4DBD8`), brick (`#8A3128`), coral dot (`#C25B50`).
- **Spiritual:** cloud blue (`#E0E5EF`), slate blue (`#37476B`), periwinkle dot (`#6C7FB5`).
- **Move:** leaf tint (`#DCE8D2`), forest (`#2F4A24`), green dot (`#5C8A47`).
- **Learn:** parchment (`#F4E3CE`), ochre ink (`#7A4A16`), amber dot (`#C8823B`).
- **Social:** rose tint (`#F2DEE8`), berry ink (`#813458`), rose dot (`#C06A97`).
- **Intellectual:** lavender tint (`#E2E1F4`), indigo ink (`#3F3A75`), violet dot (`#7A74C4`).
- **Entertainment:** orchid tint (`#EADDF0`), plum ink (`#5D3372`), orchid dot (`#9B62B8`).
- **Nutritional:** wheat tint (`#F1E9C6`), olive ink (`#6A5A14`), gold dot (`#BFA93C`).
- **Connect:** mint tint (`#D7E9E3`), evergreen ink (`#1F5D4A`), teal dot (`#3E8A6E`).

Nearby-place categories use four local accents only on icons and small dots: berry (`#8B3E66`), olive (`#556B3F`), teal (`#246A73`), and park green (`#3D7D52`). Restaurant and activity categories reuse Burnished Copper and Leaf Ink.

### Neutral

- **Magnolia Petal** (`#FAF6EE`): The page ground and the light text on dark or copper controls.
- **Leaf Ink** (`#2A2E22`): Primary text, strong icons, logo outlines, and the deepest overlay tone.
- **Linen Hairline** (`#E3DCCB`): Borders, dividers, quiet timeline marks, and unselected control outlines.
- **Porcelain Card** (`#FFFFFF`): Raised reading surfaces, cards, panels, inputs, and dialogs.
- **Warm Sand** (`#EEE9DC`): Sticky chrome, grouped-control beds, card headers, and secondary surface bands.

High-contrast mode deliberately remaps the same roles: Magnolia Petal becomes `#FFFDF8`, Leaf Ink `#11150F`, Quiet Moss `#2F382D`, Burnished Copper `#78320C`, Linen Hairline `#6C6F62`, and Warm Sand `#F2EFE6`; Porcelain Card remains white.

### Named Rules

**The Copper Signal Rule.** Use Burnished Copper for action, active state, time, or exceptional emphasis—not as broad decorative fill.

**The Soft Color Rule.** Functional category color appears in chips, dots, icons, edges, or very light washes; body copy remains Leaf Ink or Quiet Moss.

**The Accessible Palette Rule.** Never express state through opacity alone when that would weaken readable contrast; use a role change, border, shadow, or explicit label.

## Typography

**Display Font:** Fraunces, with Iowan Old Style, Palatino, and Georgia fallbacks.

**Body Font:** The platform system sans stack, beginning with `ui-sans-serif` and `system-ui`.

**Character:** Fraunces gives dates, headings, the wordmark, and named moments the warmth of an annotated daybook. The system sans keeps schedules, directions, controls, and reference content immediate and familiar.

### Hierarchy

- **Display** (600, `clamp(1.25rem, 7.3vw - 2px, 2.25rem)`, 1.25): Page titles and prominent dates; the fluid scale protects long date strings on narrow phones.
- **Headline** (600, `1.875rem`, 1.2): Major section headings and strong page-level supporting moments.
- **Title** (600, `1.5rem`, 1.375): Card titles, dialogs, hero content, and grouped information headings.
- **Body** (400, `1rem`, 1.5): Default reading and operating text. The root makes this `17px` by default, with user-selectable `19px` and `21px` modes; explanatory prose may use the relaxed 1.625 line height.
- **Label** (700, `13px`, `0.05em`, uppercase when used as an eyebrow): Status, category, and compact temporal labels. Labels remain short and never carry essential paragraph content.

Tabular numerals are required for times, dates, counts, doses, distances, and phone numbers so changing values remain visually stable.

### Named Rules

**The Serif-for-Orientation Rule.** Use Fraunces to tell people where they are and what moment matters; use the system sans to help them act and read details.

**The Seventeen-Pixel Floor Rule.** Default body text never drops below the product's `17px` root; `13px` is reserved for short, bold labels with sufficient contrast.

## Layout

The global shell uses a centered `72rem` container with `16px` side padding. Content narrows deliberately by task: broad calendars and exploration use the full shell, most daily and reference views use `64rem`, and focused directories or policy content use `48rem`. Within those containers, reading columns commonly stop near `36rem` while supporting panels occupy a fixed `19–20rem` column.

Spacing follows a `4px` base with an everyday rhythm of `8`, `12`, `16`, `20`, `24`, and `32px`. Controls use compact internal gaps, cards generally use `16–20px` padding, sibling cards sit `12–16px` apart, and major page regions open to `24–32px`. Density should feel generous but not sparse: a user should see the next actionable item without wading through decorative whitespace.

The responsive model is mobile-first at `640px`, `768px`, `1024px`, and `1280px`. Phones use single-column flows, a fixed five-slot bottom navigation, agenda-style calendar content, and full-width segmented controls. Tablets introduce two- and three-column card grids. At `1024px`, navigation moves into the sticky header and reference sidebars become sticky right columns. Safe-area padding protects the mobile tab bar, and modal widths remain bounded by the viewport.

Interactive targets are normally at least `40px` tall, with important icon controls at `44–56px`. Long labels wrap or shorten by breakpoint rather than shrinking below the reading floor.

### Named Rules

**The Comfortable Density Rule.** Keep the current answer and the next useful action in view, but never compress controls, type, or tap targets to fit more data.

**The Stable Shell Rule.** Reserve space for sticky chrome, scrollbars, mobile safe areas, and state-dependent content so navigation and primary controls do not jump between views.

## Elevation & Depth

The elevation philosophy is quietly layered. Tonal surfaces and Linen Hairline borders provide the structure; soft ambient shadows add separation; stronger lift is reserved for current, open, floating, or important states. Material texture is restrained and semantic: meal cards suggest fine menu paper, while medication rows receive only a faint prescription-label wash.

### Shadow Vocabulary

- **Ambient card** (`0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): The normal lift for cards that need separation from Magnolia Petal.
- **Current state** (`0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): The happening-now hero, serving-now meal, or next timeline card.
- **Scrolled chrome** (`0 10px 24px rgba(42, 46, 34, 0.08)`): Appears only after the sticky header leaves the top edge.
- **Floating panel** (`0 12px 24px rgba(42, 46, 34, 0.14)`): Notification and anchored overlay panels.
- **Mobile tray** (`0 -16px 32px rgba(42, 46, 34, 0.16)`): Upward lift for the expanded bottom-navigation menu.

### Named Rules

**The Border-Before-Shadow Rule.** Start with a tonal surface and one-pixel Linen Hairline border; add shadow only when hierarchy, overlap, or current state needs another cue.

**The Quietly Layered Rule.** Depth should make the information model obvious without making the interface feel glossy, floating, or dashboard-like.

## Shapes

The form language is softly rounded and functional. Standard cards use gently curved `12px` corners, feature cards use `16px`, compact panels use `8px`, and controls, chips, badges, timeline dots, and icon wells use pill or circular geometry. One-pixel borders keep pale surfaces legible against one another. Clipping is used for layered card headers, paper textures, and overlay panels, not as general ornament.

The magnolia mark is the only recurring organic silhouette. Its four outlined petals, copper center, and single-color flourish add botanical identity without turning the interface into floral decoration.

### Named Rules

**The Roundness-Signals-Role Rule.** Pills mean selection, status, or compact action; rounded rectangles hold information; circles hold icons, dates, or timeline position.

## Components

Components feel tactile and reassuring: large enough to touch confidently, explicit about state, and composed from the same warm surfaces and clear type hierarchy.

### Buttons

- **Shape:** Pill-shaped for navigation, filters, and date selectors (`9999px`); circular for icon-only actions.
- **Primary:** Burnished Copper background with Magnolia Petal text, at least `40px` high, semibold, and typically `8px 16px` padding.
- **Hover / Focus:** Hover slightly deepens or softens the existing role color. Every keyboard focus receives a `2px` Burnished Copper outline with a `2px` offset.
- **Secondary / Ghost:** Porcelain Card or transparent ground with Quiet Moss text and a Linen Hairline outline; hover strengthens the border or shifts text to Leaf Ink.
- **Disabled:** Keep readable color and structure, remove the affordance to act, and never depend on low opacity alone.

### Chips

- **Style:** Compact pills with bold text. Filter chips are at least `40px` tall; content taxonomy chips may use the `13px` label size because they are short and non-interactive.
- **State:** Selected filters become Burnished Copper with Magnolia Petal text. Unselected filters use Porcelain Card, Quiet Moss, and an inset Linen Hairline ring. Dimension chips use their fixed soft-background and accessible-foreground pairs.

### Cards / Containers

- **Corner Style:** `12px` standard; `16px` for the time-aware hero and other prominent summaries.
- **Background:** Porcelain Card by default, Warm Sand for internal header bands, and very light category or copper washes only when they communicate state.
- **Shadow Strategy:** Ambient at rest when separation is needed; Current State shadow for live, next, serving, or open content.
- **Border:** One-pixel Linen Hairline on nearly every discrete surface.
- **Internal Padding:** Usually `16px 20px`; empty states expand vertically to `40px`.

### Inputs / Fields

- **Style:** Porcelain Card, Linen Hairline border, pill shape for search, `12px` vertical padding, and a left-aligned inline icon.
- **Focus:** Global Burnished Copper outline plus any existing border strengthening.
- **Error / Disabled:** Use explicit text and preserved contrast; never communicate invalid or disabled state through color alone.

### Navigation

Desktop navigation lives in a translucent Warm Sand sticky header, with the active destination rendered as a copper pill. Mobile navigation is a fixed five-column tab bar with `24px` outline icons, visible labels, and a raised “More” tray. The wordmark combines the custom magnolia icon with semibold Fraunces. Navigation must always show both current location and a predictable path back.

### Time-Aware Hero and Timeline

The hero is a `16px`-radius summary card whose short uppercase copper label names the temporal state before a Fraunces event title. A dimension may tint the surface only as a soft wash. The timeline uses a hairline spine, circular markers, tabular times, quiet inline routine rows, and raised cards for special events. Past content changes role and elevation without dropping below readable contrast.

### Meal Cards

Meal cards use a fine, low-contrast paper texture, compact uppercase meal labels, tabular serving hours, copper line icons, and diamond-marked desserts. “Serving now” strengthens the copper border and lifts the card; high-contrast mode removes the texture entirely.

### Accessibility Control

The fixed copper accessibility button remains easy to find without competing with primary content. Its panel uses large segmented controls and labeled switches for text size, high contrast, and reduced motion. Settings apply before first paint and must preserve layout stability.

### Motion

Page content enters with a `250ms` fade and `8px` rise; timeline rows use a `200ms` fade and `6px` rise with a `40ms` stagger capped at `400ms`; FAQ answers use a `180ms` reveal. Use ease-out. Both system and in-product reduced-motion preferences remove animation and transitions.

### Named Rules

**The State-Must-Be-Obvious Rule.** Every selected, current, serving, past, open, disabled, or missing state needs a readable visual and textual cue.

**The Motion-Must-Yield Rule.** Motion may orient attention, but it must never delay content and must disappear completely when either reduced-motion path is active.

## Do's and Don'ts

### Do:

- **Do** lead with the answer that matters now, using clear temporal labels and tabular numbers.
- **Do** preserve the warm paper hierarchy: Magnolia Petal page, Porcelain Card content, Warm Sand chrome, and Linen Hairline separation.
- **Do** use Fraunces for orientation and emphasis while keeping operational text in the system sans.
- **Do** keep touch targets generous and support the `17px`, `19px`, and `21px` text modes without clipping or overlap.
- **Do** use the magnolia flourish, fine paper texture, and category tints as restrained, purposeful signatures.
- **Do** keep high-contrast and reduced-motion modes equivalent in information and functionality.

### Don't:

- **Don't** turn Burnished Copper into a general background or decorative wash; reserve it for action and meaning.
- **Don't** introduce cool clinical whites, sterile blue portal styling, childish illustrations, or generic dashboard chrome.
- **Don't** use low opacity as the only way to distinguish past, disabled, or secondary content.
- **Don't** shrink text or tap targets to preserve a desktop layout on smaller screens.
- **Don't** use functional activity or outing colors as new brand accents outside their taxonomy.
- **Don't** add ornamental flowers, gradients, texture, shadow, or animation unless they reinforce the established daybook metaphor or a real interface state.
