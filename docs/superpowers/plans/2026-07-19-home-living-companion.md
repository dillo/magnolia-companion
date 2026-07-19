# Home Screen "Living Companion" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the home screen time-aware (hero "Happening now" card, timeline now-marker, "Serving now" meal badges) and raise its visual craft (Fraunces display serif, celebrated day theme, true timeline spine, meal cards) per `docs/superpowers/specs/2026-07-19-home-living-companion-design.md`.

**Architecture:** All time logic is pure functions in `lib/now.ts` (unit-tested), fed by a new `useNow()` client hook that returns the current America/New_York `"HH:MM"` at minute resolution, `null` until mounted — the same post-mount pattern as the existing `useToday()`. UI changes live in `components/HomeClient.tsx`, `components/Timeline.tsx`, `components/MealCards.tsx`, plus new `HeroCard.tsx` and `MagnoliaFlourish.tsx`. The Fraunces font loads via `next/font/google` in `app/layout.tsx` and flows through the existing `--font-display` token.

**Tech Stack:** Next.js 16 App Router (docs in `node_modules/next/dist/docs/` — this version differs from training data; consult before deviating), React 19, Tailwind CSS 4 (`@theme` tokens in `app/globals.css`), framer-motion 12, vitest, Playwright.

## Global Constraints

- Static site, no server runtime: time-dependent UI must render only after mount (`useToday()` / `useNow()` return `null` pre-mount). Never branch on time during SSR — that causes hydration mismatches, which the e2e suite checks for.
- All colors flow through the CSS variables in `app/globals.css` `@theme` (`--color-petal/ink/moss/copper/hairline/card`) or `DIMENSION_META` — never new hard-coded palette values — so high-contrast mode keeps working.
- Senior-readable floor: base text stays 17px (`:root` font-size 106.25%); don't shrink any text below Tailwind `text-[13px]`.
- Motion must be disabled under both reduced-motion paths. The page-level `MotionConfig` in `app/template.tsx` handles the app setting, but framer-motion's `useReducedMotion()` reads only the OS preference and ignores `MotionConfig` entirely — use `useReducedMotionConfig()` in components instead, which merges the `MotionConfig` context with the OS preference.
- The working tree carries unrelated in-flight work (Explore feature: `app/explore/`, `components/ExploreClient.tsx`, modified `NavLinks.tsx`, `MenuClient.tsx`, `lib/content.ts`, `lib/schema.ts`, etc.). **Stage only the files named in each task's commit step. Never `git add -A` or `git add .`**
- Commands: unit tests `npm test`, e2e `npm run test:e2e`, lint `npm run lint`. The user often has `npm run dev` running on port 3000; Playwright's config manages its own server, and any manual screenshot scripts should target port 3000 if it is already serving.
- The committed fixture data is July 2026. E2e tests pin the clock with `page.clock.install({ time: new Date("2026-07-08T19:00:00Z") })` = Wednesday July 8, 3:00 PM EDT ("Nat'l Raspberry Day"; "Wind Down Wednesday with Live Entertainment" runs 15:00 with no printed end).

---

### Task 1: Repair the stale e2e smoke suite (baseline must be green first)

All 6 existing smoke tests fail **before any of this plan's changes** — they were written for an older UI (home once had a "Meals" tab and a day-name heading; nav said "Today"; menu weeks were Monday-based and are now Sunday-based with different extracted item names; calendar day detail was a labeled region and is now a dialog). Later tasks can't verify against a red baseline.

**Files:**
- Modify: `e2e/smoke.spec.ts` (full rewrite below)

**Interfaces:**
- Produces: a green `npm run test:e2e` baseline; the `pinClock` helper (unchanged) that later tasks' new tests reuse.

- [ ] **Step 1: Confirm the pre-existing failures**

Run: `npm run test:e2e`
Expected: 6 failed (this proves the failures predate this plan; if something *passes* that this task deletes, stop and re-read the current UI before proceeding).

- [ ] **Step 2: Replace `e2e/smoke.spec.ts` with tests matching the current UI**

```ts
import { test, expect, type Page } from "@playwright/test";

// Pin the browser clock inside the committed fixture data (Wed 2026-07-08, 3:00 PM EDT).
async function pinClock(page: Page) {
  await page.clock.install({ time: new Date("2026-07-08T19:00:00Z") });
}

test("home: day pills, menu sidebar, and week view", async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today's Activities" })).toBeVisible();
  await expect(page.getByText("Nat'l Raspberry Day").first()).toBeVisible();
  // Today's menu renders in the sidebar (no Meals tab anymore).
  await expect(page.getByText("Roasted Turkey")).toBeVisible();

  await page.getByRole("tab", { name: "Tomorrow" }).click();
  await expect(page.getByRole("heading", { name: "Tomorrow's Activities" })).toBeVisible();

  await page.getByRole("tab", { name: "This Week" }).click();
  await expect(page.getByText("daily routine items").first()).toBeVisible();
  await expect(page.getByText("Therapy Dog Visit with Canine Assistants")).toBeVisible();
});

test("calendar: grid, filter, day detail", async ({ page }) => {
  await pinClock(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: "July 2026" })).toBeVisible();

  const filter = page.getByLabel("Activity type");
  await filter.selectOption("emotional");
  await expect(filter).toHaveValue("emotional");

  await page.getByRole("button", { name: "Show details for Friday, July 10, 2026" }).click();
  await expect(
    page.getByRole("dialog").getByText("Therapy Dog Visit with Canine Assistants"),
  ).toBeVisible();
});

test("nav: current page is marked active", async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Activities" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Calendar" })).not.toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Calendar" }).click();
  await expect(nav.getByRole("link", { name: "Calendar" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Activities" })).not.toHaveAttribute("aria-current", "page");
});

test("no hydration errors, including under reduced motion", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await pinClock(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today's Activities" })).toBeVisible();
  expect(errors.filter((e) => e.toLowerCase().includes("hydrat"))).toEqual([]);
});

test("menu: day tabs swap the meal cards", async ({ page }) => {
  await pinClock(page);
  await page.goto("/menu");
  // Wednesday July 8 is selected by default (today).
  await expect(page.getByText("Roasted Turkey")).toBeVisible();
  await page.getByRole("tab", { name: "Monday, July 6, 2026" }).click();
  await expect(page.getByText("Breaded Catfish")).toBeVisible();
});
```

