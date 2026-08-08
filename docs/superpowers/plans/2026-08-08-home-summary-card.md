# Home Summary Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the home page's "Today at a glance" summary card phone-only, and separate its Activities and Meals halves with two distinct surfaces instead of three identical hairlines.

**Architecture:** All component work is in one file, `components/HomeClient.tsx`. Task 1 hides the card from the `md` breakpoint up and deletes the now-unreachable two-lane grid. Task 2 reworks the shared `SummaryHeader` and the two summary sections so the halves sit on different grounds, carry the tab strip's icons, and keep the status pill legible on white. Test work is in `e2e/smoke.spec.ts`.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, Tailwind CSS v4 (default breakpoints — `sm` 640px, `md` 768px, `lg` 1024px), Playwright, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-08-home-summary-card-design.md`

## Global Constraints

- **Read the Next.js docs before writing code.** Per `AGENTS.md`, this Next.js version has breaking changes versus training data. The relevant guides are in `node_modules/next/dist/docs/`. This plan touches only client-component JSX and Tailwind classes, so the risk is low, but do not assume App Router APIs behave as you remember.
- **No new color tokens.** Every class used here already exists in `app/globals.css`: `bg-summary` (`#F2DEE8`), `bg-card` (`#FFFFFF`), `text-summary-accent` (`#813458`), `text-copper`, `text-petal`, `bg-copper`, `border-hairline`.
- **Do not change what the summary says.** `heroStateFor` / `mealMomentFor` in `lib/now.ts` and all status-string logic stay exactly as they are. This is organization and visibility only.
- **Do not touch** the tab strip, tab panels, `Timeline`, `MealCards`, or `HelpfulToday`.
- **Playwright `getByRole` ignores elements hidden by `display: none`.** This is why `md:hidden` makes `toBeHidden()` assertions work, and why role queries stay unambiguous across breakpoints.
- **The header's nav is `lg:flex`** (`components/SiteHeader.tsx:45`), so below 1024px the banner has no "Home" link and "Calendar" sits behind the collapsed More menu in `BottomNav`. Never add a phone viewport to a test that clicks page-to-page navigation links.

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `components/HomeClient.tsx` | Home page client shell; owns `SummaryHeader`, `TodayActivitySummary`, `TodayMealSummary`, `HomeSectionIcon` | Modify — card wrapper (`:116`), both summary sections, `SummaryHeader` |
| `e2e/smoke.spec.ts` | Playwright coverage | Modify — 5 tests |

No new files. `HomeClient.tsx` is large but its summary pieces are already colocated and small; splitting them out is not warranted by this change.

---

### Task 1: Make the summary card phone-only

**Files:**
- Modify: `components/HomeClient.tsx:116` (card wrapper), `:348` (`TodayActivitySummary` section), `:441` (`TodayMealSummary` section)
- Test: `e2e/smoke.spec.ts:8-18` (remove summary assertions), `:59-91` (rewrite), `:287`, `:429`, `:461` (viewport)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: the card wrapper keeps its `<section aria-label="Today at a glance">` parent and its `overflow-hidden rounded-2xl border border-hairline bg-summary shadow-sm` classes, which Task 2 relies on for corner clipping. The `aria-label="Activity summary"` and `aria-label="Meal summary"` region names are unchanged.

- [ ] **Step 1: Move the summary assertions out of the desktop navigation test**

In `e2e/smoke.spec.ts`, the test at line 8 runs at Playwright's default 1280px viewport and clicks page-to-page nav links, so it must stay on desktop — but lines 11-18 assert on the summary card, which will no longer render there. Delete those assertions. Their coverage moves to Step 2's test.

Replace lines 10-18, which currently read:

```ts
  await page.goto("/");
  const todaySummary = page.getByRole("region", { name: "Today at a glance" });
  await expect(todaySummary.getByRole("heading", { name: "Activities" })).toBeVisible();
  await expect(todaySummary.getByRole("heading", { name: "Meals" })).toBeVisible();
  const summaryBox = await todaySummary.boundingBox();
  const sectionTabsBox = await page.getByRole("tablist", { name: "Home sections" }).boundingBox();
  expect(summaryBox).not.toBeNull();
  expect(sectionTabsBox).not.toBeNull();
  expect(summaryBox!.y + summaryBox!.height).toBeLessThanOrEqual(sectionTabsBox!.y);
  await expect(page.getByRole("tab", { name: "Activities" })).toHaveAttribute("aria-selected", "true");
```

