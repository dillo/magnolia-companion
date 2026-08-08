# Home Summary Card — Phone-Only, Two Grounds

## Purpose

The home page opens with a "Today at a glance" summary card holding two
halves: `TodayActivitySummary` (what's happening now or up next) and
`TodayMealSummary` (which meal is serving or next). Two problems:

1. **The halves blur together.** Stacked on a phone, nothing marks where
   Activities ends and Meals begins.
2. **The card is redundant on desktop.** From 768px up there is room for the
   Activities/Meals tab panels to show the same information in full, directly
   below.

The palette (rose `--color-summary`, plum `--color-summary-accent`) and the
16px card radius are keepers. This changes organization and visibility only.

All work is in `components/HomeClient.tsx` plus `e2e/smoke.spec.ts`.

## Visibility

`md:hidden` goes on the card wrapper (`HomeClient.tsx:116`), **not** on the
enclosing `<section aria-label="Today at a glance">`. The `Masthead` —
greeting, date heading, theme accent — stays at every width. From 768px up the
page runs date heading → Activities/Meals tab strip.

The two-lane layout is removed with it:

- `md:grid md:grid-cols-2` comes off the wrapper.
- `md:border-l md:border-t-0` comes off the `TodayMealSummary` section.

That code path is unreachable once the card is phone-only. Deleting it leaves
one layout to maintain instead of two.

## Two grounds

The boundary between the halves becomes a surface change rather than a line,
which reads faster than any rule:

- The wrapper keeps `bg-summary` (rose `#F2DEE8`), and `TodayActivitySummary`
  declares `bg-summary` on its own section too.
- `TodayMealSummary` gets `bg-card` (white `#FFFFFF`).

Both halves declare their own ground rather than one inheriting from the
wrapper. The redundancy is deliberate: each section states what it sits on, and
a computed background is assertable in a test where an inherited transparent
one is not.

The wrapper already carries `overflow-hidden rounded-2xl border border-hairline
shadow-sm`, so the white half clips into the bottom corners with no extra work.

## Three hairlines become one

This is the fix for the blurring. Today the card draws three visually identical
rules:

1. `SummaryHeader`'s `border-b`, under "Activities"
2. `TodayMealSummary`'s `border-t`, the seam between the halves
3. `SummaryHeader`'s `border-b` again, under "Meals"

Nothing marks (2) as more important than (1) and (3), so the seam carries no
more weight than a title underline and the halves read as one undifferentiated
stack.

- `SummaryHeader` loses `border-b border-hairline` entirely.
- `TodayMealSummary` keeps `border-t border-hairline` as the card's only line,
  now reinforced by the rose→white change.

## Icons

Each `SummaryHeader` gains the matching `HomeSectionIcon` — already defined at
the bottom of `HomeClient.tsx`, a sun for `activities` and a cloche for
`meals`, and already used by the tab strip below. This makes the card and the
tabs speak the same visual language.

- `h-5 w-5`, copper, `aria-hidden="true"` — the heading text already names the
  section, so the glyph is decorative.
- Bare glyph, **not** the `grid h-10 w-10 rounded-full bg-sand` badge the tab
  strip wraps it in. A sand disc on the rose ground would introduce a third
  tint competing with the split.

`SummaryHeader` takes a `section: HomeSection` prop to pick its icon.

## Status pill on the white half

`SummaryHeader`'s non-emphasized pill is currently
`border-summary-accent/30 bg-card text-summary-accent` — invisible on a white
ground. In the Meals half the pill ground flips to `bg-summary`, reading as a
deliberate echo of the Activities ground.

`SummaryHeader` takes a `pillOnLightGround?: boolean` prop for this, defaulting
to `false`; `TodayMealSummary` passes `true`.

The emphasized variant — `border-copper bg-copper text-petal`, used for
"Happening now" and "Serving now" — is untouched and works on both grounds.

Contrast is already proven: `text-summary-accent` on `bg-summary` is how the
existing body copy renders (`HomeClient.tsx:370`, `:405`, `:460`).

## Tests

Five e2e tests in `e2e/smoke.spec.ts` assert on the summary at desktop
viewports and will fail. Four need only a viewport change; the assertions
themselves stay valid because the card's content is unchanged.

| Test | Change |
|---|---|
| `:287` "rent reminder: appears in notifications and Home Today and Tomorrow views" | Add `setViewportSize({ width: 390, height: 844 })` |
| `:429` "hero card and now marker are time-aware" | Same |
| `:461` "lunch card is highlighted during its serving window" | Same |
| `:8` "activities and meals use their navigation defaults" | Drop its summary assertions — see below |
| `:59` "Today summary adapts from a phone stack to balanced tablet lanes" | Rewrite — see below |

`:8` cannot move to a phone viewport. It clicks page-to-page navigation links,
and below 1024px the header's nav is hidden (`SiteHeader.tsx:45` is `lg:flex`),
so the banner has no "Home" link and "Calendar" sits behind the collapsed More
menu in `BottomNav`. It stays on desktop and gives up its summary assertions
(lines 11-18) instead; that coverage moves into the rewritten `:59`, which is
where summary layout belongs anyway.

`:59`'s premise dies with the two-lane layout. Keep its 390px half (the two
regions stack, share a left edge, no horizontal overflow). Replace the 800px
half: assert the card is hidden while the masthead and tab strip remain
visible. Rename the test to match, e.g. "Today summary is a phone-only stack".

Its final block (Meals tab → breakfast/lunch/dinner card grid at 800px) tests
`MealCards`, not the summary, and is unaffected — keep it.

Tests at `:93` (390px) and `:125` (320px) already run on phone viewports and
need no change.

## Out of scope

- The Activities/Meals tab strip, tab panels, `Timeline`, `MealCards`, and
  `HelpfulToday` are untouched.
- No change to what the summary says — only to how it is organized and where
  it appears. The `heroStateFor` / `mealMomentFor` logic in `lib/now.ts` stays
  as is.
- No new color tokens. `bg-card`, `bg-summary`, `text-copper`, and
  `border-hairline` all exist.
