# Magnolia Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Next.js site that turns photos of Magnolia Place of Roswell's printed activity calendars and menus into a browsable Today/Calendar/Menu experience, published by git push to Vercel.

**Architecture:** Git-as-database: JSON files in `content/` are the data store, validated by zod at ingest and at build; every page is statically generated, and "today" is computed client-side in America/New_York. A local CLI (`npm run ingest`) sends scan photos to the Claude API, post-processes the output deterministically (am/pm inference, location-code expansion, routine detection, multi-page merge), and writes the JSON.

**Tech Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript (strict) · zod · framer-motion · vitest (unit) · Playwright (e2e) · @anthropic-ai/sdk + tsx (local ingest CLI only)

**Spec:** `docs/superpowers/specs/2026-07-08-magnolia-companion-design.md`

## Global Constraints

- Node >= 20; Next.js 16, React 19, Tailwind CSS 4, TypeScript strict mode.
- No server-side runtime features (no API routes, no server actions, no DB). All pages statically generated.
- No Vercel environment variables. `ANTHROPIC_API_KEY` lives only in local `.env` (git-ignored).
- All content JSON validated with zod both at ingest time and at build time (build fails on invalid content).
- Timezone for all "today" logic: `America/New_York`, computed **client-side** (site only rebuilds on push).
- Dimensions enum, verbatim: `physical, emotional, spiritual, move, learn, social, intellectual, entertainment, nutritional, connect`.
- Routine rule: an event title appearing on **10 or more days** in a month is routine (`ROUTINE_MIN_DAYS = 10`).
- am/pm inference: printed hours 7–11 → am; 12 and 1–6 → pm; anything else is written as-is plus a warning.
- Location codes: AR → Activity Room, B → Bistro, BT → Bus Trip, FP → Front Portico, LR → Living Room. "AD" means All Day (a time marker, never a location). Birthday lists on scans are ignored.
- Senior-readable UI: root font-size ≥ 100% (17px base), no content text below 16px (small caps labels ≥ 13px), WCAG AA contrast, visible focus states, `prefers-reduced-motion` respected.
- Scan images live in `public/scans/`; JSON references them as `scans/<name>.jpg`.

## File Structure

```
magnolia-companion/
├── app/
│   ├── layout.tsx            # brand header, nav, text-size bootstrap
│   ├── template.tsx          # page-transition fade (reduced-motion aware)
│   ├── globals.css           # Tailwind 4 tokens (palette, fonts, text-size)
│   ├── page.tsx              # Home (server: load content, render HomeClient)
│   ├── calendar/page.tsx     # Calendar (server wrapper)
│   └── menu/page.tsx         # Menu (server wrapper)
├── components/
│   ├── TextSizeControl.tsx   # A / A+ / A++ toggle (localStorage)
│   ├── ScanLightbox.tsx      # "view the printed pages" overlay
│   ├── EmptyState.tsx        # friendly large-type missing-data message
│   ├── DimensionChip.tsx     # tinted category chip
│   ├── Timeline.tsx          # day's events: routine rows + special cards
│   ├── MealCards.tsx         # breakfast/lunch/dinner cards
│   ├── HomeClient.tsx        # day pills + Activities/Meals tabs + week views
│   ├── CalendarClient.tsx    # month grid, filters, agenda, day detail
│   └── MenuClient.tsx        # week nav + day tabs
├── lib/
│   ├── dates.ts              # ISO date math + formatting (pure)
│   ├── schema.ts             # zod schemas + types + DIMENSIONS
│   ├── dimensions.ts         # per-dimension label/colors
│   ├── lookup.ts             # pure find helpers (client-safe)
│   ├── content.ts            # fs loaders (server/build only)
│   └── ingest/
│       ├── postprocess.ts    # pure: inferTime24, expandLocation, merge, routine
│       └── extract.ts        # Claude API call + prompt + raw schema
├── scripts/ingest.ts         # CLI entry
├── content/
│   ├── activities/2026-07.json
│   └── menus/2026-07-06.json
├── public/scans/             # scan photos (committed)
├── tests/*.test.ts           # vitest
├── e2e/*.spec.ts             # Playwright
├── vitest.config.ts, playwright.config.ts
└── docs/superpowers/...      # spec + this plan
```

---

### Task 1: Project scaffold and tooling