with:

```ts
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Activities" })).toHaveAttribute("aria-selected", "true");
```

Leave the rest of the test untouched.

- [ ] **Step 2: Rewrite the tablet-lanes test as a phone-only stack test**

Replace the whole test at `e2e/smoke.spec.ts:59-91` with:

```ts
test("home: Today summary is a phone-only stack", async ({ page }) => {
  await pinClock(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const activity = page.getByRole("region", { name: "Activity summary" });
  const meal = page.getByRole("region", { name: "Meal summary" });
  await expect(activity.getByRole("heading", { name: "Activities" })).toBeVisible();
  await expect(meal.getByRole("heading", { name: "Meals" })).toBeVisible();

  const mobileActivityBox = await activity.boundingBox();
  const mobileMealBox = await meal.boundingBox();
  expect(mobileActivityBox).not.toBeNull();
  expect(mobileMealBox).not.toBeNull();
  expect(mobileMealBox!.y).toBeGreaterThanOrEqual(mobileActivityBox!.y + mobileActivityBox!.height - 1);
  expect(Math.abs(mobileMealBox!.x - mobileActivityBox!.x)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  const summaryBox = await page.getByRole("region", { name: "Today at a glance" }).boundingBox();
  const sectionTabsBox = await page.getByRole("tablist", { name: "Home sections" }).boundingBox();
  expect(summaryBox).not.toBeNull();
  expect(sectionTabsBox).not.toBeNull();
  expect(summaryBox!.y + summaryBox!.height).toBeLessThanOrEqual(sectionTabsBox!.y);

  // From md up, the tab panels below carry the same information in full, so the
  // card is hidden and the date masthead runs straight into the tab strip.
  await page.setViewportSize({ width: 800, height: 1024 });
  await expect(activity).toBeHidden();
  await expect(meal).toBeHidden();
  await expect(page.getByRole("heading", { name: "Wednesday, July 8, 2026" })).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Home sections" })).toBeVisible();

  await page.getByRole("tab", { name: "Meals" }).click();
  const breakfastBox = await page.getByRole("region", { name: "Breakfast" }).boundingBox();
  const lunchBox = await page.getByRole("region", { name: "Lunch" }).boundingBox();
  const dinnerBox = await page.getByRole("region", { name: "Dinner" }).boundingBox();
  expect(breakfastBox).not.toBeNull();
  expect(lunchBox).not.toBeNull();
  expect(dinnerBox).not.toBeNull();
  expect(Math.abs(lunchBox!.y - breakfastBox!.y)).toBeLessThanOrEqual(1);
  expect(dinnerBox!.y).toBeGreaterThan(breakfastBox!.y + breakfastBox!.height - 1);
});
```

The final `MealCards` block is kept verbatim — it exercises the meal card grid at 800px, not the summary, so that coverage must not be lost in the rename.

- [ ] **Step 3: Run the rewritten test to verify it fails**

Run: `npx playwright test -g "Today summary is a phone-only stack"`

Expected: FAIL. The `await expect(activity).toBeHidden()` assertion times out, because at 800px the card still renders as a two-lane grid.

- [ ] **Step 4: Hide the card at md and delete the two-lane layout**

In `components/HomeClient.tsx`, change the card wrapper at line 116 from:

```tsx
        <div className="mt-3 overflow-hidden rounded-2xl border border-hairline bg-summary shadow-sm sm:mt-4 md:grid md:grid-cols-2">
```

to:

```tsx
        <div className="mt-3 overflow-hidden rounded-2xl border border-hairline bg-summary shadow-sm sm:mt-4 md:hidden">
```

Note this goes on the inner `<div>`, **not** on the enclosing `<section aria-label="Today at a glance">` at line 108 — the `Masthead` (greeting, date, theme accent) must keep rendering at every width.

Then in `TodayMealSummary` (line 441), drop the dead `md:` variants. Change:

```tsx
    <section
      aria-label="Meal summary"
      className="min-w-0 border-t border-hairline md:border-l md:border-t-0"
    >
```

to:

```tsx
    <section aria-label="Meal summary" className="min-w-0 border-t border-hairline">
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx playwright test -g "Today summary is a phone-only stack"`

Expected: PASS.

- [ ] **Step 6: Move the three remaining desktop summary tests onto a phone viewport**

These three assert on summary content that now only renders below 768px. Each clicks only tabs, pills, and the notifications button — never a page-to-page nav link — so a blanket viewport change is safe. Add one line to each, immediately after its clock setup and **before** its `page.goto("/")`.

In `test("rent reminder: appears in notifications and Home Today and Tomorrow views", ...)` (line 287), after `await page.clock.install({ time: new Date("2026-07-29T11:00:00Z") });`:

```ts
  await page.setViewportSize({ width: 390, height: 844 });
```

In `test("home: hero card and now marker are time-aware", ...)` (line 429), after `await pinClock(page);`:

```ts
  await page.setViewportSize({ width: 390, height: 844 });
```

In `test("home: lunch card is highlighted during its serving window", ...)` (line 461), after `await page.clock.install({ time: new Date("2026-07-08T16:30:00Z") });`:

```ts
  await page.setViewportSize({ width: 390, height: 844 });
```

- [ ] **Step 7: Run the full e2e suite**

Run: `npm run test:e2e`

Expected: PASS, all tests. If `home: activities and meals use their navigation defaults` fails, Step 1 was applied incompletely — that test must have no summary assertions left.

- [ ] **Step 8: Commit**

```bash
git add components/HomeClient.tsx e2e/smoke.spec.ts
git commit -m "feat: show the home summary card on phones only"
```

---

### Task 2: Split the grounds, cut the hairlines, add icons

**Files:**
- Modify: `components/HomeClient.tsx` — `SummaryHeader` (line ~295), `TodayActivitySummary` section element (line ~348), `TodayMealSummary` section element (line ~441), and both `<SummaryHeader />` call sites
- Test: `e2e/smoke.spec.ts` (new test)

**Interfaces:**
- Consumes: Task 1's card wrapper, which keeps `overflow-hidden rounded-2xl` so the white half clips into the bottom corners, and `bg-summary` as the wrapper ground.
- Produces: `SummaryHeader` gains two props — `section: HomeSection` (required, selects the icon) and `pillOnLightGround?: boolean` (optional, defaults to `false`). `HomeSection` is already imported into this file at line 32 from `@/components/HomeNavigationContext`; it is the union `"activities" | "meals"`. `HomeSectionIcon` is already defined at the bottom of this file and takes `{ section: HomeSection }`.

- [ ] **Step 1: Write the failing test**

Add this test to `e2e/smoke.spec.ts`, directly after the `home: Today summary is a phone-only stack` test.

At the pinned clock (Wed 2026-07-08, 3:00 PM EDT) the Activities half is mid-event, so its pill is the emphasized copper variant, while the Meals half is between lunch and dinner, so its pill is the quiet variant — exactly the case that would vanish against a white ground.

```ts
test("home: summary halves sit on separate grounds", async ({ page }) => {
  await pinClock(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const activity = page.getByRole("region", { name: "Activity summary" });
  const meal = page.getByRole("region", { name: "Meal summary" });

  // The boundary between the halves is a surface change, not just a hairline.
  const activityGround = await activity.evaluate((el) => getComputedStyle(el).backgroundColor);
  const mealGround = await meal.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(mealGround).toBe("rgb(255, 255, 255)");
  expect(activityGround).not.toBe("rgba(0, 0, 0, 0)");
  expect(activityGround).not.toBe(mealGround);

  // Exactly one hairline in the card: the seam. The headings no longer underline.
  const activityHeader = activity.getByRole("heading", { name: "Activities" }).locator("..");
  const mealHeader = meal.getByRole("heading", { name: "Meals" }).locator("..");
  expect(await activityHeader.evaluate((el) => getComputedStyle(el).borderBottomWidth)).toBe("0px");
  expect(await mealHeader.evaluate((el) => getComputedStyle(el).borderBottomWidth)).toBe("0px");

  // Each heading carries the same glyph the tab strip below uses.
  await expect(activity.getByRole("heading", { name: "Activities" }).locator("svg")).toHaveCount(1);
  await expect(meal.getByRole("heading", { name: "Meals" }).locator("svg")).toHaveCount(1);

  // The quiet pill stays legible on the white half instead of vanishing into it.
  const nextMealPill = meal.getByText("Next meal", { exact: true });
  await expect(nextMealPill).toBeVisible();
  expect(await nextMealPill.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe("rgb(255, 255, 255)");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test -g "summary halves sit on separate grounds"`

