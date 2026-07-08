# Magnolia Companion — Design Spec

**Date:** 2026-07-08
**Status:** Approved design, pending implementation plan
**Mockups:** https://claude.ai/code/artifact/ca8897d7-696c-4e78-a8a4-b0a55c235a59 (revision 3, built from the real July 2026 printout)

## Purpose

Magnolia Place of Roswell (senior assisted living) distributes printed handouts: a two-page monthly activity calendar and a weekly restaurant menu. Magnolia Companion turns photos of those printouts into a browsable, filterable website that a resident and their family use daily: what's happening today, what's for dinner, what's coming this week.

## Users, scope, access

- **Users:** one resident and their family members, equally. Devices are mixed (phone, tablet, laptop) — fully responsive with senior-readable defaults everywhere: 16px minimum text, WCAG AA+ contrast, large touch targets, a Large / Extra-large text-size control.
- **Scope:** personal, single facility. No accounts, no multi-tenancy.
- **Access:** anyone with the link can view; there is no login. Publishing happens only through the maintainer's Mac + git push. Resident birthdays printed on the calendar are **excluded** from the app (open-viewing privacy call).

## Architecture: git-as-database static site

Next.js (App Router) + React + Tailwind CSS on Vercel's free tier, deployed from a GitHub repo. There is no database and no server-side runtime: JSON files in the repo are the data store, and every page is statically generated at build time.

Two halves:

1. **Content pipeline (runs locally).** `npm run ingest -- <photo> [photo2] --type activities|menu` sends the photo(s) to the Claude API (vision), validates the structured output against a zod schema, and writes a JSON file into `content/`. Review = run `npm run dev`, compare the rendered site against the paper (the app shows original scans in a lightbox), fix any misreads in the JSON, then `git push`.
2. **The site (runs on Vercel).** Push to `main` → Vercel rebuilds → static pages regenerate from the JSON. No environment variables in Vercel; the Claude API key lives only in a git-ignored local `.env`.

Because the site only rebuilds on push, "today" is computed **client-side** in America/New_York: the month's data ships in the page and JavaScript highlights the current day (including the Today/Tomorrow/This Week pills). This covers month boundaries — if tomorrow's month isn't uploaded yet, the UI shows the missing-data state below.

Publishing flow: paper → phone photo → AirDrop to Mac → `npm run ingest` → eyeball locally → `git push` → live (~5 minutes per handout).

## Data model

All content lives in `content/`, scans in `content/scans/` (served for the lightbox). Zod schemas validate at ingest time and again at build time.

### Activities — one file per month, `content/activities/2026-07.json`

```json
{
  "month": "2026-07",
  "sourceScans": ["scans/2026-07-activities-p1.jpg", "scans/2026-07-activities-p2.jpg"],
  "days": [
    {
      "date": "2026-07-08",
      "theme": "Nat'l Raspberry Day",
      "events": [
        {
          "start": "15:00",
          "end": null,
          "title": "Wine Down Wednesday — Music with Brian",
          "location": "Living Room",
          "dimension": "entertainment",
          "routine": false
        }
      ]
    }
  ]
}
```

- **`theme`** — the printed all-day theme for each date (optional).
- **`dimension`** — Magnolia's own category system from the printed "Dimensions of Wellness" legend, a fixed enum of ten: `physical, emotional, spiritual, move, learn, social, intellectual, entertainment, nutritional, connect` (nullable when unclassifiable). The printed color ticks are too small to read from a photo, so the AI assigns the dimension from the event title; corrections happen at review.
- **`routine`** — computed by the ingest script, not the AI: any event title appearing on 10+ days in the month is routine (Magnolia Gazette, Evening News, …). Overridable per event by editing the JSON.
- **Times** stored 24-hour. The printout omits am/pm; ingest infers it (7:00–11:59 = am; 12:00–6:59 = pm — facility programming runs ~9am–6pm). Any time outside those ranges is written as-is with an entry in the ingest `warnings` list so it gets human review.
- **Locations** stored expanded. Ingest maps the printed legend codes: AR → Activity Room, B → Bistro, BT → Bus Trip, FP → Front Portico, LR → Living Room. "AD" on the printout means All Day (a time marker, not a place) and maps to the day theme or an all-day event, never a location.
- **Multi-page months:** the printed calendar spans two pages; ingest accepts multiple photos and merges them into one month file, erroring on date overlaps.
- **Birthday lists** in the margins are ignored by the extractor.