**Files:**
- Create: entire Next.js scaffold at repo root (`app/`, `package.json`, `tsconfig.json`, …)
- Create: `vitest.config.ts`, `playwright.config.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `npm run dev`, `npm test` (vitest, `tests/**/*.test.ts`), `npm run test:e2e` (Playwright, `e2e/`), `npm run ingest`, import alias `@/*` → repo root.

- [x] **Step 1: Scaffold Next.js in the existing repo**

Run from `/Users/locutus/Dev/magnolia-companion`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --turbopack --yes
```

If it refuses because `docs/` exists: `mv docs /tmp/mc-docs`, rerun, then `mv /tmp/mc-docs/superpowers docs/superpowers`... (restore with `mv /tmp/mc-docs docs` if docs was fully moved). Verify `docs/superpowers/specs/` is back before continuing.

- [x] **Step 2: Install dependencies**

```bash
npm install zod framer-motion
npm install -D vitest tsx @playwright/test @anthropic-ai/sdk
npx playwright install chromium
```

- [x] **Step 3: Add scripts and configs**

In `package.json` `"scripts"`, add/replace:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run --passWithNoTests",
  "test:e2e": "playwright test",
  "ingest": "tsx --env-file=.env scripts/ingest.ts"
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(".") } },
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

Append to `.gitignore` if not already present: `.env`, `test-results/`, `playwright-report/`.

- [x] **Step 4: Verify toolchain**

Run: `npm test` → expected: `No test files found, exiting with code 0`.
Run: `npm run dev` briefly → expected: default Next.js page at http://localhost:3000, then stop it.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 + Tailwind 4 + vitest/playwright tooling"
```

---

### Task 2: Date utilities (`lib/dates.ts`)

**Files:**
- Create: `lib/dates.ts`
- Test: `tests/dates.test.ts`

**Interfaces:**
- Produces (all pure, ISO-string based; no Date objects leak out):
  - `todayISO(now?: Date, timeZone?: string): string` — `"YYYY-MM-DD"` in `America/New_York` by default
  - `addDaysISO(iso: string, n: number): string`
  - `mondayOfISO(iso: string): string`
  - `monthOfISO(iso: string): string` — `"YYYY-MM"`
  - `dayNameOfISO(iso: string): string` — `"Wednesday"`
  - `longDateOfISO(iso: string): string` — `"July 8, 2026"`
  - `monthNameOfISO(iso: string): string` — `"July"`
  - `formatTime(hhmm: string): string` — `"15:00"` → `"3:00"` (print style, no am/pm)

- [x] **Step 1: Write the failing tests**

Create `tests/dates.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  todayISO, addDaysISO, mondayOfISO, monthOfISO,
  dayNameOfISO, longDateOfISO, monthNameOfISO, formatTime,
} from "@/lib/dates";

describe("todayISO", () => {
  test("converts UTC instant to New York date", () => {
    // 2026-07-09 02:00 UTC is still 2026-07-08 22:00 in New York (EDT)
    expect(todayISO(new Date("2026-07-09T02:00:00Z"))).toBe("2026-07-08");
  });
  test("midnight rollover in New York", () => {
    expect(todayISO(new Date("2026-07-09T04:01:00Z"))).toBe("2026-07-09");
  });
});

describe("addDaysISO", () => {
  test("crosses month boundary", () => {
    expect(addDaysISO("2026-07-31", 1)).toBe("2026-08-01");
  });
  test("negative offsets", () => {
    expect(addDaysISO("2026-08-01", -1)).toBe("2026-07-31");
  });
});

describe("mondayOfISO", () => {
  test("Wednesday maps to its Monday", () => {
    expect(mondayOfISO("2026-07-08")).toBe("2026-07-06");
  });
  test("Sunday belongs to the preceding Monday's week", () => {
    expect(mondayOfISO("2026-07-12")).toBe("2026-07-06");
  });
  test("Monday maps to itself", () => {
    expect(mondayOfISO("2026-07-06")).toBe("2026-07-06");
  });
});

describe("formatting", () => {
  test("monthOfISO", () => expect(monthOfISO("2026-07-08")).toBe("2026-07"));
  test("dayNameOfISO", () => expect(dayNameOfISO("2026-07-08")).toBe("Wednesday"));
  test("longDateOfISO", () => expect(longDateOfISO("2026-07-08")).toBe("July 8, 2026"));
  test("monthNameOfISO", () => expect(monthNameOfISO("2026-08-01")).toBe("August"));
});

describe("formatTime", () => {
  test("pm hours drop to 12h clock", () => expect(formatTime("15:00")).toBe("3:00"));
  test("am hour keeps minutes", () => expect(formatTime("09:05")).toBe("9:05"));
  test("noon stays 12", () => expect(formatTime("12:30")).toBe("12:30"));
  test("midnight is 12", () => expect(formatTime("00:15")).toBe("12:15"));
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/dates'` (or equivalent).

- [x] **Step 3: Implement `lib/dates.ts`**

```ts
const DAY_MS = 86_400_000;

/** Anchor an ISO date at UTC noon so day math never crosses DST boundaries. */
function toUTCNoon(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

export function todayISO(now: Date = new Date(), timeZone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function addDaysISO(iso: string, n: number): string {
  return new Date(toUTCNoon(iso).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

export function mondayOfISO(iso: string): string {
  const dow = toUTCNoon(iso).getUTCDay(); // 0 = Sunday
  return addDaysISO(iso, dow === 0 ? -6 : 1 - dow);
}

export function monthOfISO(iso: string): string {
  return iso.slice(0, 7);
}

export function dayNameOfISO(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long" }).format(toUTCNoon(iso));
}

export function longDateOfISO(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: "long", day: "numeric", year: "numeric",
  }).format(toUTCNoon(iso));
}

export function monthNameOfISO(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long" }).format(toUTCNoon(iso));
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}`;
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test` → Expected: all `tests/dates.test.ts` tests PASS.

- [x] **Step 5: Commit**

```bash
git add lib/dates.ts tests/dates.test.ts
git commit -m "feat: pure date utilities with New York today logic"
```

---

### Task 3: Content schemas, dimension metadata, and fixtures

**Files:**
- Create: `lib/schema.ts`, `lib/dimensions.ts`
- Create: `content/activities/2026-07.json`, `content/menus/2026-07-06.json`
- Test: `tests/schema.test.ts`

**Interfaces:**
- Consumes: `addDaysISO` from `@/lib/dates`.
- Produces:
  - `DIMENSIONS: readonly ["physical","emotional","spiritual","move","learn","social","intellectual","entertainment","nutritional","connect"]`, `type Dimension`
  - `eventSchema`, `activityDaySchema`, `activityMonthSchema`; types `ActivityEvent`, `ActivityDay`, `ActivityMonth`
  - `MEAL_KINDS`, `mealItemSchema`, `mealSchema`, `menuDaySchema`, `menuWeekSchema`; types `MealItem`, `Meal`, `MenuDay`, `MenuWeek`
  - `DIMENSION_META: Record<Dimension, { label: string; bg: string; fg: string; dot: string }>`
- Event shape: `{ start: "HH:MM"|null, end: "HH:MM"|null, title: string, location: string|null, dimension: Dimension|null, routine: boolean }`

- [x] **Step 1: Write the failing tests**

Create `tests/schema.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { activityMonthSchema, menuWeekSchema } from "@/lib/schema";

function readJSON(rel: string) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
}

describe("activityMonthSchema", () => {
  test("accepts the committed July 2026 fixture", () => {
    const parsed = activityMonthSchema.parse(readJSON("content/activities/2026-07.json"));
    expect(parsed.month).toBe("2026-07");
    expect(parsed.days.length).toBeGreaterThanOrEqual(7);
  });
  test("rejects a day outside the month", () => {
    const bad = {
      month: "2026-07",
      sourceScans: ["scans/x.jpg"],
      days: [{ date: "2026-08-01", theme: null, events: [] }],
    };
    expect(() => activityMonthSchema.parse(bad)).toThrow(/outside month/);
  });
  test("rejects duplicate days", () => {
    const day = { date: "2026-07-08", theme: null, events: [] };
    const bad = { month: "2026-07", sourceScans: ["scans/x.jpg"], days: [day, day] };
    expect(() => activityMonthSchema.parse(bad)).toThrow(/duplicate day/);
  });
  test("rejects a bad time format", () => {
    const bad = {
      month: "2026-07", sourceScans: ["scans/x.jpg"],
      days: [{ date: "2026-07-08", theme: null, events: [
        { start: "25:00", end: null, title: "Bingo", location: null, dimension: null, routine: false },
      ]}],
    };
    expect(() => activityMonthSchema.parse(bad)).toThrow();
  });
  test("rejects an unknown dimension", () => {
    const bad = {
      month: "2026-07", sourceScans: ["scans/x.jpg"],
      days: [{ date: "2026-07-08", theme: null, events: [
        { start: "09:00", end: null, title: "Bingo", location: null, dimension: "fun", routine: false },
      ]}],
    };
    expect(() => activityMonthSchema.parse(bad)).toThrow();
  });
});

describe("menuWeekSchema", () => {
  test("accepts the committed menu fixture", () => {
    const parsed = menuWeekSchema.parse(readJSON("content/menus/2026-07-06.json"));
    expect(parsed.weekOf).toBe("2026-07-06");
    expect(parsed.days).toHaveLength(7);
  });
  test("rejects a weekOf that is not a Monday", () => {
    const bad = { weekOf: "2026-07-07", sourceScan: null, alwaysAvailable: [], days: [
      { date: "2026-07-07", breakfast: { items: [] }, lunch: { items: [] }, dinner: { items: [] } },
    ]};
    expect(() => menuWeekSchema.parse(bad)).toThrow(/not a Monday/);
  });
  test("rejects a day outside the week", () => {
    const bad = { weekOf: "2026-07-06", sourceScan: null, alwaysAvailable: [], days: [
      { date: "2026-07-14", breakfast: { items: [] }, lunch: { items: [] }, dinner: { items: [] } },
    ]};
    expect(() => menuWeekSchema.parse(bad)).toThrow(/outside week/);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test` → Expected: FAIL — `Cannot find module '@/lib/schema'`.

- [x] **Step 3: Implement `lib/schema.ts`**

```ts
import { z } from "zod";
import { addDaysISO } from "./dates";

export const DIMENSIONS = [
  "physical", "emotional", "spiritual", "move", "learn",
  "social", "intellectual", "entertainment", "nutritional", "connect",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const time24 = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "expected HH:MM 24h");

export const eventSchema = z.object({
  start: time24.nullable(),
  end: time24.nullable(),
  title: z.string().min(1),
  location: z.string().min(1).nullable(),
  dimension: z.enum(DIMENSIONS).nullable(),
  routine: z.boolean(),
});
export type ActivityEvent = z.infer<typeof eventSchema>;

export const activityDaySchema = z.object({
  date: isoDate,
  theme: z.string().min(1).nullable(),
  events: z.array(eventSchema),
});
export type ActivityDay = z.infer<typeof activityDaySchema>;

export const activityMonthSchema = z
  .object({
    month: z.string().regex(/^\d{4}-\d{2}$/, "expected YYYY-MM"),
    sourceScans: z.array(z.string().min(1)).min(1),
    days: z.array(activityDaySchema),
  })
  .superRefine((m, ctx) => {
    const seen = new Set<string>();
    for (const d of m.days) {
      if (!d.date.startsWith(`${m.month}-`)) {
        ctx.addIssue({ code: "custom", message: `day ${d.date} outside month ${m.month}` });
      }
      if (seen.has(d.date)) {
        ctx.addIssue({ code: "custom", message: `duplicate day ${d.date}` });
      }
      seen.add(d.date);
    }
  });
export type ActivityMonth = z.infer<typeof activityMonthSchema>;

export const MEAL_KINDS = ["main", "side", "dessert", "drink"] as const;
export const mealItemSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(MEAL_KINDS),
});
export type MealItem = z.infer<typeof mealItemSchema>;

export const mealSchema = z.object({ items: z.array(mealItemSchema) });
export type Meal = z.infer<typeof mealSchema>;

export const menuDaySchema = z.object({
  date: isoDate,
  breakfast: mealSchema,
  lunch: mealSchema,
  dinner: mealSchema,
});
export type MenuDay = z.infer<typeof menuDaySchema>;

export const menuWeekSchema = z
  .object({
    weekOf: isoDate,
    sourceScan: z.string().min(1).nullable(),
    alwaysAvailable: z.array(z.string().min(1)),
    days: z.array(menuDaySchema).min(1).max(7),
  })
  .superRefine((w, ctx) => {
    if (new Date(`${w.weekOf}T12:00:00Z`).getUTCDay() !== 1) {
      ctx.addIssue({ code: "custom", message: `weekOf ${w.weekOf} is not a Monday` });
    }
    const end = addDaysISO(w.weekOf, 6);
    const seen = new Set<string>();
    for (const d of w.days) {
      if (d.date < w.weekOf || d.date > end) {
        ctx.addIssue({ code: "custom", message: `day ${d.date} outside week of ${w.weekOf}` });
      }
      if (seen.has(d.date)) {
        ctx.addIssue({ code: "custom", message: `duplicate day ${d.date}` });
      }
      seen.add(d.date);
    }
  });
export type MenuWeek = z.infer<typeof menuWeekSchema>;
```

- [x] **Step 4: Implement `lib/dimensions.ts`**

```ts
import type { Dimension } from "./schema";

/** Soft tint (bg), AA-contrast text (fg), and calendar dot color per dimension. */
export const DIMENSION_META: Record<Dimension, { label: string; bg: string; fg: string; dot: string }> = {
  physical:      { label: "Physical",      bg: "#D9E5F1", fg: "#2B4E75", dot: "#4A7FB5" },
  emotional:     { label: "Emotional",     bg: "#F4DBD8", fg: "#8A3128", dot: "#C25B50" },
  spiritual:     { label: "Spiritual",     bg: "#E0E5EF", fg: "#37476B", dot: "#6C7FB5" },
  move:          { label: "Move",          bg: "#DCE8D2", fg: "#2F4A24", dot: "#5C8A47" },
  learn:         { label: "Learn",         bg: "#F4E3CE", fg: "#7A4A16", dot: "#C8823B" },
  social:        { label: "Social",        bg: "#F2DEE8", fg: "#813458", dot: "#C06A97" },
  intellectual:  { label: "Intellectual",  bg: "#E2E1F4", fg: "#3F3A75", dot: "#7A74C4" },
  entertainment: { label: "Entertainment", bg: "#EADDF0", fg: "#5D3372", dot: "#9B62B8" },
  nutritional:   { label: "Nutritional",   bg: "#F1E9C6", fg: "#6A5A14", dot: "#BFA93C" },
  connect:       { label: "Connect",       bg: "#D7E9E3", fg: "#1F5D4A", dot: "#3E8A6E" },
};
```

- [x] **Step 5: Commit the July 2026 activities fixture**

Create `content/activities/2026-07.json`. This is a **hand-transcribed** week (July 6–12) from the real printout — enough for tests and UI development. The full month arrives in Task 11 when the ingest CLI runs against the real photos and replaces this file (`routine` flags below are hand-set; the CLI computes them).

```json
{
  "month": "2026-07",
  "sourceScans": ["scans/2026-07-activities-p1.jpg", "scans/2026-07-activities-p2.jpg"],
  "days": [
    { "date": "2026-07-06", "theme": "Let's Talk Lemonade Day", "events": [
      { "start": "09:00", "end": null, "title": "Magnolia Gazette", "location": "Living Room", "dimension": "learn", "routine": true },
      { "start": "10:15", "end": null, "title": "Silver Sneaker Exercise", "location": "Living Room", "dimension": "physical", "routine": true },
      { "start": "10:30", "end": null, "title": "Newspaper Reading", "location": "Living Room", "dimension": "learn", "routine": false },
      { "start": "10:45", "end": null, "title": "Lemonade Tasting", "location": "Living Room", "dimension": "nutritional", "routine": false },
      { "start": "11:00", "end": null, "title": "Spintopia Challenge", "location": "Living Room", "dimension": "intellectual", "routine": true },
      { "start": "13:30", "end": null, "title": "Tabletop Board Games & Beads", "location": "Bistro", "dimension": "intellectual", "routine": false },
      { "start": "15:00", "end": null, "title": "Afternoon Walk", "location": null, "dimension": "move", "routine": false },
      { "start": "16:00", "end": null, "title": "Brain Games", "location": "Activity Room", "dimension": "intellectual", "routine": false },
      { "start": "18:00", "end": null, "title": "Evening News", "location": "Living Room", "dimension": "learn", "routine": true }
    ]},
    { "date": "2026-07-07", "theme": "Nat'l Strawberry Sundae Day", "events": [
      { "start": "09:00", "end": null, "title": "Magnolia Gazette", "location": "Living Room", "dimension": "learn", "routine": true },
      { "start": "09:30", "end": null, "title": "Daily Chronicles & Current Events", "location": "Living Room", "dimension": "intellectual", "routine": true },
      { "start": "10:15", "end": null, "title": "Silver Sneaker Exercise", "location": "Living Room", "dimension": "physical", "routine": true },
      { "start": "11:00", "end": null, "title": "Lunch Outing at AJ's Southern Home Cooking", "location": "Bus Trip", "dimension": "social", "routine": false },
      { "start": "13:30", "end": null, "title": "Afternoon Spa and Mimosas", "location": "Living Room", "dimension": "emotional", "routine": false },
      { "start": "16:00", "end": null, "title": "Pub Trivia", "location": "Bistro", "dimension": "intellectual", "routine": false },
      { "start": "17:00", "end": null, "title": "Movie Night", "location": "Living Room", "dimension": "entertainment", "routine": false },
      { "start": "18:00", "end": null, "title": "Evening News", "location": "Living Room", "dimension": "learn", "routine": true }
    ]},
    { "date": "2026-07-08", "theme": "Nat'l Raspberry Day", "events": [
      { "start": "09:00", "end": null, "title": "Magnolia Gazette", "location": "Living Room", "dimension": "learn", "routine": true },
      { "start": "09:30", "end": null, "title": "Daily Chronicles & Current Events", "location": "Living Room", "dimension": "intellectual", "routine": true },
      { "start": "10:15", "end": null, "title": "Chair Yoga Exercises", "location": "Living Room", "dimension": "move", "routine": false },
      { "start": "11:00", "end": null, "title": "Spintopia Challenge", "location": "Living Room", "dimension": "intellectual", "routine": true },
      { "start": "13:00", "end": null, "title": "Prize Bingo", "location": "Bistro", "dimension": "entertainment", "routine": false },
      { "start": "15:00", "end": null, "title": "Wine Down Wednesday — Music with Brian", "location": "Living Room", "dimension": "entertainment", "routine": false },
      { "start": "17:00", "end": null, "title": "Brain Teasers & Word Search", "location": "Bistro", "dimension": "intellectual", "routine": true },
      { "start": "18:00", "end": null, "title": "Evening News", "location": "Living Room", "dimension": "learn", "routine": true }
    ]},
    { "date": "2026-07-09", "theme": "Nat'l Dimples Day", "events": [
      { "start": "09:00", "end": null, "title": "Magnolia Gazette", "location": "Living Room", "dimension": "learn", "routine": true },
      { "start": "09:30", "end": null, "title": "Daily Chronicles & Current Events", "location": "Living Room", "dimension": "intellectual", "routine": true },
      { "start": "10:15", "end": null, "title": "Silver Sneaker Exercise", "location": "Living Room", "dimension": "physical", "routine": true },
      { "start": "13:00", "end": null, "title": "Kroger Shopping", "location": "Bus Trip", "dimension": "social", "routine": false },
      { "start": "15:00", "end": null, "title": "Travel the Globe Documentaries", "location": "Living Room", "dimension": "learn", "routine": false },
      { "start": "18:00", "end": null, "title": "Evening News", "location": "Living Room", "dimension": "learn", "routine": true }
    ]},
    { "date": "2026-07-10", "theme": "Classic Car Collection Day", "events": [
      { "start": "09:00", "end": null, "title": "Magnolia Gazette", "location": "Living Room", "dimension": "learn", "routine": true },
      { "start": "09:30", "end": null, "title": "Daily Chronicles & Current Events", "location": "Living Room", "dimension": "intellectual", "routine": true },
      { "start": "10:15", "end": null, "title": "Age in Motion Exercise with Powerback", "location": "Living Room", "dimension": "physical", "routine": false },
      { "start": "13:00", "end": null, "title": "Therapy Dog Visit with Canine Assistants", "location": "Living Room", "dimension": "emotional", "routine": false },
      { "start": "15:00", "end": null, "title": "Entertainment in the Lobby", "location": "Living Room", "dimension": "entertainment", "routine": false },
      { "start": "18:00", "end": null, "title": "Evening News", "location": "Living Room", "dimension": "learn", "routine": true }
    ]},
    { "date": "2026-07-11", "theme": "Nat'l Blueberry Muffin Day", "events": [
      { "start": "09:00", "end": null, "title": "Magnolia Gazette", "location": "Living Room", "dimension": "learn", "routine": true },
      { "start": "09:30", "end": null, "title": "Daily Chronicles & Current Events", "location": "Living Room", "dimension": "intellectual", "routine": true },
      { "start": "12:00", "end": null, "title": "Sports Saturday", "location": "Living Room", "dimension": "move", "routine": false },
      { "start": "17:00", "end": null, "title": "Movie & Munchies", "location": "Living Room", "dimension": "entertainment", "routine": false },
      { "start": "18:00", "end": null, "title": "Evening News", "location": "Living Room", "dimension": "learn", "routine": true }
    ]},
    { "date": "2026-07-12", "theme": "Paper Bag Day", "events": [
      { "start": "09:00", "end": null, "title": "Magnolia Gazette", "location": "Living Room", "dimension": "learn", "routine": true },
      { "start": "09:30", "end": null, "title": "Daily Chronicles & Current Events", "location": "Living Room", "dimension": "intellectual", "routine": true },
      { "start": "10:00", "end": null, "title": "Daily Devotions Reading", "location": "Living Room", "dimension": "spiritual", "routine": false },
      { "start": "10:15", "end": null, "title": "Sunday Morning Exercise", "location": "Living Room", "dimension": "physical", "routine": false },
      { "start": "13:00", "end": null, "title": "Prize Bingo", "location": "Bistro", "dimension": "entertainment", "routine": false },
      { "start": "14:00", "end": null, "title": "Church Services", "location": "Living Room", "dimension": "spiritual", "routine": false },
      { "start": "16:00", "end": null, "title": "Afternoon Meditation", "location": "Living Room", "dimension": "spiritual", "routine": false },
      { "start": "18:00", "end": null, "title": "Evening News", "location": "Living Room", "dimension": "learn", "routine": true }
    ]}
  ]
}
```

- [x] **Step 6: Commit the placeholder menu fixture**

Create `content/menus/2026-07-06.json` — **placeholder content** (the real printed menu hasn't been photographed yet; see spec open item). `sourceScan` is null until then.

```json
{
  "weekOf": "2026-07-06",
  "sourceScan": null,
  "alwaysAvailable": ["garden salad", "soup of the day", "fresh fruit", "vanilla or chocolate ice cream"],
  "days": [
    { "date": "2026-07-06",
      "breakfast": { "items": [ { "name": "Buttermilk pancakes", "kind": "main" }, { "name": "Sausage links", "kind": "side" }, { "name": "Chilled peaches", "kind": "side" } ] },
      "lunch": { "items": [ { "name": "Chicken & dumplings", "kind": "main" }, { "name": "Green beans", "kind": "side" }, { "name": "Buttered corn", "kind": "side" }, { "name": "Banana pudding", "kind": "dessert" } ] },
      "dinner": { "items": [ { "name": "Vegetable soup", "kind": "main" }, { "name": "Ham & cheese sandwich", "kind": "main" }, { "name": "Coleslaw", "kind": "side" }, { "name": "Sugar cookie", "kind": "dessert" } ] } },
    { "date": "2026-07-07",
      "breakfast": { "items": [ { "name": "Scrambled eggs", "kind": "main" }, { "name": "Bacon", "kind": "side" }, { "name": "Buttered grits", "kind": "side" }, { "name": "Biscuit", "kind": "side" } ] },
      "lunch": { "items": [ { "name": "Meatloaf with gravy", "kind": "main" }, { "name": "Mashed potatoes", "kind": "side" }, { "name": "Collard greens", "kind": "side" }, { "name": "Peach cobbler", "kind": "dessert" } ] },
      "dinner": { "items": [ { "name": "Chicken salad croissant", "kind": "main" }, { "name": "Tomato bisque", "kind": "side" }, { "name": "Fruit cup", "kind": "dessert" } ] } },
    { "date": "2026-07-08",
      "breakfast": { "items": [ { "name": "French toast with syrup", "kind": "main" }, { "name": "Sausage patty", "kind": "side" }, { "name": "Fresh melon", "kind": "side" } ] },
      "lunch": { "items": [ { "name": "Fried catfish", "kind": "main" }, { "name": "Hush puppies", "kind": "side" }, { "name": "Butter beans", "kind": "side" }, { "name": "Lemon icebox pie", "kind": "dessert" } ] },
      "dinner": { "items": [ { "name": "Baked ziti", "kind": "main" }, { "name": "Garden salad", "kind": "side" }, { "name": "Garlic bread", "kind": "side" }, { "name": "Vanilla pudding", "kind": "dessert" } ] } },
    { "date": "2026-07-09",
      "breakfast": { "items": [ { "name": "Oatmeal with brown sugar", "kind": "main" }, { "name": "Boiled egg", "kind": "side" }, { "name": "Cinnamon toast", "kind": "side" } ] },
      "lunch": { "items": [ { "name": "Pot roast", "kind": "main" }, { "name": "Roasted carrots", "kind": "side" }, { "name": "Mac & cheese", "kind": "side" }, { "name": "Strawberry shortcake", "kind": "dessert" } ] },
      "dinner": { "items": [ { "name": "Turkey club", "kind": "main" }, { "name": "Potato salad", "kind": "side" }, { "name": "Watermelon", "kind": "dessert" } ] } },
    { "date": "2026-07-10",
      "breakfast": { "items": [ { "name": "Biscuits & gravy", "kind": "main" }, { "name": "Scrambled eggs", "kind": "side" }, { "name": "Orange slices", "kind": "side" } ] },
      "lunch": { "items": [ { "name": "Fried chicken", "kind": "main" }, { "name": "Mashed potatoes & gravy", "kind": "side" }, { "name": "Okra & tomatoes", "kind": "side" }, { "name": "Chocolate cake", "kind": "dessert" } ] },
      "dinner": { "items": [ { "name": "Shrimp & grits", "kind": "main" }, { "name": "Side salad", "kind": "side" }, { "name": "Dinner roll", "kind": "side" }, { "name": "Lemon sherbet", "kind": "dessert" } ] } },
    { "date": "2026-07-11",
      "breakfast": { "items": [ { "name": "Waffles with strawberries", "kind": "main" }, { "name": "Bacon", "kind": "side" }, { "name": "Yogurt", "kind": "side" } ] },
      "lunch": { "items": [ { "name": "BBQ pulled pork", "kind": "main" }, { "name": "Baked beans", "kind": "side" }, { "name": "Coleslaw", "kind": "side" }, { "name": "Cornbread", "kind": "side" }, { "name": "Banana pudding", "kind": "dessert" } ] },
      "dinner": { "items": [ { "name": "Chicken pot pie", "kind": "main" }, { "name": "Steamed broccoli", "kind": "side" }, { "name": "Apple crisp", "kind": "dessert" } ] } },
    { "date": "2026-07-12",
      "breakfast": { "items": [ { "name": "Cheese omelet", "kind": "main" }, { "name": "Ham slice", "kind": "side" }, { "name": "Biscuit with jelly", "kind": "side" } ] },
      "lunch": { "items": [ { "name": "Roast turkey", "kind": "main" }, { "name": "Cornbread dressing", "kind": "side" }, { "name": "Sweet potato casserole", "kind": "side" }, { "name": "Pecan pie", "kind": "dessert" } ] },
      "dinner": { "items": [ { "name": "Tomato soup", "kind": "main" }, { "name": "Grilled cheese", "kind": "main" }, { "name": "Pear halves", "kind": "dessert" } ] } }
  ]
}
```

- [x] **Step 7: Run tests to verify they pass**

Run: `npm test` → Expected: all `tests/schema.test.ts` tests PASS (fixtures parse; bad inputs throw).

- [x] **Step 8: Commit**

```bash
git add lib/schema.ts lib/dimensions.ts content/ tests/schema.test.ts
git commit -m "feat: zod content schemas, dimension metadata, July 2026 fixtures"
```

---

### Task 4: Ingest post-processing (pure functions)

**Files:**
- Create: `lib/ingest/postprocess.ts`
- Test: `tests/postprocess.test.ts`

**Interfaces:**
- Consumes: `DIMENSIONS`, `activityMonthSchema`, types from `@/lib/schema`.
- Produces:
  - `type RawEvent = { time: string | null; title: string; locationCode: string | null; dimension: string | null }`
  - `type RawDay = { date: string; theme: string | null; events: RawEvent[] }`
  - `LOCATION_CODES: Record<string, string>`, `ROUTINE_MIN_DAYS = 10`
  - `inferTime24(time: string | null, ctx: string, warnings: string[]): string | null`
  - `expandLocation(code: string | null, ctx: string, warnings: string[]): string | null`
  - `mergePages(pages: RawDay[][]): RawDay[]` — throws on duplicate dates
  - `routineTitles(days: RawDay[]): Set<string>` — lowercase titles on ≥ 10 distinct days
  - `buildActivityMonth(month: string, sourceScans: string[], pages: RawDay[][]): { data: ActivityMonth; warnings: string[] }`

- [x] **Step 1: Write the failing tests**

Create `tests/postprocess.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  inferTime24, expandLocation, mergePages, routineTitles,
  buildActivityMonth, ROUTINE_MIN_DAYS, type RawDay,
} from "@/lib/ingest/postprocess";

describe("inferTime24", () => {
  test("morning hours 7–11 stay am", () => {
    const w: string[] = [];
    expect(inferTime24("9:00", "ctx", w)).toBe("09:00");
    expect(inferTime24("11:45", "ctx", w)).toBe("11:45");
    expect(w).toEqual([]);
  });
  test("hours 1–6 become pm", () => {
    const w: string[] = [];
    expect(inferTime24("1:30", "ctx", w)).toBe("13:30");
    expect(inferTime24("6:00", "ctx", w)).toBe("18:00");
    expect(w).toEqual([]);
  });
  test("noon stays 12", () => {
    const w: string[] = [];
    expect(inferTime24("12:00", "ctx", w)).toBe("12:00");
    expect(w).toEqual([]);
  });
  test("null passes through (all-day)", () => {
    const w: string[] = [];
    expect(inferTime24(null, "ctx", w)).toBeNull();
  });
  test("out-of-range hour warns but is kept", () => {
    const w: string[] = [];
    expect(inferTime24("19:00", "2026-07-22 \"X\"", w)).toBe("19:00");
    expect(w).toHaveLength(1);
    expect(w[0]).toMatch(/outside expected/);
  });
  test("garbage warns and returns null", () => {
    const w: string[] = [];
    expect(inferTime24("??", "ctx", w)).toBeNull();
    expect(w[0]).toMatch(/unreadable time/);
  });
});

describe("expandLocation", () => {
  test("expands known codes", () => {
    const w: string[] = [];
    expect(expandLocation("LR", "ctx", w)).toBe("Living Room");
    expect(expandLocation("bt", "ctx", w)).toBe("Bus Trip");
    expect(w).toEqual([]);
  });
  test("null passes through", () => {
    expect(expandLocation(null, "ctx", [])).toBeNull();
  });
  test("unknown code warns and is kept verbatim", () => {
    const w: string[] = [];
    expect(expandLocation("ZZ", "ctx", w)).toBe("ZZ");
    expect(w[0]).toMatch(/unknown location code/);
  });
});

function day(date: string, titles: string[]): RawDay {
  return { date, theme: null, events: titles.map((t) => ({ time: "9:00", title: t, locationCode: "LR", dimension: "learn" })) };
}

describe("mergePages", () => {
  test("merges and sorts pages", () => {
    const merged = mergePages([[day("2026-07-19", ["b"])], [day("2026-07-01", ["a"])]]);
    expect(merged.map((d) => d.date)).toEqual(["2026-07-01", "2026-07-19"]);
  });
  test("throws on duplicate dates across pages", () => {
    expect(() => mergePages([[day("2026-07-01", ["a"])], [day("2026-07-01", ["b"])]]))
      .toThrow(/duplicate date/);
  });
});

describe("routineTitles", () => {
  test("titles on 10+ distinct days are routine, case-insensitive", () => {
    const days: RawDay[] = [];
    for (let i = 1; i <= ROUTINE_MIN_DAYS; i++) {
      days.push(day(`2026-07-${String(i).padStart(2, "0")}`, [i % 2 ? "Evening News" : "EVENING NEWS", "One-off " + i]));
    }
    const routine = routineTitles(days);
    expect(routine.has("evening news")).toBe(true);
    expect(routine.has("one-off 1")).toBe(false);
  });
});

describe("buildActivityMonth", () => {
  test("assembles a valid month with inferred times, locations, routine flags", () => {
    const pages: RawDay[][] = [[]];
    for (let i = 1; i <= 12; i++) {
      pages[0].push({
        date: `2026-07-${String(i).padStart(2, "0")}`,
        theme: i === 8 ? "Nat'l Raspberry Day" : null,
        events: [
          { time: "9:00", title: "Magnolia Gazette", locationCode: "LR", dimension: "learn" },
          ...(i === 8 ? [{ time: "3:00", title: "Wine Down Wednesday", locationCode: "LR", dimension: "entertainment" }] : []),
        ],
      });
    }
    const { data, warnings } = buildActivityMonth("2026-07", ["scans/p1.jpg"], pages);
    expect(warnings).toEqual([]);
    const jul8 = data.days.find((d) => d.date === "2026-07-08")!;
    expect(jul8.theme).toBe("Nat'l Raspberry Day");
    const gazette = jul8.events.find((e) => e.title === "Magnolia Gazette")!;
    expect(gazette).toMatchObject({ start: "09:00", location: "Living Room", routine: true });
    const wine = jul8.events.find((e) => e.title === "Wine Down Wednesday")!;
    expect(wine).toMatchObject({ start: "15:00", dimension: "entertainment", routine: false });
  });
  test("unknown dimension becomes null with a warning", () => {
    const pages: RawDay[][] = [[{
      date: "2026-07-08", theme: null,
      events: [{ time: "9:00", title: "Mystery", locationCode: null, dimension: "fun" }],
    }]];
    const { data, warnings } = buildActivityMonth("2026-07", ["scans/p1.jpg"], pages);
    expect(data.days[0].events[0].dimension).toBeNull();
    expect(warnings[0]).toMatch(/unknown dimension "fun"/);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test` → Expected: FAIL — `Cannot find module '@/lib/ingest/postprocess'`.

- [x] **Step 3: Implement `lib/ingest/postprocess.ts`**

```ts
import { DIMENSIONS, activityMonthSchema, type ActivityMonth, type Dimension } from "@/lib/schema";

export type RawEvent = {
  time: string | null;
  title: string;
  locationCode: string | null;
  dimension: string | null;
};
export type RawDay = { date: string; theme: string | null; events: RawEvent[] };

export const LOCATION_CODES: Record<string, string> = {
  AR: "Activity Room",
  B: "Bistro",
  BT: "Bus Trip",
  FP: "Front Portico",
  LR: "Living Room",
};

export const ROUTINE_MIN_DAYS = 10;

export function inferTime24(time: string | null, ctx: string, warnings: string[]): string | null {
  if (time === null) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) {
    warnings.push(`${ctx}: unreadable time "${time}"`);
    return null;
  }
  let h = Number(m[1]);
  if (h >= 7 && h <= 11) {
    // morning, keep as-is
  } else if (h >= 1 && h <= 6) {
    h += 12;
  } else if (h !== 12) {
    warnings.push(`${ctx}: time "${time}" outside expected 7:00–11:59 am / 12:00–6:59 pm range`);
  }
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

export function expandLocation(code: string | null, ctx: string, warnings: string[]): string | null {
  if (code === null) return null;
  const expanded = LOCATION_CODES[code.toUpperCase()];
  if (!expanded) {
    warnings.push(`${ctx}: unknown location code "${code}"`);
    return code;
  }
  return expanded;
}

export function mergePages(pages: RawDay[][]): RawDay[] {
  const byDate = new Map<string, RawDay>();
  for (const page of pages) {
    for (const d of page) {
      if (byDate.has(d.date)) throw new Error(`duplicate date across pages: ${d.date}`);
      byDate.set(d.date, d);
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function routineTitles(days: RawDay[]): Set<string> {
  const datesByTitle = new Map<string, Set<string>>();
  for (const d of days) {
    for (const e of d.events) {
      const key = e.title.trim().toLowerCase();
      let dates = datesByTitle.get(key);
      if (!dates) {
        dates = new Set();
        datesByTitle.set(key, dates);
      }
      dates.add(d.date);
    }
  }
  return new Set(
    [...datesByTitle].filter(([, dates]) => dates.size >= ROUTINE_MIN_DAYS).map(([title]) => title),
  );
}

export function buildActivityMonth(
  month: string,
  sourceScans: string[],
  pages: RawDay[][],
): { data: ActivityMonth; warnings: string[] } {
  const warnings: string[] = [];
  const days = mergePages(pages);
  const routine = routineTitles(days);
  const data = activityMonthSchema.parse({
    month,
    sourceScans,
    days: days.map((d) => ({
      date: d.date,
      theme: d.theme,
      events: d.events.map((e) => {
        const ctx = `${d.date} "${e.title}"`;
        const isDim = e.dimension !== null && (DIMENSIONS as readonly string[]).includes(e.dimension);
        if (e.dimension !== null && !isDim) warnings.push(`${ctx}: unknown dimension "${e.dimension}"`);
        return {
          start: inferTime24(e.time, ctx, warnings),
          end: null,
          title: e.title.trim(),
          location: expandLocation(e.locationCode, ctx, warnings),
          dimension: isDim ? (e.dimension as Dimension) : null,
          routine: routine.has(e.title.trim().toLowerCase()),
        };
      }),
    })),
  });
  return { data, warnings };
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test` → Expected: all `tests/postprocess.test.ts` tests PASS.

- [x] **Step 5: Commit**

```bash
git add lib/ingest/postprocess.ts tests/postprocess.test.ts
git commit -m "feat: deterministic ingest post-processing (times, locations, routine, merge)"
```

---

### Task 5: Content loaders and lookup helpers

**Files:**
- Create: `lib/content.ts` (fs, server/build only), `lib/lookup.ts` (pure, client-safe)
- Test: `tests/lookup.test.ts`

**Interfaces:**
- Consumes: schemas/types from `@/lib/schema`, `mondayOfISO` from `@/lib/dates`.
- Produces:
  - `loadActivityMonths(): ActivityMonth[]` — parses every `content/activities/*.json`, sorted by month ascending; **throws** on invalid content (this is the build-time validation gate)
  - `loadMenuWeeks(): MenuWeek[]` — same for `content/menus/*.json`, sorted by `weekOf`
  - `findActivityDay(months: ActivityMonth[], date: string): ActivityDay | null`
  - `findMenuDay(weeks: MenuWeek[], date: string): MenuDay | null`
  - `menuWeekFor(weeks: MenuWeek[], date: string): MenuWeek | null`
  - `scansForDate(months: ActivityMonth[], date: string): string[]` — sourceScans of the month containing `date`, else `[]`

- [x] **Step 1: Write the failing tests**

Create `tests/lookup.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { loadActivityMonths, loadMenuWeeks } from "@/lib/content";
import { findActivityDay, findMenuDay, menuWeekFor, scansForDate } from "@/lib/lookup";

const months = loadActivityMonths();
const weeks = loadMenuWeeks();

describe("loaders", () => {
  test("loads and validates committed fixtures", () => {
    expect(months.length).toBeGreaterThanOrEqual(1);
    expect(months[0].month).toBe("2026-07");
    expect(weeks[0].weekOf).toBe("2026-07-06");
  });
});

describe("lookup", () => {
  test("findActivityDay hits a fixture day", () => {
    expect(findActivityDay(months, "2026-07-08")?.theme).toBe("Nat'l Raspberry Day");
  });
  test("findActivityDay misses unknown dates", () => {
    expect(findActivityDay(months, "2026-09-01")).toBeNull();
  });
  test("findMenuDay hits and misses", () => {
    expect(findMenuDay(weeks, "2026-07-08")?.lunch.items[0].name).toBe("Fried catfish");
    expect(findMenuDay(weeks, "2026-08-01")).toBeNull();
  });
  test("menuWeekFor maps any weekday to its Monday week", () => {
    expect(menuWeekFor(weeks, "2026-07-12")?.weekOf).toBe("2026-07-06");
    expect(menuWeekFor(weeks, "2026-07-14")).toBeNull();
  });
  test("scansForDate returns the month's scans", () => {
    expect(scansForDate(months, "2026-07-08")).toEqual([
      "scans/2026-07-activities-p1.jpg",
      "scans/2026-07-activities-p2.jpg",
    ]);
    expect(scansForDate(months, "2026-09-01")).toEqual([]);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test` → Expected: FAIL — `Cannot find module '@/lib/content'`.

- [x] **Step 3: Implement `lib/content.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import {
  activityMonthSchema, menuWeekSchema,
  type ActivityMonth, type MenuWeek,
} from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readDir<T>(sub: string, parse: (raw: unknown, file: string) => T): T[] {
  const dir = path.join(CONTENT_DIR, sub);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => parse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), f));
}

/** Throws on invalid JSON/schema — failing the build is the point. */
export function loadActivityMonths(): ActivityMonth[] {
  return readDir("activities", (raw, file) => {
    try {
      return activityMonthSchema.parse(raw);
    } catch (err) {
      throw new Error(`content/activities/${file}: ${err instanceof Error ? err.message : err}`);
    }
  }).sort((a, b) => a.month.localeCompare(b.month));
}

export function loadMenuWeeks(): MenuWeek[] {
  return readDir("menus", (raw, file) => {
    try {
      return menuWeekSchema.parse(raw);
    } catch (err) {
      throw new Error(`content/menus/${file}: ${err instanceof Error ? err.message : err}`);
    }
  }).sort((a, b) => a.weekOf.localeCompare(b.weekOf));
}
```

- [x] **Step 4: Implement `lib/lookup.ts`**

```ts
import type { ActivityMonth, ActivityDay, MenuWeek, MenuDay } from "./schema";
import { monthOfISO, mondayOfISO } from "./dates";

export function findActivityDay(months: ActivityMonth[], date: string): ActivityDay | null {
  const month = months.find((m) => m.month === monthOfISO(date));
  return month?.days.find((d) => d.date === date) ?? null;
}

export function menuWeekFor(weeks: MenuWeek[], date: string): MenuWeek | null {
  return weeks.find((w) => w.weekOf === mondayOfISO(date)) ?? null;
}

export function findMenuDay(weeks: MenuWeek[], date: string): MenuDay | null {
  return menuWeekFor(weeks, date)?.days.find((d) => d.date === date) ?? null;
}

export function scansForDate(months: ActivityMonth[], date: string): string[] {
  return months.find((m) => m.month === monthOfISO(date))?.sourceScans ?? [];
}
```

- [x] **Step 5: Run tests to verify they pass**

Run: `npm test` → Expected: all tests PASS.

- [x] **Step 6: Commit**

```bash
git add lib/content.ts lib/lookup.ts tests/lookup.test.ts
git commit -m "feat: content loaders with build-time validation and pure lookup helpers"
```

---

### Task 6: Layout, design tokens, and shared components

**Files:**
- Create/replace: `app/globals.css`, `app/layout.tsx`, `app/template.tsx`
- Create: `components/TextSizeControl.tsx`, `components/EmptyState.tsx`, `components/ScanLightbox.tsx`, `components/DimensionChip.tsx`
- Delete: scaffold leftovers (`app/page.tsx` gets replaced in Task 7; remove default icons/boilerplate styles)

**Interfaces:**
- Consumes: `DIMENSION_META`, `Dimension`.
- Produces:
  - Tailwind color tokens: `petal, ink, moss, copper, hairline, card` (classes like `bg-petal`, `text-moss`, `border-hairline`, `bg-copper`, `text-copper`, `border-ink`) and `font-display`
  - `<TextSizeControl />` — sets `document.documentElement.dataset.textsize` to `"" | "lg" | "xl"`, persisted in `localStorage["mc-textsize"]`
  - `<EmptyState message={string} />`
  - `<ScanLightbox scans={string[]} label={string} />` — renders nothing when `scans` is empty; images resolve as `/${scan}`
  - `<DimensionChip dimension={Dimension} />`

- [x] **Step 1: Replace `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-petal: #FAF6EE;
  --color-ink: #2A2E22;
  --color-moss: #5C6250;
  --color-copper: #A0501F;
  --color-hairline: #E3DCCB;
  --color-card: #FFFFFF;
  --font-display: "Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif;
}

:root { font-size: 106.25%; } /* 17px base — senior-readable floor */
:root[data-textsize="lg"] { font-size: 118.75%; } /* 19px */
:root[data-textsize="xl"] { font-size: 131.25%; } /* 21px */

body { background: var(--color-petal); color: var(--color-ink); }

:focus-visible { outline: 2px solid var(--color-copper); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [x] **Step 2: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import TextSizeControl from "@/components/TextSizeControl";

export const metadata: Metadata = {
  title: "Magnolia Place of Roswell — Daily Companion",
  description: "Today's activities and meals at Magnolia Place of Roswell.",
};

const NAV = [
  { href: "/", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/menu", label: "Menu" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-petal text-ink antialiased">
        <script
          // restore saved text size before first paint
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem("mc-textsize");if(s)document.documentElement.dataset.textsize=s}catch(e){}`,
          }}
        />
        <header className="border-b border-hairline">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="font-display">
              <span className="font-semibold">Magnolia Place</span>{" "}
              <span className="text-moss">of Roswell</span>
            </div>
            <TextSizeControl />
            <nav aria-label="Main" className="flex w-full justify-around gap-1 sm:w-auto sm:justify-end sm:gap-2">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}
                  className="rounded-full px-4 py-2 font-semibold text-moss hover:bg-hairline hover:text-ink">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6 pb-16">{children}</main>
      </body>
    </html>
  );
}
```

- [x] **Step 3: Create `app/template.tsx`** (page-transition fade)

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

- [x] **Step 4: Create the shared components**

`components/TextSizeControl.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