Notes on why each assertion is what it is (verified against the working tree):
- The published Sunday-week menu file `content/menus/2026-07-05.json` has "Roasted Turkey" (lunch, Jul 8) and "Breaded Catfish" (lunch, Jul 6); the old "Fried catfish"/"Buttermilk pancakes" names no longer exist. The Monday-based `2026-07-06.json` has `sourceScan: null` and is filtered out by `publishedMenuWeeks`.
- Menu day tabs carry `aria-label` of the form `"Monday, July 6, 2026"` (plus `", today"` suffix for today) — see `components/MenuClient.tsx`.
- Calendar day cells are buttons labeled `"Show details for Friday, July 10, 2026"` and the detail view is a `role="dialog"` — see `components/CalendarClient.tsx`.
- The old "home: meals tab choice survives reload" test is deleted: the Meals tab no longer exists.
- If any assertion still fails, the current UI differs from the above — read the failing component, fix the *test*, and do not change app code in this task.

- [ ] **Step 3: Run the suite**

Run: `npm run test:e2e`
Expected: 5 passed

- [ ] **Step 4: Commit**

```bash
git add e2e/smoke.spec.ts
git commit -m "test: repair smoke suite drifted from current UI"
```

---

### Task 2: Pure time logic — `lib/now.ts` (TDD)

**Files:**
- Create: `lib/now.ts`
- Test: `tests/now.test.ts`

**Interfaces:**
- Consumes: `APP_TIME_ZONE` from `lib/dates.ts`; `ActivityEvent`, `ActivityDay` types from `lib/schema.ts`.
- Produces (later tasks import exactly these):
  - `clockHHMM(now?: Date, timeZone?: string): string` — zero-padded `"HH:MM"` (h23) in the app time zone
  - `minutesOf(hhmm: string): number`
  - `greetingFor(hhmm: string): string` — "Good morning" / "Good afternoon" / "Good evening"
  - `type HeroState = { kind: "now"; event: ActivityEvent; next: ActivityEvent | null } | { kind: "upcoming"; event: ActivityEvent; first: boolean; minutesUntil: number } | { kind: "done" }`
  - `heroStateFor(events: ActivityEvent[], hhmm: string): HeroState | null` — `null` when the day has no timed events
  - `type TimelineStatus = "past" | "current" | "upcoming" | "allday"`
  - `timelineStatuses(events: ActivityEvent[], hhmm: string): TimelineStatus[]` — one status per input index, input order preserved
  - `servingNow(meal: { start: string; end: string }, hhmm: string | null): boolean`
  - `tomorrowPreview(day: ActivityDay | null): ActivityEvent | null` — first timed special, else first timed event, else null

- [ ] **Step 1: Write the failing tests**

