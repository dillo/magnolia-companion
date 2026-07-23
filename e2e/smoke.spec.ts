import { test, expect, type Page } from "@playwright/test";

// Pin the browser clock inside the committed fixture data (Wed 2026-07-08, 3:00 PM EDT).
async function pinClock(page: Page) {
  await page.clock.install({ time: new Date("2026-07-08T19:00:00Z") });
}

test("home: activities and meals use their navigation defaults", async ({ page, context }) => {
  await pinClock(page);
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Activities" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Today", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Wednesday, July 8, 2026" })).toBeVisible();
  await expect(page.getByText("Nat'l Raspberry Day").first()).toBeVisible();
  await expect(page.getByText("Roasted Turkey")).not.toBeVisible();

  await page.getByRole("tab", { name: "Meals" }).click();
  await expect(page.getByText("Today’s meals")).toBeVisible();
  await expect(page.getByText("Roasted Turkey")).toBeVisible();
  await expect(
    page.getByRole("tabpanel", { name: "Meals" }).getByRole("heading", { name: "Upcoming Holidays" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Tomorrow", exact: true }).click();
  await expect(page.getByText("Tomorrow’s meals")).toBeVisible();
  await page.getByRole("link", { name: "Calendar" }).click();
  await expect(page.getByRole("heading", { name: "July 2026" })).toBeVisible();
  await page.getByRole("banner").getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Meals" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Today", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Roasted Turkey")).toBeVisible();

  await page.getByRole("tab", { name: "Activities" }).click();
  await expect(page.getByRole("button", { name: "Today", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Wednesday, July 8, 2026" })).toBeVisible();
  await page.getByRole("button", { name: "This Week", exact: true }).click();
  await expect(page.getByText("daily routine items").first()).toBeVisible();
  await expect(page.getByText("Therapy Dog Visit with Canine Assistants")).toBeVisible();

  await page.getByRole("link", { name: "Calendar" }).click();
  await expect(page.getByRole("heading", { name: "July 2026" })).toBeVisible();
  await page.getByRole("banner").getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Activities" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Today", exact: true })).toHaveAttribute("aria-pressed", "true");

  const newTab = await context.newPage();
  await pinClock(newTab);
  await newTab.goto("/");
  await expect(newTab.getByRole("tab", { name: "Activities" })).toHaveAttribute("aria-selected", "true");
  await expect(newTab.getByRole("button", { name: "Today", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("calendar: grid, filter, day detail", async ({ page }) => {
  await pinClock(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: "July 2026" })).toBeVisible();

  const filter = page.getByLabel("Activity type");
  await filter.selectOption("emotional");
  await expect(filter).toHaveValue("emotional");

  await page.getByRole("button", { name: /Therapy Dog/ }).click();
  await expect(
    page.getByRole("dialog").getByText("Therapy Dog Visit with Canine Assistants"),
  ).toBeVisible();
});

test("nav: current page is marked active", async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Calendar" })).not.toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Calendar" }).click();
  await expect(nav.getByRole("link", { name: "Calendar" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current", "page");
});

test("no hydration errors, including under reduced motion", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await pinClock(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Wednesday, July 8, 2026" })).toBeVisible();
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

test("explore: drive-time bands, no auto-opened dialog, category filter", async ({ page }) => {
  await pinClock(page);
  await page.goto("/explore");
  await expect(page.getByText("Under 5 minutes")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /^Parks/ }).click();
  await expect(page.getByText("Chattahoochee Nature Center")).toBeVisible();
  await expect(page.getByText("Bowlero Roswell")).not.toBeVisible();
});

test("faq: search filters questions live", async ({ page }) => {
  await pinClock(page);
  await page.goto("/faq");
  await expect(page.getByText("What about keys?")).toBeVisible();
  await page.getByRole("searchbox", { name: "Search the handbook" }).fill("billing");
  await expect(page.getByText("How does billing work?")).toBeVisible();
  await expect(page.getByText("What about keys?")).not.toBeVisible();
  await expect(page.getByText(/answers? match/)).toBeVisible();
});

test("home: lunch shows serving-now badge during its window", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-07-08T16:30:00Z") }); // 12:30 PM EDT
  await page.goto("/");
  await page.getByRole("tab", { name: "Meals" }).click();
  await expect(page.getByText("Serving now")).toBeVisible();
  await page.getByRole("tab", { name: "Activities" }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  const hero = page.getByLabel("Right now");
  await expect(hero.getByText("Up next")).toBeVisible();
  await expect(hero.getByText("Starts in 30 minutes")).toBeVisible();
});

test("disclaimer: identifies the app as independent and unofficial", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "About & Disclaimer" }).click();

  await expect(page).toHaveTitle("Disclaimer | Magnolia Companion");
  await expect(page.getByRole("heading", { name: "Disclaimer" })).toBeVisible();
  await expect(page.getByText(/not operated by, affiliated with, endorsed by, or sponsored by/)).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /independent, unofficial relationship/,
  );
});

test("contacts: staff directory groups the published contacts", async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Directory" }).click();

  await expect(page).toHaveTitle("Staff Directory | Magnolia Companion");
  await expect(page.getByRole("heading", { name: "Staff Directory" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fire Department" })).toBeVisible();
  await expect(page.getByText("Roswell Fire Station 24")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Police Department" })).toBeVisible();
});

test("mobile: footer clears the fixed navigation without excess space", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const disclaimerLink = page.getByRole("link", { name: "About & Disclaimer" });
  const bottomNav = page.locator('nav[aria-label="Main"]:visible');
  await disclaimerLink.scrollIntoViewIfNeeded();
  await expect(disclaimerLink).toBeVisible();

  const linkBox = await disclaimerLink.boundingBox();
  const navBox = await bottomNav.boundingBox();
  expect(linkBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  const gap = navBox!.y - (linkBox!.y + linkBox!.height);
  expect(gap).toBeGreaterThanOrEqual(0);
  expect(gap).toBeLessThan(24);
});
