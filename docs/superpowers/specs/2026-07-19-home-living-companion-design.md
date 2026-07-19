# Home Screen "Living Companion" Redesign — Design Spec

**Date:** 2026-07-19
**Status:** Approved design, pending implementation plan
**Builds on:** `2026-07-08-magnolia-companion-design.md` (architecture, data model, and accessibility requirements unchanged)

## Purpose

The home screen currently renders today's schedule as a flat, time-blind document: a 9:00 AM event looks identical at 8:00 AM and 8:00 PM. This redesign makes the page time-aware — it answers "what's happening right now?" at a glance — and raises its visual craft (real display serif, celebrated day theme, true timeline, meal cards) while staying dignified, senior-readable, and fully static.

## Constraints carried over

- Static site: no server runtime; all time awareness computes client-side after mount (the existing `useToday()` pattern).
- Senior-readable floor: 17px base, WCAG AA+ contrast, large touch targets. High-contrast mode and the text-size control must keep working — all new color flows through the existing CSS variables.
- Motion respects `prefers-reduced-motion` and the app's own reduced-motion setting.
- Data model untouched. No changes to `content/` JSON or zod schemas.

## 1. Time model

- New client hook `useNow()` in `components/`, sibling to `useToday()`: returns the current America/New_York time at minute resolution, ticking on a one-minute interval, `null` until after mount (no hydration mismatch; static HTML stays date-agnostic).
- All (events, now) → UI-state logic lives in pure functions in `lib/` (e.g., `lib/now.ts`): hero state selection, past/upcoming partition of the timeline, and meal-window checks. These are unit-tested without a browser.

## 2. Masthead

Top to bottom on the Today view:

1. Small greeting in moss, keyed to hour: "Good morning" (before 12:00), "Good afternoon" (12:00–4:59 PM), "Good evening" (from 5:00 PM).
2. The date, large, in Fraunces.
3. The day theme on its own line — copper italic Fraunces with a small single-color magnolia line-art flourish derived from the existing logo petal paths. If the day has no theme, this line and flourish are simply absent.

The Today / Tomorrow / This Week pills are unchanged. Tomorrow and This Week views keep the current masthead (no greeting, theme stays on the date line as today).

## 3. Hero card — "Happening now / Up next"

One elevated card directly under the masthead, Today view only. It reports chronological truth (routine events included — if Evening News is what's on, that's what it says). States, evaluated against event start/end times (events without an `end` are treated as ending 60 minutes after start, capped at the next event's start so gaps between events still produce an "Up next" period):

| State | Condition | Content |
|---|---|---|
| Happening now | now within an event's window | "Happening now" label; event title large; location + dimension chip; time range; second line "Up next: {title} at {time}" when a later event exists today |
| Up next | before the next event, after at least one prior event | "Up next" label; event; "starts in {n} minutes" under 60 minutes, otherwise "at {time}" |
| First up today | before the day's first event | "First up today" label; first event; same starts-in phrasing |
| Day complete | after the day's last event ends | "That's all for today"; then "Tomorrow: {first special's title}, {time}". If tomorrow's month isn't uploaded, "Tomorrow's calendar hasn't been added yet." |

- The card carries the featured event's dimension tint as a soft background wash (from `DIMENSION_META`); no tint when the event has no dimension or in the day-complete state.
- If today has no events at all (missing month), the hero is not rendered; the existing `EmptyState` behavior stands.
- Before `useNow()` resolves (pre-mount), the hero is not rendered — no skeleton, matching how the whole client currently renders after mount.

## 4. Timeline

- A hairline vertical spine on the left with a copper dot per event, replacing the current divider list.
- **Specials:** soft-shadowed white (`--color-card`) cards with a 3px dimension-tinted left edge, title, location, dimension chip.
- **Routine events:** quiet one-line rows directly on the spine, as today.
- **Past events** are de-emphasized without breaking AA contrast (measured: no copper fade passes 4.5:1, so opacity alone can't express the fade): routine rows fade to 90% opacity (moss stays 4.69:1); past special cards keep full text opacity but drop their shadow, switch the time label from copper to moss, and dim their decorative spine dot to copper/40.
- A thin copper "now" marker with the current time label sits on the spine between past and upcoming events; the next upcoming event's card gets slightly stronger elevation.
- Entrance: rows fade-up with a gentle Framer Motion stagger; disabled entirely under either reduced-motion path.
- Tomorrow and This Week views reuse the same spine styling but have no now-marker and no fading.

## 5. Menu sidebar

- Each meal becomes a small card in the same surface language (card bg, hairline, soft shadow): small-caps meal name, serving hours as a tabular-nums badge.
- During a meal's `MEAL_HOURS` window (per `useNow()`), that card shows a copper "Serving now" badge.
- Desserts keep copper text and gain a small copper diamond glyph (◆) before the name — a text glyph, not an emoji.
- The missing-menu skeleton (ellipsis dots) stays, rendered inside the same card treatment so the column holds its shape.
- Upcoming Holidays keeps its current layout, inheriting only the new type scale.

## 6. Typography & surface

- Fraunces (variable) via `next/font/google` in `app/layout.tsx`, exposed as the `--font-display` value — self-hosted at build time, zero runtime font requests, identical on every device. All pages' display headings upgrade automatically.
- Body text: unchanged (current sans stack and sizes).
- Cards: `--color-card` surface, 1px hairline border, very soft shadow. All colors continue to flow through the CSS variables so high-contrast mode works unmodified.

## 7. Error handling

- No new failure modes: missing months/weeks fall through to the existing empty states; the hero's day-complete state handles the un-uploaded-tomorrow boundary explicitly (see table above).
- `useNow()` ticking across midnight: `useToday()` already governs the date; the hero recomputes from whichever values are current — no special casing beyond using both hooks' outputs together.

## 8. Testing

- Unit tests (`tests/now.test.ts`) for the pure hero-state logic: all four states, boundary minutes (exactly at start/end), events without `end`, day with only routine events, empty day, month-boundary tomorrow (present and missing).
- Unit tests for meal-window checks against `MEAL_HOURS`.
- Playwright smoke: home page renders the hero card and the now-marker appears in the timeline, using Playwright's `page.clock` API to fix the time to mid-afternoon on a date covered by the July 2026 fixture.

## Out of scope

Evening/dark palette shift, week-view redesign, calendar/menu/holiday page changes beyond the inherited font, any data-model or ingest changes.