### Menus — one file per week, named by its Monday, `content/menus/2026-07-06.json`

```json
{
  "weekOf": "2026-07-06",
  "sourceScan": "scans/2026-07-06-menu.jpg",
  "alwaysAvailable": ["garden salad", "soup of the day"],
  "days": [
    {
      "date": "2026-07-08",
      "breakfast": { "items": [{ "name": "French toast", "kind": "main" }] },
      "lunch":     { "items": [{ "name": "Fried catfish", "kind": "main" },
                                { "name": "Lemon icebox pie", "kind": "dessert" }] },
      "dinner":    { "items": [] }
    }
  ]
}
```

- Item `kind`: `main | side | dessert | drink` (drives the dessert highlight in the UI).
- **Open item:** the real printed menu hasn't been photographed yet. When it is, the format gets the same reality-check the calendar received; if meals offer per-meal choices, meal objects gain an `alternatives` field. Serving hours shown in the UI are configured constants until the printout says otherwise.

## Screens

Design language: magnolia-derived palette (petal ivory ground, leaf green-black ink, russet copper accent, moss secondary), serif display headings, large humanist body text. Each of the ten dimensions has a soft tint chip echoing the printed legend. Subtle page transitions (Framer Motion), `prefers-reduced-motion` respected. Dignified, not childish.

1. **`/` Home** — the daily screen. Big day name + date + italic copper day theme. Two controls with distinct shapes: copper **day pills** (Today / Tomorrow / This Week) and underlined **content tabs** (Activities | Meals) so meals are always one tap, never a scroll. Activities render as one chronological timeline where **specials stand out**: routine events are quiet one-line rows, specials are full cards with location + dimension chip. This Week shows each day's theme + specials with a muted "+ n daily routine items" count. The app remembers the last-used tab (localStorage).
2. **`/calendar`** — month grid on tablet/desktop mirroring the printed calendar's shape: day number, italic theme, that day's special events (routine items appear only in day detail). Filter chips for the ten dimensions; non-matching events fade rather than vanish. Today ringed in copper. Tapping a day opens full day detail. On phones the grid becomes a day-grouped agenda list. Prev/next month navigation across uploaded months.
3. **`/menu`** — week view with day tabs (defaulting to today), prev/next week navigation, meal cards with serving hours and dessert highlights, "always available" footer.
4. **Scan lightbox** — every screen links to "View the printed pages," showing the original photos. Trust anchor when something looks misread.

## Error handling

- **Ingest:** the script never writes silently-bad data. Zod validation rejects malformed AI output (dates outside the month, unparseable times, unknown dimensions) with a clear error. The extractor emits a `warnings` array for low-confidence readings ("couldn't read the 10:15 entry on July 22") so review targets the doubtful spots.
- **Build:** the same schemas run at build time; a bad hand-edit fails the Vercel build and the live site keeps serving the last good deploy. There is no runtime failure mode.
- **Missing data:** un-uploaded months/weeks (and "tomorrow" across an un-uploaded month boundary) show a friendly large-type message — "August's calendar hasn't been added yet" — never a crash or blank screen.

## Testing

Run with `npm test`:

1. **Unit tests** for pure logic: am/pm inference, routine detection, location-code expansion, today/tomorrow date math in America/New_York (month-boundary and midnight cases included).
2. **Schema/fixture tests:** the extracted JSON from the real July 2026 scans is committed as a fixture; schemas must accept it, and the ingest merge logic is tested against the two-page split.
3. **Playwright smoke tests:** each page loads; day pills, Activities/Meals tabs, and a calendar filter work.

## Deployment

GitHub repo `magnolia-companion` → Vercel (free tier), auto-deploy on push to `main`. One-time dashboard connection; no Vercel env vars, no secrets in the repo. Failed builds never replace the live site. Recurring cost: $0 hosting + pennies of Claude API per month (a few uploads/week, run locally).

## Out of scope (deliberately)

Accounts/auth, notifications, multi-facility support, in-browser upload/admin UI, editing content from the site, and any server-side runtime. The design keeps a growth path: the JSON data model and screens would survive a later move to approach A (database + phone upload) if publishing-from-the-Mac ever becomes a chore.