Create `tests/now.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  clockHHMM, minutesOf, greetingFor, heroStateFor, timelineStatuses,
  servingNow, tomorrowPreview,
} from "@/lib/now";
import type { ActivityDay, ActivityEvent } from "@/lib/schema";

function ev(partial: Partial<ActivityEvent>): ActivityEvent {
  return { start: null, end: null, title: "Event", location: null, dimension: null, routine: false, ...partial };
}

// 09:00 Gazette (routine, ends 10:00 by 60-min default), 10:15 Chair Yoga (ends 11:15),
// 13:00-14:00 Prize Bingo (printed end), 18:00 Evening News (last event, ends 19:00).
const day: ActivityEvent[] = [
  ev({ start: "09:00", title: "Gazette", routine: true }),
  ev({ start: "10:15", title: "Chair Yoga" }),
  ev({ start: "13:00", end: "14:00", title: "Prize Bingo" }),
  ev({ start: "18:00", title: "Evening News", routine: true }),
];

describe("clockHHMM", () => {
  test("converts UTC instant to New York wall clock", () => {
    expect(clockHHMM(new Date("2026-07-08T19:00:00Z"))).toBe("15:00");
  });
  test("midnight is 00, not 24", () => {
    expect(clockHHMM(new Date("2026-07-09T04:30:00Z"))).toBe("00:30");
  });
});

describe("minutesOf", () => {
  test("parses zero-padded HH:MM", () => {
    expect(minutesOf("09:05")).toBe(545);
  });
});

describe("greetingFor", () => {
  test.each([
    ["05:00", "Good morning"],
    ["11:59", "Good morning"],
    ["12:00", "Good afternoon"],
    ["16:59", "Good afternoon"],
    ["17:00", "Good evening"],
    ["23:30", "Good evening"],
  ])("%s -> %s", (hhmm, expected) => {
    expect(greetingFor(hhmm)).toBe(expected);
  });
});

describe("heroStateFor", () => {
  test("before the first event: upcoming, first", () => {
    expect(heroStateFor(day, "08:00")).toEqual({
      kind: "upcoming", event: day[0], first: true, minutesUntil: 60,
    });
  });
  test("exactly at start: happening now, with next", () => {
    expect(heroStateFor(day, "09:00")).toEqual({ kind: "now", event: day[0], next: day[1] });
  });
  test("default end is start + 60: over at 10:00, next up in 15", () => {
    expect(heroStateFor(day, "10:00")).toEqual({
      kind: "upcoming", event: day[1], first: false, minutesUntil: 15,
    });
  });
  test("gap between events: upcoming, not first", () => {
    expect(heroStateFor(day, "12:00")).toEqual({
      kind: "upcoming", event: day[2], first: false, minutesUntil: 60,
    });
  });
  test("printed end is honored", () => {
    expect(heroStateFor(day, "13:30")).toEqual({ kind: "now", event: day[2], next: day[3] });
  });
  test("exactly at end: no longer happening", () => {
    expect(heroStateFor(day, "14:00")).toEqual({
      kind: "upcoming", event: day[3], first: false, minutesUntil: 240,
    });
  });
  test("after the last event's default end: done", () => {
    expect(heroStateFor(day, "19:30")).toEqual({ kind: "done" });
  });
  test("default end caps at the next event's start", () => {
    const packed = [ev({ start: "09:00", title: "A" }), ev({ start: "09:30", title: "B" })];
    expect(heroStateFor(packed, "09:45")).toEqual({ kind: "now", event: packed[1], next: null });
  });
  test("unsorted input is handled", () => {
    expect(heroStateFor([...day].reverse(), "12:00")).toEqual({
      kind: "upcoming", event: day[2], first: false, minutesUntil: 60,
    });
  });
  test("no timed events: null", () => {
    expect(heroStateFor([], "12:00")).toBeNull();
    expect(heroStateFor([ev({ title: "All-day theme" })], "12:00")).toBeNull();
  });
});

describe("timelineStatuses", () => {
  test("partitions past / current / upcoming in input order", () => {
    expect(timelineStatuses(day, "13:30")).toEqual(["past", "past", "current", "upcoming"]);
  });
  test("all-day events are never past", () => {
    const withAllDay = [ev({ title: "Theme" }), ...day];
    expect(timelineStatuses(withAllDay, "19:30")).toEqual([
      "allday", "past", "past", "past", "past",
    ]);
  });
});

describe("servingNow", () => {
  const lunch = { start: "11:30", end: "13:00" };
  test("inside the window", () => {
    expect(servingNow(lunch, "12:15")).toBe(true);
  });
  test("boundaries are inclusive", () => {
    expect(servingNow(lunch, "11:30")).toBe(true);
    expect(servingNow(lunch, "13:00")).toBe(true);
  });
  test("outside the window", () => {
    expect(servingNow(lunch, "13:01")).toBe(false);
  });
  test("null clock (pre-mount) is false", () => {
    expect(servingNow(lunch, null)).toBe(false);
  });
});

describe("tomorrowPreview", () => {
  const mkDay = (events: ActivityEvent[]): ActivityDay => ({ date: "2026-07-09", theme: null, events });
  test("prefers the first timed special", () => {
    const special = ev({ start: "13:00", title: "Kroger Shopping" });
    const d = mkDay([ev({ start: "09:00", title: "Gazette", routine: true }), special]);
    expect(tomorrowPreview(d)).toBe(special);
  });
  test("falls back to the first timed event", () => {
    const routine = ev({ start: "09:00", title: "Gazette", routine: true });
    expect(tomorrowPreview(mkDay([routine]))).toBe(routine);
  });
  test("no timed events or no day: null", () => {
    expect(tomorrowPreview(mkDay([ev({ title: "All day" })]))).toBeNull();
    expect(tomorrowPreview(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/now.test.ts`
Expected: FAIL — cannot resolve `@/lib/now`

- [ ] **Step 3: Implement `lib/now.ts`**

