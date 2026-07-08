# Magnolia Companion

Turns Magnolia Place of Roswell's printed activity calendars and weekly menus
into a browsable website for one resident and their family.
Static Next.js site; the git repo is the database. See
`docs/superpowers/specs/2026-07-08-magnolia-companion-design.md` for the full design.

## Publishing new content (the whole job)

1. Photograph the printed pages (well-lit, flat as possible). AirDrop them to this Mac.
2. `npm run ingest -- --type activities --month 2026-08 photo1.jpeg photo2.jpeg`
3. Read the warnings. `npm run dev` and compare the site to the paper; fix any
   misreads directly in `content/activities/2026-08.json`.
4. `git add -A && git commit -m "content: August 2026 activities" && git push`
5. Vercel rebuilds automatically (~1 min). A bad JSON edit fails the build and
   the live site keeps serving the previous version.

Menu ingest is not built yet — waiting on a photo of the real printed menu.
`content/menus/2026-07-06.json` is placeholder content.

## Commands

- `npm run dev` — local preview at http://localhost:3000
- `npm test` — unit tests (vitest)
- `npm run test:e2e` — Playwright smoke tests
- `npm run build` — production build (also validates all content JSON)
- `npm run ingest` — extract structured data from scan photos (needs `.env` with `ANTHROPIC_API_KEY`)

## Secrets

`ANTHROPIC_API_KEY` lives only in the local `.env` (git-ignored).
Vercel has **no** environment variables; the deployed site makes no API calls.
