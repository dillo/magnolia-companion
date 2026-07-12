# Magnolia Companion

Turns Magnolia Place of Roswell's printed activity calendars and weekly menus
into a browsable website for one resident and their family.
Static Next.js site; the git repo is the database. See
`docs/superpowers/specs/2026-07-08-magnolia-companion-design.md` for the full design.

## Publishing new content (the whole job)

1. Activities from Go Icon: `npm run ingest -- --type goicon-activities`
   This writes the current month and next month for Personal Care.
2. Fallback scanned activities: photograph the printed pages (well-lit, flat as possible), then run
   `npm run ingest -- --type activities --month 2026-08 photo1.jpeg photo2.jpeg`
3. Menus: `npm run ingest -- --type menu menu-photo.jpeg`
4. Read the warnings. `npm run dev` and compare the site to the source; fix any
   misreads directly in the generated `content/**/*.json`.
5. `git add -A && git commit -m "content: refresh activities" && git push`
6. Vercel rebuilds automatically (~1 min). A bad JSON edit fails the build and
   the live site keeps serving the previous version.

Menu files are named by the first visible date on the printed weekly menu.

## Commands

- `npm run dev` — local preview at http://localhost:3000
- `npm test` — unit tests (vitest)
- `npm run test:e2e` — Playwright smoke tests
- `npm run build` — production build (also validates all content JSON)
- `npm run ingest` — refresh content from Go Icon or extract structured data from scan photos

## Secrets

`ANTHROPIC_API_KEY` lives only in the local `.env` (git-ignored) and is only needed for photo ingest.
Vercel has **no** environment variables; the deployed site makes no API calls.