```ts
import { APP_TIME_ZONE } from "./dates";
import type { ActivityDay, ActivityEvent } from "./schema";

const DEFAULT_EVENT_MINUTES = 60;

/** Current wall-clock time in the app time zone as zero-padded "HH:MM" (00-23 hours). */
export function clockHHMM(now: Date = new Date(), timeZone = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(now);
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function greetingFor(hhmm: string): string {
  if (hhmm < "12:00") return "Good morning";
  if (hhmm < "17:00") return "Good afternoon";
  return "Good evening";
}

type TimedEvent = ActivityEvent & { start: string };

/** Timed events in start order; "all day" events (no start) are excluded. */
function timedEvents(events: ActivityEvent[]): TimedEvent[] {
  return events
    .filter((e): e is TimedEvent => e.start !== null)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Printed end, else start + 60 minutes capped at the next event's start. */
function effectiveEndMinutes(timed: TimedEvent[], i: number): number {
  const e = timed[i];
  if (e.end) return minutesOf(e.end);
  const capped = minutesOf(e.start) + DEFAULT_EVENT_MINUTES;
  return i + 1 < timed.length ? Math.min(capped, minutesOf(timed[i + 1].start)) : capped;
}

export type HeroState =
  | { kind: "now"; event: ActivityEvent; next: ActivityEvent | null }
  | { kind: "upcoming"; event: ActivityEvent; first: boolean; minutesUntil: number }
  | { kind: "done" };

/** Hero card state at `hhmm`; null when the day has no timed events (hero not rendered). */
export function heroStateFor(events: ActivityEvent[], hhmm: string): HeroState | null {
  const timed = timedEvents(events);
  if (timed.length === 0) return null;
  const now = minutesOf(hhmm);
  for (let i = 0; i < timed.length; i++) {
    const start = minutesOf(timed[i].start);
    if (now < start) {
      return { kind: "upcoming", event: timed[i], first: i === 0, minutesUntil: start - now };
    }
    if (now < effectiveEndMinutes(timed, i)) {
      return { kind: "now", event: timed[i], next: timed[i + 1] ?? null };
    }
  }
  return { kind: "done" };
}

export type TimelineStatus = "past" | "current" | "upcoming" | "allday";

/** Status per event, in input order. All-day events are "allday" and never fade. */
export function timelineStatuses(events: ActivityEvent[], hhmm: string): TimelineStatus[] {
  const timed = timedEvents(events);
  const now = minutesOf(hhmm);
  return events.map((e) => {
    if (e.start === null) return "allday";
    const i = timed.indexOf(e as TimedEvent);
    if (now >= effectiveEndMinutes(timed, i)) return "past";
    if (now >= minutesOf(e.start)) return "current";
    return "upcoming";
  });
}

/** True while `hhmm` is inside the meal's serving window (inclusive). */
export function servingNow(meal: { start: string; end: string }, hhmm: string | null): boolean {
  return hhmm !== null && hhmm >= meal.start && hhmm <= meal.end;
}

/** What the day-complete hero advertises for tomorrow: first timed special, else first timed event. */
export function tomorrowPreview(day: ActivityDay | null): ActivityEvent | null {
  if (!day) return null;
  const timed = timedEvents(day.events);
  return timed.find((e) => !e.routine) ?? timed[0] ?? null;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- tests/now.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Run the whole unit suite and lint**

Run: `npm test && npm run lint`
Expected: all pass, no new lint errors

- [ ] **Step 6: Commit**

```bash
git add lib/now.ts tests/now.test.ts
git commit -m "feat: add pure time logic for the living home screen"
```

---

### Task 3: `useNow()` hook, Fraunces font, and the celebrated masthead

**Files:**
- Create: `components/useNow.ts`, `components/MagnoliaFlourish.tsx`
- Modify: `app/layout.tsx` (font only), `app/globals.css` (font token), `components/HomeClient.tsx` (masthead), `e2e/smoke.spec.ts` (heading assertions)

**Interfaces:**
- Consumes: `clockHHMM`, `greetingFor` from `lib/now.ts` (Task 2).
- Produces: `useNow(timeZone?: string): string | null` (`"HH:MM"` or null pre-mount) — Tasks 4-6 call it from `HomeClient`; `MagnoliaFlourish({ className }: { className?: string })` component.

- [ ] **Step 1: Create `components/useNow.ts`**

```ts
"use client";

import { useEffect, useState } from "react";
import { APP_TIME_ZONE } from "@/lib/dates";
import { clockHHMM } from "@/lib/now";

/** Current "HH:MM" in the app time zone at minute resolution; null until mounted. */
export function useNow(timeZone = APP_TIME_ZONE): string | null {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      setNow((current) => {
        const next = clockHHMM(new Date(), timeZone);
        return current === next ? current : next;
      });
    }

    refresh();
    const timer = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [timeZone]);

  return now;
}
```

(15-second polling with a same-value bail keeps re-renders to one per minute; focus/visibility listeners catch waking tablets, mirroring `useToday`.)

- [ ] **Step 2: Load Fraunces in `app/layout.tsx`**

Add to the imports and module scope (keep everything else in the file untouched):

```tsx
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});
```

and change the `<html>` tag to carry the variable class:

```tsx
    <html lang="en" suppressHydrationWarning className={fraunces.variable}>
```

- [ ] **Step 3: Point the display token at Fraunces in `app/globals.css`**

Change the `@theme` line:

```css
  --font-display: var(--font-fraunces), "Iowan Old Style", Palatino, "Palatino Linotype", Georgia, serif;
```

- [ ] **Step 4: Create `components/MagnoliaFlourish.tsx`**

Single-color line-art magnolia derived from the logo's petal paths (`components/MagnoliaLogo.tsx`), stroke-only so it reads as an ornament, colored by `currentColor`:

```tsx
export default function MagnoliaFlourish({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className}>
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M24 5.5c3.7 4.1 5.3 8.1 4.9 12.1-.3 3-2 5.3-4.9 6.9-2.9-1.6-4.6-3.9-4.9-6.9-.4-4 1.2-8 4.9-12.1Z" />
        <path d="M10.2 13.2c5.4.7 9.2 2.8 11.3 6.2 1.6 2.6 1.8 5.4.5 8.4-3.2.4-5.9-.4-8.1-2.4-3-2.7-4.2-6.7-3.7-12.2Z" />
        <path d="M37.8 13.2c.5 5.5-.7 9.5-3.7 12.2-2.2 2-4.9 2.8-8.1 2.4-1.3-3-1.1-5.8.5-8.4 2.1-3.4 5.9-5.5 11.3-6.2Z" />
        <path d="M13.9 35.6c1.8-5.2 4.5-8.4 8.2-9.7 2.9-1 5.6-.5 8.1 1.6-.4 3.2-1.9 5.6-4.5 7.1-3.5 2-7.4 2.3-11.8 1Z" />
      </g>
      <circle cx="24" cy="25.5" r="3" fill="currentColor" />
    </svg>
  );
}
```

- [ ] **Step 5: Rebuild the masthead in `components/HomeClient.tsx`**

Add imports:

```tsx
import { greetingFor } from "@/lib/now";
import { useNow } from "@/components/useNow";
import MagnoliaFlourish from "@/components/MagnoliaFlourish";
```

Inside `HomeClient`, after `const today = useToday();` add:

```tsx
  const now = useNow();