const SIZES = [
  { key: "", label: "A", name: "Standard text" },
  { key: "lg", label: "A+", name: "Large text" },
  { key: "xl", label: "A++", name: "Extra large text" },
] as const;

export default function TextSizeControl() {
  const [size, setSize] = useState("");
  useEffect(() => {
    try { setSize(localStorage.getItem("mc-textsize") ?? ""); } catch {}
  }, []);
  function apply(key: string) {
    setSize(key);
    document.documentElement.dataset.textsize = key;
    try { localStorage.setItem("mc-textsize", key); } catch {}
  }
  return (
    <div role="group" aria-label="Text size" className="flex rounded-full border border-hairline">
      {SIZES.map((s) => (
        <button key={s.key} aria-label={s.name} aria-pressed={size === s.key} onClick={() => apply(s.key)}
          className={`px-3 py-1.5 font-semibold first:rounded-l-full last:rounded-r-full ${
            size === s.key ? "bg-ink text-petal" : "text-moss"
          }`}>
          {s.label}
        </button>
      ))}
    </div>
  );
}
```

`components/EmptyState.tsx`:

```tsx
export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-card px-6 py-10 text-center">
      <p className="text-xl text-moss">{message}</p>
    </div>
  );
}
```

`components/ScanLightbox.tsx`:

```tsx
"use client";