Expected: FAIL on the first ground assertion — `mealGround` is `rgba(0, 0, 0, 0)` (transparent, inheriting the wrapper's rose) rather than `rgb(255, 255, 255)`.

- [ ] **Step 3: Rewrite `SummaryHeader`**

Replace the whole `SummaryHeader` function (starting at line 295) with:

```tsx
function SummaryHeader({
  section,
  title,
  status,
  emphasized = false,
  pillOnLightGround = false,
}: {
  section: HomeSection;
  title: string;
  status: string | null;
  emphasized?: boolean;
  pillOnLightGround?: boolean;
}) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-5">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold">
        <span aria-hidden="true" className="shrink-0 text-copper">
          <HomeSectionIcon section={section} />
        </span>
        {title}
      </h2>
      {status && (
        <span
          className={`rounded-full border px-3 py-1 font-semibold leading-tight ${
            emphasized
              ? "border-copper bg-copper text-petal"
              : `border-summary-accent/30 text-summary-accent ${
                  pillOnLightGround ? "bg-summary" : "bg-card"
                }`
          }`}
        >
          {status}
        </span>
      )}
    </div>
  );
}
```

Three changes from the original: `border-b border-hairline` is gone from the wrapper div, the `h2` becomes a flex row holding an `aria-hidden` icon plus the title, and the quiet pill's ground is now conditional.

The icon is `aria-hidden`, so the heading's accessible name stays `"Activities"` / `"Meals"` and every existing `getByRole("heading", …)` query keeps working. Use the bare glyph — do **not** wrap it in the `rounded-full bg-sand` badge the tab strip uses, since a sand disc on the rose ground would add a third competing tint.

- [ ] **Step 4: Give each half an explicit ground and update both call sites**

In `TodayActivitySummary` (line ~348), change:

```tsx
    <section aria-label="Activity summary" className="min-w-0">
      <SummaryHeader title="Activities" status={status} emphasized={state?.kind === "now"} />
```

to:

```tsx
    <section aria-label="Activity summary" className="min-w-0 bg-summary">
      <SummaryHeader
        section="activities"
        title="Activities"
        status={status}
        emphasized={state?.kind === "now"}
      />
```

The wrapper already carries `bg-summary`; declaring it on the section too makes each half state its own ground rather than relying on inheritance, which is what the test asserts.

In `TodayMealSummary` (line ~441, as left by Task 1), change:

```tsx
    <section aria-label="Meal summary" className="min-w-0 border-t border-hairline">
      <SummaryHeader title="Meals" status={status} emphasized={moment?.kind === "serving"} />
```

to:

```tsx
    <section aria-label="Meal summary" className="min-w-0 border-t border-hairline bg-card">
      <SummaryHeader
        section="meals"
        title="Meals"
        status={status}
        emphasized={moment?.kind === "serving"}
        pillOnLightGround
      />
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx playwright test -g "summary halves sit on separate grounds"`

Expected: PASS.

- [ ] **Step 6: Run the full suite, lint, and build**

```bash
npm test
npm run lint
npm run test:e2e
npm run build
```

Expected: all PASS with no TypeScript errors. `npm test` runs Vitest with `--passWithNoTests`, so a clean run there is expected — the real coverage for this change is Playwright.

- [ ] **Step 7: Commit**

```bash
git add components/HomeClient.tsx e2e/smoke.spec.ts
git commit -m "feat: separate summary card halves with distinct grounds and icons"
```

---

## Verification

After both tasks, confirm by eye at 390px (`npm run dev`, then a 390px-wide window on `http://localhost:3000`):

1. The card shows one rose half and one white half, split by a single hairline.
2. Each half's title is preceded by a copper glyph matching the tab below it.
3. The date masthead still renders, and at 800px+ the card is gone while the masthead and tabs remain.
4. Around a live event or meal window, the copper "Happening now" / "Serving now" pill still reads as the loudest thing in the card.