```

Replace the current heading block

```tsx
        <h1 className="font-display text-3xl font-semibold">{pageTitle(pick)}</h1>
        <p className="mt-1 text-moss">
          {activeDateLabel}
          {pick !== "week" && day?.theme && (
            <span className="font-display italic text-copper"> · {day.theme}</span>
          )}
        </p>
```

with a today-vs-other split (Tomorrow and This Week keep the current masthead exactly):

```tsx
        {pick === "today" ? (
          <>
            <p className="text-moss">{now ? greetingFor(now) : " "}</p>
            <h1 className="font-display text-4xl font-semibold">
              {dayNameOfISO(date)}, {longDateOfISO(date)}
            </h1>
            {day?.theme && (
              <p className="mt-1.5 flex items-center gap-2 font-display text-xl italic text-copper">
                <MagnoliaFlourish className="h-5 w-5 shrink-0" />
                {day.theme}
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-semibold">{pageTitle(pick)}</h1>
            <p className="mt-1 text-moss">
              {activeDateLabel}
              {day?.theme && pick !== "week" && (
                <span className="font-display italic text-copper"> · {day.theme}</span>
              )}
            </p>
          </>
        )}
```

(`pageTitle` no longer needs a `"today"` branch but leaving it is harmless — do not expand scope.)

- [ ] **Step 6: Update the two heading assertions in `e2e/smoke.spec.ts`**

The Today view's h1 is now the date. In the "home: day pills…" test and the hydration test, change:

```ts
  await expect(page.getByRole("heading", { name: "Today's Activities" })).toBeVisible();
```

to:

```ts
  await expect(page.getByRole("heading", { name: "Wednesday, July 8, 2026" })).toBeVisible();
```

(The "Tomorrow's Activities" assertion is unchanged — that view keeps its title.)

- [ ] **Step 7: Verify**

Run: `npm test && npm run lint && npm run test:e2e`
Expected: all pass (5 e2e)

Then look at it: with the user's dev server on port 3000, capture and **actually read** a screenshot:

```bash
cat > "$SCRATCHPAD/mast.ts" <<'EOF'
import { chromium } from "@playwright/test";
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.clock.install({ time: new Date("2026-07-08T19:00:00Z") });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.screenshot({ path: process.env.SCRATCHPAD + "/masthead.png", fullPage: true });
  await browser.close();
})();
EOF
NODE_PATH="$PWD/node_modules" npx tsx "$SCRATCHPAD/mast.ts"
```

(`SCRATCHPAD` = the session scratchpad directory.) Check: greeting reads "Good afternoon", the date is set in Fraunces (visibly different serif — high-contrast a's and g's), theme line shows the flourish + "Nat'l Raspberry Day" in italic copper.

- [ ] **Step 8: Commit**

```bash
git add components/useNow.ts components/MagnoliaFlourish.tsx app/layout.tsx app/globals.css components/HomeClient.tsx e2e/smoke.spec.ts
git commit -m "feat: Fraunces display serif and time-aware masthead"
```

---

### Task 4: Hero card — "Happening now / Up next"

**Files:**
- Create: `components/HeroCard.tsx`
- Modify: `components/HomeClient.tsx`

**Interfaces:**
- Consumes: `HeroState`, `heroStateFor`, `tomorrowPreview` from `lib/now.ts`; `useNow` (already wired in Task 3); `DIMENSION_META`; `DimensionChip`; `formatTime`.
- Produces: `HeroCard({ state, tomorrow, tomorrowMissing })` — `state: HeroState | null`, `tomorrow: ActivityEvent | null`, `tomorrowMissing: boolean`.

- [ ] **Step 1: Create `components/HeroCard.tsx`**

```tsx
import type { CSSProperties } from "react";
import type { HeroState } from "@/lib/now";
import type { ActivityEvent } from "@/lib/schema";
import { formatTime } from "@/lib/dates";
import { DIMENSION_META } from "@/lib/dimensions";
import DimensionChip from "@/components/DimensionChip";

/** Soft dimension-tinted wash over the card surface; undefined when unclassified. */
function wash(event: ActivityEvent): CSSProperties | undefined {
  if (!event.dimension) return undefined;
  const tint = DIMENSION_META[event.dimension].bg;
  return { backgroundColor: `color-mix(in srgb, ${tint} 45%, var(--color-card))` };
}

function startsIn(minutesUntil: number, start: string): string {
  if (minutesUntil >= 60) return `At ${formatTime(start)}`;
  return minutesUntil === 1 ? "Starts in 1 minute" : `Starts in ${minutesUntil} minutes`;
}

function timeRange(e: ActivityEvent): string {
  if (!e.start) return "All day";
  return e.end ? `${formatTime(e.start)} – ${formatTime(e.end)}` : formatTime(e.start);
}