import { useState } from "react";

export default function ScanLightbox({ scans, label }: { scans: string[]; label: string }) {
  const [open, setOpen] = useState(false);
  if (scans.length === 0) return null;
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="mx-auto mt-6 block font-semibold text-copper underline underline-offset-4">
        {label}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Printed pages"
          className="fixed inset-0 z-50 overflow-auto bg-black/80 p-4"
          onClick={() => setOpen(false)}>
          <button className="mb-3 rounded-lg bg-card px-4 py-2 font-semibold" onClick={() => setOpen(false)}>
            Close
          </button>
          {scans.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element -- full-size scan, no optimization wanted
            <img key={s} src={`/${s}`} alt="Printed page from Magnolia Place"
              className="mx-auto mb-4 max-w-full rounded-lg" />
          ))}
        </div>
      )}
    </>
  );
}
```

`components/DimensionChip.tsx`:

```tsx
import type { Dimension } from "@/lib/schema";
import { DIMENSION_META } from "@/lib/dimensions";

export default function DimensionChip({ dimension }: { dimension: Dimension }) {
  const m = DIMENSION_META[dimension];
  return (
    <span className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-bold"
      style={{ background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}
```

- [x] **Step 5: Verify**

Run: `npx tsc --noEmit` → Expected: no errors.
Run: `npm run dev`, open http://localhost:3000 → Expected: header with brand, nav, and working A/A+/A++ control (text grows, persists across reload). The default page body is still Next.js boilerplate — replaced in Task 7.

- [x] **Step 6: Commit**

```bash
git add app/ components/
git commit -m "feat: layout, magnolia design tokens, text-size control, lightbox, chips"
```

---

### Task 7: Home page (Today / Tomorrow / This Week × Activities / Meals)

**Files:**
- Create: `components/Timeline.tsx`, `components/MealCards.tsx`, `components/HomeClient.tsx`
- Replace: `app/page.tsx`

**Interfaces:**
- Consumes: `loadActivityMonths`, `loadMenuWeeks` (content), `findActivityDay`, `findMenuDay`, `scansForDate` (lookup), dates lib, `EmptyState`, `ScanLightbox`, `DimensionChip`, types.
- Produces:
  - `<Timeline events={ActivityEvent[]} />` — routine rows quiet, specials as cards (reused by Calendar in Task 8)
  - `<MealCards day={MenuDay | null} />` — reused by Menu page in Task 9; shows `EmptyState` when null
  - `MEAL_HOURS: [key: "breakfast"|"lunch"|"dinner", label: string, hours: string][]` exported from `MealCards.tsx` (placeholder serving hours until the real menu arrives)
  - `<HomeClient months={ActivityMonth[]} weeks={MenuWeek[]} />` — remembers Activities/Meals tab in `localStorage["mc-mode"]`

- [x] **Step 1: Create `components/Timeline.tsx`**

```tsx
import type { ActivityEvent } from "@/lib/schema";
import { formatTime } from "@/lib/dates";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";

export default function Timeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) return <EmptyState message="No activities listed for this day." />;
  return (
    <div>
      {events.map((e, i) =>
        e.routine ? (
          <div key={i} className="mb-2 flex items-baseline gap-3">
            <span className="w-16 shrink-0 text-right tabular-nums text-moss">
              {e.start ? formatTime(e.start) : "All day"}
            </span>
            <span className="text-moss">{e.title}</span>
          </div>
        ) : (
          <div key={i} className="mb-2.5 flex gap-3">
            <span className="w-16 shrink-0 pt-3 text-right font-semibold tabular-nums text-copper">
              {e.start ? formatTime(e.start) : "All day"}
            </span>
            <div className="flex-1 rounded-xl border border-hairline bg-card px-3.5 py-2.5">
              <div className="text-lg font-semibold leading-snug">{e.title}</div>
              {(e.location || e.dimension) && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-moss">
                  {e.location && <span>{e.location}</span>}
                  {e.dimension && <DimensionChip dimension={e.dimension} />}
                </div>
              )}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
```

- [x] **Step 2: Create `components/MealCards.tsx`**

```tsx
import type { MenuDay } from "@/lib/schema";
import EmptyState from "@/components/EmptyState";

/** Serving hours are placeholders until the real printed menu is photographed (spec open item). */
export const MEAL_HOURS = [
  ["breakfast", "Breakfast", "7:30 – 9:00"],
  ["lunch", "Lunch", "11:30 – 1:00"],
  ["dinner", "Dinner", "5:00 – 6:30"],
] as const;

export default function MealCards({ day }: { day: MenuDay | null }) {
  if (!day) return <EmptyState message="This week's menu hasn't been added yet." />;
  return (
    <div>
      {MEAL_HOURS.map(([key, label, hours]) => {
        const meal = day[key];
        return (
          <div key={key} className="mb-2.5 rounded-xl border border-hairline bg-card px-3.5 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold">{label}</span>
              <span className="tabular-nums text-moss">{hours}</span>
            </div>
            <p className="mt-1 leading-relaxed">
              {meal.items.length === 0 ? (
                <span className="text-moss">Not listed</span>
              ) : (
                meal.items.map((it, i) => (
                  <span key={i}>
                    <span className={it.kind === "dessert" ? "text-copper" : ""}>{it.name}</span>
                    {i < meal.items.length - 1 && " · "}
                  </span>
                ))
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
```

- [x] **Step 3: Create `components/HomeClient.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { ActivityMonth, MenuWeek } from "@/lib/schema";
import {
  todayISO, addDaysISO, mondayOfISO,
  dayNameOfISO, longDateOfISO, monthNameOfISO, formatTime,
} from "@/lib/dates";
import { findActivityDay, findMenuDay, scansForDate } from "@/lib/lookup";
import Timeline from "@/components/Timeline";
import MealCards from "@/components/MealCards";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";
import ScanLightbox from "@/components/ScanLightbox";

type DayPick = "today" | "tomorrow" | "week";
type Mode = "activities" | "meals";

const PICKS: { key: DayPick; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
];

export default function HomeClient({ months, weeks }: { months: ActivityMonth[]; weeks: MenuWeek[] }) {
  const [today, setToday] = useState<string | null>(null);
  const [pick, setPick] = useState<DayPick>("today");
  const [mode, setModeState] = useState<Mode>("activities");

  useEffect(() => {
    setToday(todayISO());
    try {
      if (localStorage.getItem("mc-mode") === "meals") setModeState("meals");
    } catch {}
  }, []);

  function setMode(m: Mode) {
    setModeState(m);
    try { localStorage.setItem("mc-mode", m); } catch {}
  }

  if (!today) return null; // date is client-side by design; render after mount

  const date = pick === "tomorrow" ? addDaysISO(today, 1) : today;
  const weekStart = mondayOfISO(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  const day = findActivityDay(months, date);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-semibold">
        {pick === "week" ? "This Week" : dayNameOfISO(date)}
      </h1>
      <p className="text-moss">
        {pick === "week"
          ? `${longDateOfISO(weekStart)} – ${longDateOfISO(addDaysISO(weekStart, 6))}`
          : longDateOfISO(date)}
      </p>
      {pick !== "week" && day?.theme && (
        <p className="font-display italic text-copper">{day.theme}</p>
      )}

      <div role="tablist" aria-label="Day" className="mt-3 flex w-fit rounded-full bg-hairline/60 p-1">
        {PICKS.map((p) => (
          <button key={p.key} role="tab" aria-selected={pick === p.key} onClick={() => setPick(p.key)}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold ${
              pick === p.key ? "bg-copper text-petal" : "text-moss"
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      <div role="tablist" aria-label="Content" className="mb-4 mt-3 flex border-b-2 border-hairline">
        {(["activities", "meals"] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
            className={`-mb-0.5 flex-1 border-b-[3px] pb-2 pt-2 text-lg font-semibold ${
              mode === m ? "border-ink text-ink" : "border-transparent text-moss"
            }`}>
            {m === "activities" ? "Activities" : "Meals"}
          </button>
        ))}
      </div>

      {pick === "week" ? (
        mode === "activities"
          ? <WeekActivities months={months} dates={weekDates} today={today} />
          : <WeekMeals weeks={weeks} dates={weekDates} today={today} />
      ) : mode === "activities" ? (
        day
          ? <Timeline events={day.events} />
          : <EmptyState message={`${monthNameOfISO(date)}'s calendar hasn't been added yet.`} />
      ) : (
        <MealCards day={findMenuDay(weeks, date)} />
      )}

      <ScanLightbox scans={scansForDate(months, date)} label="View this month's printed pages" />
    </div>
  );
}

function DayHeading({ date, today, theme }: { date: string; today: string; theme: string | null }) {
  const note = date === today ? "Today" : date === addDaysISO(today, 1) ? "Tomorrow" : null;
  return (
    <>
      <h2 className="mt-4 font-semibold">
        {dayNameOfISO(date).slice(0, 3)} {Number(date.slice(8))}
        {note && <span className="font-normal text-moss"> · {note}</span>}
      </h2>
      {theme && <p className="font-display text-[15px] italic text-copper">{theme}</p>}
    </>
  );
}

function WeekActivities({ months, dates, today }: { months: ActivityMonth[]; dates: string[]; today: string }) {
  return (
    <div className="divide-y divide-hairline">
      {dates.map((date) => {
        const day = findActivityDay(months, date);
        const specials = day?.events.filter((e) => !e.routine) ?? [];
        const routineCount = (day?.events.length ?? 0) - specials.length;
        return (
          <div key={date} className="pb-3">
            <DayHeading date={date} today={today} theme={day?.theme ?? null} />
            {!day && <p className="text-moss">Not added yet.</p>}
            {specials.map((e, i) => (
              <div key={i} className="mb-1.5 flex items-baseline gap-2">
                <span className="w-14 shrink-0 text-right font-semibold tabular-nums text-copper">
                  {e.start ? formatTime(e.start) : "All day"}
                </span>
                <span>
                  {e.title} {e.dimension && <DimensionChip dimension={e.dimension} />}
                </span>
              </div>
            ))}
            {routineCount > 0 && (
              <p className="ml-16 text-[15px] text-moss">+ {routineCount} daily routine items</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekMeals({ weeks, dates, today }: { weeks: MenuWeek[]; dates: string[]; today: string }) {
  return (
    <div className="divide-y divide-hairline">
      {dates.map((date) => {
        const day = findMenuDay(weeks, date);
        return (
          <div key={date} className="pb-3">
            <DayHeading date={date} today={today} theme={null} />
            {!day && <p className="text-moss">Menu not added yet.</p>}
            {day &&
              (["breakfast", "lunch", "dinner"] as const).map((meal) => (
                <p key={meal} className="mb-1 text-[15px]">
                  <b className="capitalize">{meal}</b>{" "}
                  {day[meal].items.length === 0
                    ? <span className="text-moss">not listed</span>
                    : day[meal].items.map((it, i) => (
                        <span key={i}>
                          <span className={it.kind === "dessert" ? "text-copper" : ""}>{it.name}</span>
                          {i < day[meal].items.length - 1 && " · "}
                        </span>
                      ))}
                </p>
              ))}
          </div>
        );
      })}
    </div>
  );
}
```

- [x] **Step 4: Replace `app/page.tsx`**

```tsx
import { loadActivityMonths, loadMenuWeeks } from "@/lib/content";
import HomeClient from "@/components/HomeClient";

export default function HomePage() {
  return <HomeClient months={loadActivityMonths()} weeks={loadMenuWeeks()} />;
}
```

- [x] **Step 5: Verify**

Run: `npx tsc --noEmit` → no errors. Run: `npm run dev` →
- `/` shows Wednesday July 8 content when system date is in the fixture week (otherwise the empty state — expected).
- Day pills switch; Meals tab shows three cards without scrolling; This Week groups by day with "+ n daily routine items"; tab choice survives reload; lightbox button hidden (no scan files yet — they arrive in Task 11).

- [x] **Step 6: Commit**

```bash
git add components/Timeline.tsx components/MealCards.tsx components/HomeClient.tsx app/page.tsx
git commit -m "feat: home page with day pills, activities/meals tabs, week views"
```

---

### Task 8: Calendar page

**Files:**
- Create: `components/CalendarClient.tsx`, `app/calendar/page.tsx`

**Interfaces:**
- Consumes: `loadActivityMonths`, `Timeline`, `EmptyState`, `ScanLightbox`, `DIMENSION_META`, `DIMENSIONS`, dates lib.
- Produces: `/calendar` route. Month grid (≥ md screens) with day themes + special events, dimension filter chips (`aria-pressed`), agenda list on phones, tap-a-day detail panel using `Timeline`, prev/next month across uploaded months.

- [x] **Step 1: Create `components/CalendarClient.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { ActivityMonth } from "@/lib/schema";
import { DIMENSIONS, type Dimension } from "@/lib/schema";
import { DIMENSION_META } from "@/lib/dimensions";
import { todayISO, formatTime, dayNameOfISO, longDateOfISO } from "@/lib/dates";
import Timeline from "@/components/Timeline";
import EmptyState from "@/components/EmptyState";
import ScanLightbox from "@/components/ScanLightbox";

const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarClient({ months }: { months: ActivityMonth[] }) {
  const [today, setToday] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [filter, setFilter] = useState<Dimension | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const t = todayISO();
    setToday(t);
    const i = months.findIndex((m) => m.month === t.slice(0, 7));
    setIdx(i >= 0 ? i : Math.max(0, months.length - 1));
  }, [months]);

  if (!today) return null;
  if (months.length === 0) return <EmptyState message="No activity calendars have been added yet." />;

  const month = months[idx];
  const [y, mo] = month.month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
  const byDate = new Map(month.days.map((d) => [d.date, d]));
  const dateOf = (n: number) => `${month.month}-${String(n).padStart(2, "0")}`;
  const monthTitle = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: "long", year: "numeric",
  }).format(new Date(Date.UTC(y, mo - 1, 1)));
  const selDay = selected ? byDate.get(selected) ?? null : null;

  function moveMonth(delta: number) {
    setIdx((i) => Math.min(months.length - 1, Math.max(0, i + delta)));
    setSelected(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">{monthTitle}</h1>
        <div className="flex gap-2">
          <button aria-label="Previous month" disabled={idx === 0} onClick={() => moveMonth(-1)}
            className="rounded-full border border-hairline px-4 py-1.5 font-bold text-copper disabled:opacity-30">‹</button>
          <button aria-label="Next month" disabled={idx === months.length - 1} onClick={() => moveMonth(1)}
            className="rounded-full border border-hairline px-4 py-1.5 font-bold text-copper disabled:opacity-30">›</button>
        </div>
      </div>

      <div className="my-3 flex flex-wrap gap-2">
        {(["all", ...DIMENSIONS] as const).map((d) => (
          <button key={d} aria-pressed={filter === d}
            onClick={() => setFilter(d)}
            className={`rounded-full border px-3.5 py-1.5 font-semibold ${
              filter === d ? "border-ink bg-ink text-petal" : "border-hairline bg-card text-moss"
            }`}>
            {d === "all" ? "All" : DIMENSION_META[d].label}
          </button>
        ))}
      </div>

      {/* Month grid: tablet & desktop */}
      <div className="hidden grid-cols-7 gap-1 md:grid" role="grid" aria-label={monthTitle}>
        {DOWS.map((d) => (
          <div key={d} className="py-1 text-center text-[13px] font-bold uppercase tracking-wider text-moss">{d}</div>
        ))}
        {Array.from({ length: firstDow }, (_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = dateOf(i + 1);
          const day = byDate.get(date);
          const specials = day?.events.filter((e) => !e.routine) ?? [];
          return (
            <button key={date} onClick={() => setSelected(date)}
              className={`min-h-24 rounded-lg border bg-card p-1.5 text-left align-top text-[13px] ${
                date === today ? "border-2 border-copper" : "border-hairline"
              } ${selected === date ? "ring-2 ring-ink" : ""}`}>
              <div className={`font-semibold tabular-nums ${date === today ? "text-copper" : "text-moss"}`}>{i + 1}</div>
              {day?.theme && (
                <div className="truncate font-display italic text-copper">{day.theme}</div>
              )}
              {specials.slice(0, 3).map((e, j) => {
                const dim = filter !== "all" && e.dimension !== filter;
                return (
                  <div key={j} className={`flex items-center gap-1 truncate ${dim ? "opacity-20" : ""}`}>
                    {e.dimension && (
                      <span className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: DIMENSION_META[e.dimension].dot }} />
                    )}
                    <span className="truncate">{e.title}</span>
                  </div>
                );
              })}
              {specials.length > 3 && <div className="text-moss">+{specials.length - 3} more</div>}
            </button>
          );
        })}
      </div>

      {/* Agenda list: phones */}
      <div className="divide-y divide-hairline md:hidden">
        {month.days.map((day) => {
          const specials = day.events.filter(
            (e) => !e.routine && (filter === "all" || e.dimension === filter),
          );
          if (specials.length === 0) return null;
          return (
            <button key={day.date} onClick={() => setSelected(day.date)} className="block w-full py-3 text-left">
              <div className="font-semibold">
                {dayNameOfISO(day.date).slice(0, 3)} {Number(day.date.slice(8))}
                {day.date === today && <span className="font-normal text-moss"> · Today</span>}
              </div>
              {day.theme && <div className="font-display text-[15px] italic text-copper">{day.theme}</div>}
              {specials.map((e, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-copper">
                    {e.start ? formatTime(e.start) : "All day"}
                  </span>
                  <span>{e.title}</span>
                </div>
              ))}
            </button>
          );
        })}
      </div>

      {/* Day detail */}
      {selDay && (
        <section aria-label="Day detail" className="mt-5 rounded-xl border border-hairline bg-petal p-4">
          <h2 className="font-display text-2xl font-semibold">
            {dayNameOfISO(selDay.date)}, {longDateOfISO(selDay.date)}
          </h2>
          {selDay.theme && <p className="mb-3 font-display italic text-copper">{selDay.theme}</p>}
          <Timeline events={selDay.events} />
        </section>
      )}

      <ScanLightbox scans={month.sourceScans} label="View this month's printed pages" />
    </div>
  );
}
```

- [x] **Step 2: Create `app/calendar/page.tsx`**

```tsx
import { loadActivityMonths } from "@/lib/content";
import CalendarClient from "@/components/CalendarClient";

export default function CalendarPage() {
  return <CalendarClient months={loadActivityMonths()} />;
}
```

- [x] **Step 3: Verify**

Run: `npx tsc --noEmit` → no errors. Run: `npm run dev`, open `/calendar` →
- Wide window: July 2026 grid, day themes in italic copper, July 8 ringed copper; clicking "Emotional" dims everything except the Therapy Dog Visit; clicking a day opens the detail panel with the full timeline.
- Narrow window (< 768px): agenda list instead of grid.

- [x] **Step 4: Commit**

```bash
git add components/CalendarClient.tsx app/calendar/
git commit -m "feat: calendar page with month grid, dimension filters, agenda view"
```

---

### Task 9: Menu page

**Files:**
- Create: `components/MenuClient.tsx`, `app/menu/page.tsx`

**Interfaces:**
- Consumes: `loadMenuWeeks`, `MealCards`, `EmptyState`, `ScanLightbox`, dates lib.
- Produces: `/menu` route — week navigation, seven day tabs (default: today), `MealCards`, always-available footer.

- [x] **Step 1: Create `components/MenuClient.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { MenuWeek } from "@/lib/schema";
import { todayISO, mondayOfISO, addDaysISO, dayNameOfISO, longDateOfISO } from "@/lib/dates";
import MealCards from "@/components/MealCards";
import EmptyState from "@/components/EmptyState";
import ScanLightbox from "@/components/ScanLightbox";

export default function MenuClient({ weeks }: { weeks: MenuWeek[] }) {
  const [today, setToday] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    const t = todayISO();
    setToday(t);
    const i = weeks.findIndex((w) => w.weekOf === mondayOfISO(t));
    setIdx(i >= 0 ? i : Math.max(0, weeks.length - 1));
    setDate(t);
  }, [weeks]);

  if (!today || !date) return null;
  if (weeks.length === 0) return <EmptyState message="No menus have been added yet." />;

  const week = weeks[idx];
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(week.weekOf, i));
  const activeDate = weekDates.includes(date) ? date : week.weekOf;
  const day = week.days.find((d) => d.date === activeDate) ?? null;

  function moveWeek(delta: number) {
    const next = Math.min(weeks.length - 1, Math.max(0, idx + delta));
    setIdx(next);
    setDate(weeks[next].weekOf);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between">
        <button disabled={idx === 0} onClick={() => moveWeek(-1)}
          className="font-bold text-copper disabled:opacity-30">‹ Last week</button>
        <h1 className="font-display text-xl font-semibold">Week of {longDateOfISO(week.weekOf)}</h1>
        <button disabled={idx === weeks.length - 1} onClick={() => moveWeek(1)}
          className="font-bold text-copper disabled:opacity-30">Next ›</button>
      </div>

      <div role="tablist" aria-label="Day of week" className="my-4 flex gap-1">
        {weekDates.map((d) => (
          <button key={d} role="tab" aria-selected={activeDate === d} onClick={() => setDate(d)}
            className={`flex-1 rounded-lg py-1.5 text-center ${
              activeDate === d ? "bg-copper text-petal" : "text-moss"
            }`}>
            <span className="block text-[13px] font-bold">{dayNameOfISO(d).slice(0, 3)}</span>
            <span className="block font-semibold tabular-nums">{Number(d.slice(8))}</span>
          </button>
        ))}
      </div>

      <MealCards day={day} />

      {week.alwaysAvailable.length > 0 && (
        <p className="mt-4 text-[15px] text-moss">
          <b className="text-ink">Always available:</b> {week.alwaysAvailable.join(" · ")}
        </p>
      )}

      <ScanLightbox scans={week.sourceScan ? [week.sourceScan] : []} label="View the printed menu" />
    </div>
  );
}
```

- [x] **Step 2: Create `app/menu/page.tsx`**

```tsx
import { loadMenuWeeks } from "@/lib/content";
import MenuClient from "@/components/MenuClient";

export default function MenuPage() {
  return <MenuClient weeks={loadMenuWeeks()} />;
}
```

- [x] **Step 3: Verify**

Run: `npx tsc --noEmit` → no errors. Run: `npm run dev`, open `/menu` →
day tabs render Mon 6 – Sun 12, tapping a tab swaps the three meal cards, desserts render in copper, always-available footer shows. Week arrows disabled (single week uploaded).

- [x] **Step 4: Commit**

```bash
git add components/MenuClient.tsx app/menu/
git commit -m "feat: menu page with week navigation and day tabs"
```

---

### Task 10: Playwright smoke tests

**Files:**
- Create: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: the three routes, fixture content, `page.clock` (Playwright ≥ 1.45) to pin the browser date inside the fixture week.

- [x] **Step 1: Write the tests**

Create `e2e/smoke.spec.ts`:

```ts
import { test, expect, type Page } from "@playwright/test";

// Pin the browser clock inside the committed fixture week (Wed 2026-07-08, 3pm EDT).
async function pinClock(page: Page) {
  await page.clock.install({ time: new Date("2026-07-08T19:00:00Z") });
}

test("home: pills, tabs, and week view", async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Wednesday" })).toBeVisible();
  await expect(page.getByText("Nat'l Raspberry Day")).toBeVisible();

  await page.getByRole("tab", { name: "Meals" }).click();
  await expect(page.getByText("Fried catfish")).toBeVisible();

  await page.getByRole("tab", { name: "Tomorrow" }).click();
  await expect(page.getByRole("heading", { name: "Thursday" })).toBeVisible();

  await page.getByRole("tab", { name: "This Week" }).click();
  await page.getByRole("tab", { name: "Activities" }).click();
  await expect(page.getByText("daily routine items").first()).toBeVisible();
  await expect(page.getByText("Therapy Dog Visit with Canine Assistants")).toBeVisible();
});

test("home: meals tab choice survives reload", async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  await page.getByRole("tab", { name: "Meals" }).click();
  await page.reload();
  await expect(page.getByRole("tab", { name: "Meals" })).toHaveAttribute("aria-selected", "true");
});

test("calendar: grid, filter, day detail", async ({ page }) => {
  await pinClock(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: "July 2026" })).toBeVisible();

  const emotional = page.getByRole("button", { name: "Emotional" });
  await emotional.click();
  await expect(emotional).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /Classic Car Collection Day/ }).click();
  await expect(page.getByText("Therapy Dog Visit with Canine Assistants")).toBeVisible();
});

test("menu: day tabs swap the meal cards", async ({ page }) => {
  await pinClock(page);
  await page.goto("/menu");
  await expect(page.getByText("Fried catfish")).toBeVisible();
  await page.getByRole("tab", { name: /Mon\s*6/ }).click();
  await expect(page.getByText("Buttermilk pancakes")).toBeVisible();
});
```

- [x] **Step 2: Run the suite**

Run: `npm run test:e2e`
Expected: 4 passed. (Playwright starts `npm run dev` itself per `playwright.config.ts`.)
If a locator is ambiguous (strict-mode violation), tighten the locator in the test — do not loosen the page markup.

- [x] **Step 3: Commit**

```bash
git add e2e/smoke.spec.ts
git commit -m "test: playwright smoke coverage for home, calendar, menu"
```

---

### Task 11: Ingest CLI — Claude extraction + real July run

**Files:**
- Create: `lib/ingest/extract.ts`, `scripts/ingest.ts`, `.env` (local only, never committed)
- Modify: `content/activities/2026-07.json` (replaced by the real full-month run), `public/scans/` (add photos)
- Test: `tests/extract.test.ts` (pure parts only — no API calls in tests)

**Interfaces:**
- Consumes: `RawDay`, `buildActivityMonth` from `@/lib/ingest/postprocess`.
- Produces:
  - `stripFences(s: string): string` — unwrap ```json fences if present
  - `rawPageSchema` — zod for the model's output: `{ days: [{ date, theme, events: [{ time, title, locationCode, dimension }] }], warnings: string[] }`
  - `buildActivityPrompt(month: string): string`
  - `extractActivityPage(client: Anthropic, imagePath: string, month: string): Promise<{ days: RawDay[]; warnings: string[] }>`
  - CLI: `npm run ingest -- --type activities --month 2026-07 photo1.jpg photo2.jpg`

**Requires from the user:** the two July calendar photos on disk, and `ANTHROPIC_API_KEY` in `.env`.

- [x] **Step 1: Write the failing tests (pure parts)**

Create `tests/extract.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { stripFences, rawPageSchema } from "@/lib/ingest/extract";

describe("stripFences", () => {
  test("unwraps a json code fence", () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
  test("returns bare JSON untouched", () => {
    expect(stripFences('{"a":1}')).toBe('{"a":1}');
  });
});

describe("rawPageSchema", () => {
  test("accepts a well-formed page", () => {
    const page = {
      days: [{
        date: "2026-07-08", theme: "Nat'l Raspberry Day",
        events: [{ time: "9:00", title: "Magnolia Gazette", locationCode: "LR", dimension: "learn" }],
      }],
      warnings: ["could not read the 10:15 entry on July 22"],
    };
    expect(rawPageSchema.parse(page).days[0].events).toHaveLength(1);
  });
  test("rejects a day without a date", () => {
    expect(() => rawPageSchema.parse({ days: [{ theme: null, events: [] }], warnings: [] })).toThrow();
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test` → Expected: FAIL — `Cannot find module '@/lib/ingest/extract'`.

- [x] **Step 3: Implement `lib/ingest/extract.ts`**

```ts
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { RawDay } from "./postprocess";

export const rawPageSchema = z.object({
  days: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      theme: z.string().min(1).nullable(),
      events: z.array(
        z.object({
          time: z.string().nullable(),
          title: z.string().min(1),
          locationCode: z.string().nullable(),
          dimension: z.string().nullable(),
        }),
      ),
    }),
  ),
  warnings: z.array(z.string()),
});

export function stripFences(s: string): string {
  const m = /```(?:json)?\s*([\s\S]*?)```/.exec(s);
  return (m ? m[1] : s).trim();
}

export function buildActivityPrompt(month: string): string {
  return `You are reading a photographed page of the printed monthly activity calendar from Magnolia Place of Roswell, a senior assisted living facility, for the month ${month}.

Return ONLY a JSON object (no prose, no markdown fence) with this exact shape:
{
  "days": [
    { "date": "YYYY-MM-DD", "theme": string|null,
      "events": [ { "time": string|null, "title": string, "locationCode": string|null, "dimension": string|null } ] }
  ],
  "warnings": [ string ]
}

Rules:
- Include only dates actually visible on this page, using month ${month} for the date prefix.
- "theme" is the all-day day title printed at the top of a date cell (e.g. "NAT'L RASPBERRY DAY"), converted to Title Case ("Nat'l Raspberry Day"); null if none.
- "time" is exactly as printed (e.g. "9:00", "10:15"). Use null for all-day items.
- "title" is the event text with any trailing location code removed.
- "locationCode" is the trailing code when present: AR, B, BT, FP, or LR. "AD" printed beside an item means All Day — it is NOT a location; set time to null instead and leave locationCode null.
- "dimension" is your best classification of the event from exactly this list: physical, emotional, spiritual, move, learn, social, intellectual, entertainment, nutritional, connect. Use null when unsure. (The printed colored tick marks are unreadable in photos — classify from the event title.)
- Ignore birthday lists, the meeting-places legend, the Dimensions of Wellness legend, and all page decoration.
- For anything you cannot read confidently, add a warning string naming the date and time slot, and omit or best-guess the entry as appropriate.`;
}

export async function extractActivityPage(
  client: Anthropic,
  imagePath: string,
  month: string,
): Promise<{ days: RawDay[]; warnings: string[] }> {
  const mediaType = imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const data = fs.readFileSync(imagePath).toString("base64");
  const res = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8000,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data } },
        { type: "text", text: buildActivityPrompt(month) },
      ],
    }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return rawPageSchema.parse(JSON.parse(stripFences(text)));
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test` → Expected: all tests PASS.

- [x] **Step 5: Implement `scripts/ingest.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { extractActivityPage } from "@/lib/ingest/extract";
import { buildActivityMonth, type RawDay } from "@/lib/ingest/postprocess";

function fail(msg: string): never {
  console.error(`\nError: ${msg}`);
  console.error("\nUsage: npm run ingest -- --type activities --month YYYY-MM photo1.jpg [photo2.jpg ...]");
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const type = opt("type");
  const month = opt("month");
  const files = args.filter((a, i) => !a.startsWith("--") && args[i - 1]?.startsWith("--") !== true);

  if (type === "menu") {
    fail("menu ingest is not built yet — it lands once the real printed menu is photographed (see spec open item)");
  }
  if (type !== "activities") fail(`unknown --type "${type}"`);
  if (!month || !/^\d{4}-\d{2}$/.test(month)) fail("--month must look like 2026-07");
  if (files.length === 0) fail("no photo files given");
  for (const f of files) if (!fs.existsSync(f)) fail(`file not found: ${f}`);
  if (!process.env.ANTHROPIC_API_KEY) fail("ANTHROPIC_API_KEY missing — put it in .env");

  const client = new Anthropic();

  // Copy photos to canonical public/scans/ names.
  const scanRels: string[] = [];
  fs.mkdirSync(path.join("public", "scans"), { recursive: true });
  files.forEach((f, i) => {
    const ext = path.extname(f).toLowerCase() || ".jpg";
    const rel = `scans/${month}-activities-p${i + 1}${ext}`;
    fs.copyFileSync(f, path.join("public", rel));
    scanRels.push(rel);
  });

  const pages: RawDay[][] = [];
  const warnings: string[] = [];
  for (const [i, f] of files.entries()) {
    console.log(`Reading page ${i + 1}/${files.length}: ${f} ...`);
    const page = await extractActivityPage(client, f, month);
    pages.push(page.days);
    warnings.push(...page.warnings);
  }

  const result = buildActivityMonth(month, scanRels, pages);
  warnings.push(...result.warnings);

  const outPath = path.join("content", "activities", `${month}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(result.data, null, 2)}\n`);

  const eventCount = result.data.days.reduce((n, d) => n + d.events.length, 0);
  console.log(`\nWrote ${outPath}: ${result.data.days.length} days, ${eventCount} events.`);
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s) — check these against the paper:`);
    for (const w of warnings) console.log(`  • ${w}`);
  }
  console.log("\nNext: npm run dev — compare the site against the printed pages, fix any misreads in the JSON, then commit and push.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Note: `tsx` resolves the `@/*` alias from `tsconfig.json` automatically.

- [ ] **Step 6: Create `.env` and run the real ingest** *(requires the user)*

```bash
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env   # user supplies the key
# user drops the two July photos somewhere, e.g. ~/Desktop:
npm run ingest -- --type activities --month 2026-07 ~/Desktop/july-p1.jpeg ~/Desktop/july-p2.jpeg
```

Expected: `Wrote content/activities/2026-07.json: 31 days, ~250 events.` plus a warnings list. The hand-transcribed 7-day fixture is replaced by the full month.

- [ ] **Step 7: Review and verify**

- `git diff content/activities/2026-07.json` — sanity-check the fixture week barely changed (titles/times should match what was hand-transcribed).
- `npm run dev` — compare July against both photos day by day; fix misreads directly in the JSON.
- Run: `npm test` → all tests still PASS (fixture week assertions still hold: July 8 theme, Fried catfish lunch, etc. If a legitimately-corrected reading breaks an assertion, update the test to the corrected truth).

- [ ] **Step 8: Commit**

```bash
git add lib/ingest/extract.ts scripts/ingest.ts tests/extract.test.ts content/activities/2026-07.json public/scans/
git commit -m "feat: ingest CLI with Claude vision extraction; real July 2026 content"
```

---

### Task 12: README, production build, GitHub, Vercel

**Files:**
- Create: `README.md`
- Modify: nothing else — this task verifies and ships.

- [x] **Step 1: Write `README.md`**

```markdown
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
```

- [x] **Step 2: Full verification**

```bash
npm test          # all unit tests pass
npm run test:e2e  # all smoke tests pass
npm run build     # completes; every route listed as prerendered (○ or ●), none as ƒ (dynamic)
```

If `next build` reports a route as dynamic, find the accidental dynamic API usage and remove it — static generation is a spec requirement.

- [ ] **Step 3: Push to GitHub** *(user's account)*

```bash
gh repo create magnolia-companion --private --source . --push
```

(If `gh` isn't authenticated: create an empty private repo named `magnolia-companion` on github.com, then `git remote add origin git@github.com:<user>/magnolia-companion.git && git push -u origin main`.)

- [ ] **Step 4: Connect Vercel** *(user does this in the browser)*

1. vercel.com → Add New → Project → Import `magnolia-companion` from GitHub.
2. Framework preset: Next.js (auto-detected). No environment variables. Deploy.
3. Open the `*.vercel.app` URL on a phone: check `/`, `/calendar`, `/menu`, the text-size control, and the scan lightbox.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: README with publish ritual and commands"
git push
```

---

## Deferred (deliberately not in this plan)

- **Menu ingest** (`--type menu`): blocked on photographing the real printed menu. When it arrives: reality-check `menuWeekSchema` (add `alternatives` if meals offer choices), replace the placeholder serving hours in `MealCards.MEAL_HOURS`, add a menu prompt + raw schema to `lib/ingest/extract.ts` mirroring the activities path, and lift the CLI guard in `scripts/ingest.ts`.
- Anything in the spec's out-of-scope list (auth, notifications, multi-facility, in-browser admin).