export default function HeroCard({
  state,
  tomorrow,
  tomorrowMissing,
}: {
  state: HeroState | null;
  tomorrow: ActivityEvent | null;
  tomorrowMissing: boolean;
}) {
  if (!state) return null;

  if (state.kind === "done") {
    return (
      <section aria-label="Right now" className="rounded-2xl border border-hairline bg-card px-5 py-4 shadow-sm">
        <p className="font-display text-2xl font-semibold">That&apos;s all for today</p>
        {tomorrow?.start ? (
          <p className="mt-1 text-moss">
            Tomorrow: {tomorrow.title}, {formatTime(tomorrow.start)}
          </p>
        ) : tomorrowMissing ? (
          <p className="mt-1 text-moss">Tomorrow&apos;s calendar hasn&apos;t been added yet.</p>
        ) : null}
      </section>
    );
  }

  const e = state.event;
  const label = state.kind === "now" ? "Happening now" : state.first ? "First up today" : "Up next";
  return (
    <section
      aria-label="Right now"
      className="rounded-2xl border border-hairline bg-card px-5 py-4 shadow-md"
      style={wash(e)}
    >
      <p className="text-[13px] font-bold uppercase tracking-wider text-copper">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold leading-snug">{e.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-moss">
        <span className="font-semibold tabular-nums text-copper">
          {state.kind === "now" ? timeRange(e) : startsIn(state.minutesUntil, e.start!)}
        </span>
        {e.location && <span>{e.location}</span>}
        {e.dimension && <DimensionChip dimension={e.dimension} />}
      </div>
      {state.kind === "now" && state.next?.start && (
        <p className="mt-3 border-t border-hairline/70 pt-2 text-moss">
          Up next: {state.next.title} at {formatTime(state.next.start)}
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Integrate into `components/HomeClient.tsx`**

Add imports:

```tsx
import { greetingFor, heroStateFor, tomorrowPreview } from "@/lib/now";
import HeroCard from "@/components/HeroCard";
```

(`greetingFor` is already imported from Task 3 — merge into one import line.)

After the `const day = findActivityDay(months, date);` line, add:

```tsx
  const tomorrowDay = findActivityDay(months, addDaysISO(today, 1));
```

Directly after the closing `</div>` of the pills block (`<div className="my-4 flex items-center gap-2 sm:gap-3">…</div>`), insert:

```tsx
        {pick === "today" && now && day && (
          <div className="mb-5">
            <HeroCard
              state={heroStateFor(day.events, now)}
              tomorrow={tomorrowPreview(tomorrowDay)}
              tomorrowMissing={tomorrowDay === null}
            />
          </div>
        )}
```

- [ ] **Step 3: Verify all states behave**

Run: `npm test && npm run lint`
Expected: pass

Screenshot at three pinned times against the dev server (adapt the Task 3 script; `page.clock.install` times): `19:00Z` (3 PM — expect "Happening now · Wind Down Wednesday with Live Entertainment", physical-dimension wash, "Up next: Brain Teasers & Word Search at 5:00 PM"), `12:00Z` (8 AM — "First up today"), `2026-07-09T00:30:00Z` (8:30 PM — "That's all for today" + "Tomorrow: Kroger Shopping, 1:00 PM"). Read each screenshot.

- [ ] **Step 4: Commit**

```bash
git add components/HeroCard.tsx components/HomeClient.tsx
git commit -m "feat: add happening-now hero card to home"
```

---

### Task 5: Timeline redesign — spine, cards, fading, now-marker

**Files:**
- Modify: `components/Timeline.tsx` (full rewrite below), `components/HomeClient.tsx` (pass `now`)

**Interfaces:**
- Consumes: `timelineStatuses`, `TimelineStatus` from `lib/now.ts`; `DIMENSION_META`; framer-motion `motion`, `useReducedMotion`.
- Produces: `Timeline({ events, now })` — `now?: string | null` is **optional, default null**; `CalendarClient` keeps calling `<Timeline events={...} />` unchanged and gets no marker/fading.

- [ ] **Step 1: Rewrite `components/Timeline.tsx`**

```tsx
"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ActivityEvent } from "@/lib/schema";
import { formatTime } from "@/lib/dates";
import { timelineStatuses, type TimelineStatus } from "@/lib/now";
import { DIMENSION_META } from "@/lib/dimensions";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";

export default function Timeline({ events, now = null }: { events: ActivityEvent[]; now?: string | null }) {
  const reduced = useReducedMotion();
  if (events.length === 0) return <EmptyState message="No activities listed for this day." />;

  const statuses: TimelineStatus[] = now
    ? timelineStatuses(events, now)
    : events.map(() => "upcoming");
  const markerIndex = now ? statuses.findIndex((s) => s === "current" || s === "upcoming") : -1;

  return (
    <div className="relative ml-1.5 border-l border-hairline py-1 pl-5">
      {events.map((e, i) => (
        <Fragment key={i}>
          {i === markerIndex && <NowMarker now={now!} />}
          <TimelineRow event={e} index={i} past={now !== null && statuses[i] === "past"} reduced={!!reduced} />
        </Fragment>
      ))}
    </div>
  );
}

function NowMarker({ now }: { now: string }) {
  return (
    <div aria-hidden="true" className="relative my-1.5 flex items-center gap-2">
      <span className="absolute -left-[1.45rem] h-2 w-2 rounded-full bg-copper" />
      <span className="h-px flex-1 bg-copper/60" />
      <span className="text-[13px] font-bold uppercase tracking-wider text-copper">
        Now · {formatTime(now)}
      </span>
    </div>
  );
}

function TimelineRow({
  event: e,
  index,
  past,
  reduced,
}: {
  event: ActivityEvent;
  index: number;
  past: boolean;
  reduced: boolean;
}) {
  const time = (
    <span
      className={`w-18 shrink-0 pt-0.5 text-right tabular-nums sm:w-20 ${
        e.routine ? "text-moss" : "font-semibold text-copper"
      }`}
    >
      {e.start ? formatTime(e.start) : "All day"}
    </span>
  );

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
      className={`relative py-1.5 ${past ? "opacity-70" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`absolute -left-[1.44rem] top-[0.95rem] h-2.5 w-2.5 rounded-full border-2 border-petal ${
          e.routine ? "bg-hairline" : "bg-copper"
        }`}
      />
      {e.routine ? (
        <div className="flex items-baseline gap-3 py-0.5">
          {time}
          <span className="text-moss">{e.title}</span>
        </div>
      ) : (
        <div className="flex gap-3">
          {time}
          <div
            className="min-w-0 flex-1 rounded-xl border border-hairline bg-card px-4 py-3 shadow-sm"
            style={
              e.dimension
                ? { borderLeft: `3px solid ${DIMENSION_META[e.dimension].dot}` }
                : undefined
            }
          >
            <div className="text-lg font-semibold leading-snug">{e.title}</div>
            {(e.location || e.dimension) && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-moss">
                {e.location && <span>{e.location}</span>}
                {e.dimension && <DimensionChip dimension={e.dimension} />}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
```

Notes:
- `useReducedMotion()` only reads the OS `prefers-reduced-motion` setting; it does not see the `MotionConfig` from `app/template.tsx`, so the app's own reduced-motion toggle would silently fail to disable this animation. Use `useReducedMotionConfig()` instead, which merges the `MotionConfig` context with the OS preference — `initial={false}` then skips the entrance animation entirely, satisfying the spec's "disabled under either path".
- The marker is hidden when everything is past (`markerIndex === -1`) — the hero's "That's all for today" already covers that state.
- `opacity-70` for past rows keeps moss/ink text above AA on both palettes (verify in Step 3; if a contrast checker disagrees, raise toward `opacity-80` rather than shipping a violation).

- [ ] **Step 2: Pass `now` from `components/HomeClient.tsx`**

Change the Today/Tomorrow timeline call:

```tsx
          day
            ? <Timeline events={day.events} now={pick === "today" ? now : null} />
            : <EmptyState message={`${monthNameOfISO(date)}'s calendar hasn't been added yet.`} />
```

`CalendarClient` needs no change (prop is optional).

- [ ] **Step 3: Verify**

Run: `npm test && npm run lint && npm run test:e2e`
Expected: pass

Screenshot at pinned 3 PM (Task 3 script): confirm the spine + dots render, 9:00/9:30 routine rows are faded, the "Now · 3:00 PM" marker sits above the Wind Down Wednesday card, special cards have tinted left edges, and dots sit centered on the spine (adjust the `-left-[…]` offsets if the dev-server screenshot shows drift — they depend on border width). Also screenshot `/calendar`, open a day dialog, and confirm the day-detail timeline still renders sanely with no marker and no fading.

- [ ] **Step 4: Commit**

```bash
git add components/Timeline.tsx components/HomeClient.tsx
git commit -m "feat: true timeline with spine, event cards, and now marker"
```

---

### Task 6: Menu sidebar meal cards with "Serving now"

**Files:**
- Modify: `components/MealCards.tsx` (replace `MEAL_HOURS` with `MEALS` + `mealHours`), `components/HomeClient.tsx` (`MenuSummary` redesign)

**Interfaces:**
- Consumes: `servingNow` from `lib/now.ts`; `formatTime` from `lib/dates.ts`.
- Produces: from `components/MealCards.tsx`: `MEALS: readonly { key: "breakfast" | "lunch" | "dinner"; label: string; start: string; end: string }[]` and `mealHours(meal: { start: string; end: string }): string`. The old `MEAL_HOURS` export is deleted; `HomeClient` is its only outside consumer (verified by grep) and is updated here.

- [ ] **Step 1: Restructure the meal constants in `components/MealCards.tsx`**

Replace the `MEAL_HOURS` block with:

```tsx
import { formatTime } from "@/lib/dates";

/** Serving hours are placeholders until the real printed menu is photographed (spec open item). */
export const MEALS = [
  { key: "breakfast", label: "Breakfast", start: "07:30", end: "09:00" },
  { key: "lunch", label: "Lunch", start: "11:30", end: "13:00" },
  { key: "dinner", label: "Dinner", start: "17:00", end: "18:30" },
] as const;

export function mealHours({ start, end }: { start: string; end: string }): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}
```

and update the component's own loop from `MEAL_HOURS.map(([key, label, hours]) => …)` to:

```tsx
      {MEALS.map(({ key, label, start, end }) => {
        const meal = day?.[key] ?? null;
        return (
          <section key={key} className="py-4">
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold">{label}</h2>
              <span className="shrink-0 tabular-nums text-moss">{mealHours({ start, end })}</span>
            </div>
```

(the rest of the body is unchanged — `/menu` keeps its current look; "Serving now" is home-sidebar-only per spec).

- [ ] **Step 2: Redesign `MenuSummary` in `components/HomeClient.tsx`**

Update the import from MealCards and add `servingNow`:

```tsx
import { greetingFor, heroStateFor, servingNow, tomorrowPreview } from "@/lib/now";
import { MEALS, mealHours } from "@/components/MealCards";
```

Change the `MenuSummary` call site to pass the clock (badge only applies to today's menu, never tomorrow's):

```tsx
          <MenuSummary day={menuDay} date={menuDate} title={menuTitle} now={pick === "today" ? now : null} />
```

Replace the whole `MenuSummary` function with:

```tsx
function MenuSummary({
  day,
  date,
  title,
  now,
}: {
  day: MenuDay | null;
  date: string;
  title: string;
  now: string | null;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-moss">
          {dayNameOfISO(date)}, {longDateOfISO(date)}
        </p>
      </div>

      {!day && <p className="mb-3">The menu for this date hasn&apos;t been added yet.</p>}

      <div className="space-y-3">
        {MEALS.map((meal) => {
          const items = day?.[meal.key].items ?? null;
          return (
            <section key={meal.key} className="rounded-xl border border-hairline bg-card px-4 py-3 shadow-sm">
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h3 className="text-[15px] font-bold uppercase tracking-wider text-ink">{meal.label}</h3>
                {servingNow(meal, now) ? (
                  <span className="rounded-full bg-copper px-2.5 py-0.5 text-[13px] font-bold text-petal">
                    Serving now
                  </span>
                ) : (
                  <span className="tabular-nums text-moss">{mealHours(meal)}</span>
                )}
              </div>
              {items === null ? (
                <ul className="space-y-1" aria-label="Menu pending">
                  {Array.from({ length: 3 }, (_, index) => (
                    <li key={index} className="flex gap-2 leading-snug text-moss">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper/50" />
                      <span className="tracking-widest">...</span>
                    </li>
                  ))}
                </ul>
              ) : items.length === 0 ? (
                <p className="text-moss">Not listed</p>
              ) : (
                <ul className="space-y-1">
                  {items.map((item, index) => (
                    <li key={index} className="flex gap-2 leading-snug">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                      <span className={item.kind === "dessert" ? "text-copper" : ""}>
                        {item.kind === "dessert" && (
                          <span aria-hidden="true" className="mr-1 text-[11px] align-middle">◆</span>
                        )}
                        {item.name}
                      </span>
                    </li>
                  ))}
                  </ul>
              )}
            </section>
          );
        })}
      </div>

      <Link href="/menu" className="mt-4 inline-block font-semibold text-copper underline-offset-4 hover:underline">
        Full menu
      </Link>
    </section>
  );
}
```

(This removes `MenuSummary`'s old per-meal duplicated markup and the serving-hours line under each heading; the hours now live in the card header. `formatTime` may drop out of `HomeClient`'s imports if now unused — let lint tell you.)

- [ ] **Step 3: Verify**

Run: `npm test && npm run lint && npm run test:e2e`
Expected: pass (the "Roasted Turkey" sidebar assertion still holds)

Screenshots at pinned 3 PM (no badge, hours shown) and pinned `2026-07-08T16:30:00Z` = 12:30 PM (Lunch card shows "Serving now" instead of its hours; Breakfast/Dinner show hours). Read them; check the ◆ dessert mark renders at a sensible size next to "Apple Cake".

- [ ] **Step 4: Commit**

```bash
git add components/MealCards.tsx components/HomeClient.tsx
git commit -m "feat: meal cards with serving-now badge in home sidebar"
```

---

### Task 7: New e2e coverage and full verification

**Files:**
- Modify: `e2e/smoke.spec.ts` (append two tests)

**Interfaces:**
- Consumes: everything shipped in Tasks 3-6; the `pinClock` helper from Task 1.

- [ ] **Step 1: Append hero/now-marker and serving-now tests to `e2e/smoke.spec.ts`**

```ts
test("home: hero card and now marker are time-aware", async ({ page }) => {
  await pinClock(page); // 3:00 PM — Wind Down Wednesday (15:00) is in progress
  await page.goto("/");
  const hero = page.getByLabel("Right now");
  await expect(hero.getByText("Happening now")).toBeVisible();
  await expect(hero.getByText("Wind Down Wednesday with Live Entertainment")).toBeVisible();
  await expect(hero.getByText("Up next: Brain Teasers & Word Search at 5:00 PM")).toBeVisible();
  await expect(page.getByText("Now · 3:00 PM")).toBeVisible();
  await expect(page.getByText("Good afternoon")).toBeVisible();
});

test("home: lunch shows serving-now badge during its window", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-07-08T16:30:00Z") }); // 12:30 PM EDT
  await page.goto("/");
  await expect(page.getByText("Serving now")).toBeVisible();
  const hero = page.getByLabel("Right now");
  await expect(hero.getByText("Up next")).toBeVisible();
  await expect(hero.getByText("Starts in 30 minutes")).toBeVisible();
});
```

(Do not include the struck first version of the second test — only the corrected one.)

- [ ] **Step 2: Run everything**

Run: `npm run lint && npm test && npm run test:e2e`
Expected: lint clean; all unit tests pass; 7 e2e tests pass

- [ ] **Step 3: Production build check**

Run: `npm run build`
Expected: build succeeds (schema validation and static generation both pass)

- [ ] **Step 4: Commit**

```bash
git add e2e/smoke.spec.ts
git commit -m "test: cover hero card, now marker, and serving-now badge"
```

- [ ] **Step 5: Final visual pass**

Screenshot home at phone (390×844) and desktop (1440×900) at pinned 3 PM, plus the high-contrast mode (click the accessibility control → High contrast, or set `document.documentElement.dataset.contrast = "high"` before screenshotting). Read all screenshots: nothing clipped at phone width, hero card wash still leaves text ≥ AA in high contrast, timeline dots aligned. Fix any visual defects found before declaring done.
