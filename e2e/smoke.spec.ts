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
    page.getByRole("tabpanel", { name: "Meals" }).getByRole("heading", { name: "Helpful today" }),
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
  await expect(page.getByRole("button", { name: "Previous month" }).locator("svg")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next month" }).locator("svg")).toBeVisible();

  const filter = page.getByLabel("Activity type");
  await filter.selectOption("emotional");
  await expect(filter).toHaveValue("emotional");

  await page.getByRole("button", { name: /Therapy Dog/ }).click();
  await expect(
    page.getByRole("dialog").getByText("Therapy Dog Visit with Canine Assistants"),
  ).toBeVisible();
});

test("mobile calendar: the full day card opens its details", async ({ page }) => {
  await pinClock(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/calendar");

  const details = page.getByRole("button", {
    name: "Show details for Wednesday, July 1, 2026",
  });
  await expect(details).toBeVisible();
  await expect(details).toHaveAttribute("aria-haspopup", "dialog");
  await expect(details).toHaveClass(/inset-0/);

  const todayCard = page.getByRole("button", {
    name: "Show details for Wednesday, July 8, 2026",
  }).locator("xpath=..");
  await expect(todayCard).toHaveClass(/bg-copper\/10/);

  await details.click();
  await expect(page.getByRole("dialog")).toBeVisible();
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

  await nav.getByRole("link", { name: "Holidays" }).click();
  await expect(page).toHaveURL(/\/holidays$/);
  await expect(page.getByRole("heading", { name: "Holidays" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Holidays" })).toHaveAttribute("aria-current", "page");
});

test("medications: morning and evening routines preserve special schedules", async ({ page }) => {
  await page.goto("/medications");

  await expect(page).toHaveTitle("Medications | Magnolia Companion");
  const morningTab = page.getByRole("tab", { name: "Morning" });
  const eveningTab = page.getByRole("tab", { name: "Evening" });
  await expect(morningTab).toHaveAttribute("aria-selected", "true");

  const morning = page.getByRole("tabpanel", { name: "Morning" });
  await expect(morning.getByRole("heading", { name: "Morning medications" })).toBeVisible();
  const levothyroxine = morning.getByRole("listitem").filter({
    has: morning.getByRole("heading", { name: "Levothyroxine" }),
  });
  await expect(levothyroxine.getByText("112 mcg")).toBeVisible();
  await expect(levothyroxine.getByText("Monday–Friday")).toBeVisible();
  await expect(levothyroxine.getByText("125 mcg")).toBeVisible();
  await expect(levothyroxine.getByText("Saturday & Sunday")).toBeVisible();

  await eveningTab.click();
  await expect(eveningTab).toHaveAttribute("aria-selected", "true");
  const evening = page.getByRole("tabpanel", { name: "Evening" });
  const ciprofloxacin = evening.getByRole("listitem").filter({
    has: evening.getByRole("heading", { name: "Ciprofloxacin" }),
  });
  await expect(ciprofloxacin.getByText("Monday, Wednesday & Friday only")).toBeVisible();
  await expect(evening.getByRole("heading", { name: "Metoprolol Succinate ER" })).toHaveCount(0);

  const allMedications = page.getByRole("heading", { name: "All medications" }).locator("..").locator("..");
  await expect(allMedications.getByRole("heading", { name: "Tylenol 8 HR Arthritis Pain" })).toBeVisible();
});

test("holidays: Explore-style filters group religious holidays", async ({ page }) => {
  await pinClock(page);
  await page.goto("/holidays");

  const filters = page.getByRole("group", { name: "Filter holidays" });
  const religious = filters.getByRole("button", { name: /^Religious/ });
  await expect(religious).toHaveAttribute("aria-pressed", "false");
  await expect(religious).toHaveClass(/ring-inset/);

  await religious.click();
  await expect(religious).toHaveAttribute("aria-pressed", "true");
  await expect(religious).toHaveClass(/bg-copper/);
  await expect(page.getByRole("heading", { name: "Hanukkah" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Easter Sunday" })).toBeVisible();
  const christmas = page.getByRole("heading", { name: "Christmas Day" }).first().locator("..");
  await expect(christmas.getByText("Federal", { exact: true })).toBeVisible();
  await expect(christmas.getByText("Family", { exact: true })).toBeVisible();
  await expect(christmas.getByText("Christian", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Labor Day" })).toHaveCount(0);

  const family = filters.getByRole("button", { name: /^Family/ });
  await family.click();
  await expect(page.getByRole("heading", { name: "Thanksgiving Day" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Christmas Day" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Columbus Day" })).toHaveCount(0);
});

test("header: holiday notification shows only the next holiday", async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Show notifications" }).click();

  const notifications = page.getByRole("heading", { name: "Notifications" }).locator("..").locator("..");
  await expect(notifications.getByRole("heading", { name: "Labor Day" })).toBeVisible();
  await expect(notifications.getByRole("heading", { name: "Columbus Day" })).toHaveCount(0);
});

test("rent reminder: appears in notifications and Home Today and Tomorrow views", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-07-29T11:00:00Z") });
  await page.goto("/");

  await page.getByRole("button", { name: "Show notifications" }).click();
  const notifications = page.getByRole("heading", { name: "Notifications" }).locator("..").locator("..");
  await expect(notifications.getByRole("heading", { name: "Rent payment" })).toBeVisible();
  await expect(notifications.getByText("Due in 3 days")).toBeVisible();
  await page.keyboard.press("Escape");

  const activities = page.getByRole("tabpanel", { name: "Activities" });
  const rentReminder = activities.getByRole("region", { name: "Rent payment reminder" });
  await expect(rentReminder).toBeVisible();
  const firstUp = activities.getByRole("region", { name: "Right now" });
  await expect(firstUp.getByText("First up today")).toBeVisible();
  expect((await rentReminder.boundingBox())!.height).toBeLessThan((await firstUp.boundingBox())!.height);
  await page.getByRole("button", { name: "Tomorrow", exact: true }).click();
  await expect(activities.getByRole("region", { name: "Rent payment reminder" })).toBeVisible();

  await page.getByRole("tab", { name: "Meals" }).click();
  const meals = page.getByRole("tabpanel", { name: "Meals" });
  await expect(meals.getByRole("region", { name: "Rent payment reminder" })).toBeVisible();
  await meals.getByRole("button", { name: "Tomorrow", exact: true }).click();
  await expect(meals.getByRole("region", { name: "Rent payment reminder" })).toBeVisible();
});

test("medication refill reminder: appears all weekend and clears Monday", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.install({ time: new Date("2026-07-11T16:00:00Z") }); // Saturday noon EDT
  await page.goto("/");

  const activities = page.getByRole("tabpanel", { name: "Activities" });
  await expect(
    activities.getByRole("region", { name: "Medication refill reminder" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Show notifications" }).click();
  const notifications = page.getByRole("heading", { name: "Notifications" }).locator("..").locator("..");
  await expect(notifications.getByRole("heading", { name: "Refill pill box" })).toBeVisible();
  await expect(notifications.getByText("Weekend task")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("tab", { name: "Meals" }).click();
  const meals = page.getByRole("tabpanel", { name: "Meals" });
  const mealReminder = meals.getByRole("region", { name: "Medication refill reminder" });
  await expect(mealReminder).toBeVisible();

  const reminderBox = await mealReminder.boundingBox();
  const firstMealBox = await meals.locator(".meal-card-paper").first().boundingBox();
  const lastMealBox = await meals.locator(".meal-card-paper").last().boundingBox();
  expect(reminderBox).not.toBeNull();
  expect(firstMealBox).not.toBeNull();
  expect(lastMealBox).not.toBeNull();
  expect(Math.abs(reminderBox!.x - firstMealBox!.x)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      reminderBox!.x + reminderBox!.width
      - (lastMealBox!.x + lastMealBox!.width),
    ),
  ).toBeLessThanOrEqual(1);

  await page.clock.setSystemTime(new Date("2026-07-13T16:00:00Z")); // Monday noon EDT
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Medication refill reminder" }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Show notifications" }).click();
  const mondayNotifications = page.getByRole("heading", { name: "Notifications" }).locator("..").locator("..");
  await expect(mondayNotifications.getByRole("heading", { name: "Refill pill box" })).toHaveCount(0);
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
  for (const meal of ["Breakfast", "Lunch", "Dinner"]) {
    await expect(page.getByRole("heading", { name: meal }).locator("svg")).toBeVisible();
  }
  await expect(page.getByText("4:00 PM – 6:30 PM")).toBeVisible();
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

test("home: lunch card is highlighted during its serving window", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-07-08T16:30:00Z") }); // 12:30 PM EDT
  await page.goto("/");
  await page.getByRole("tab", { name: "Meals" }).click();
  const lunchCard = page.getByRole("region", { name: "Lunch, serving now" });
  await expect(lunchCard).toHaveClass(/bg-copper\/10/);
  await expect(lunchCard.getByText("11:30 AM – 1:00 PM")).toBeVisible();
  await expect(page.getByText("Serving now")).toHaveCount(0);
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

test("contacts: directory filters the published contacts", async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  const featuredContact = page
    .getByRole("tabpanel", { name: "Activities" })
    .getByText("From the directory")
    .locator("..");
  await expect(featuredContact.getByRole("heading")).toHaveClass(/text-ink/);
  await expect(featuredContact.locator("h3 + p")).toHaveClass(/text-copper/);
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Directory" }).click();

  await expect(page).toHaveTitle("Directory | Magnolia Companion");
  await expect(page.getByRole("heading", { name: "Directory", exact: true })).toBeVisible();
  const filters = page.getByRole("group", { name: "Filter directory" });
  await expect(filters.getByRole("button", { name: /^All\s+12$/ })).toHaveAttribute("aria-pressed", "true");
  await expect(filters.getByRole("button", { name: /^Magnolia\s+6$/ })).toBeVisible();
  await expect(filters.getByRole("button", { name: /^Emergency\s+3$/ })).toBeVisible();
  await expect(filters.getByRole("button", { name: /^Doctors\s+2$/ })).toBeVisible();
  await expect(filters.getByRole("button", { name: /^Pharmacy\s+1$/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Roswell Fire Station 24" })).toHaveClass(/text-ink/);
  await expect(page.getByText("Fire and Rescue", { exact: true })).toHaveClass(/text-copper/);
  await expect(page.getByRole("heading", { name: "Roswell Public Safety Headquarters" })).toBeVisible();
  const emergencyRoom = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "Wellstar North Fulton Medical Center" }),
  });
  await expect(emergencyRoom.getByText("Nearest Emergency Room", { exact: true })).toBeVisible();
  await expect(
    emergencyRoom.getByText("3000 Hospital Boulevard, Roswell, GA 30076", { exact: true }),
  ).toBeVisible();
  await expect(emergencyRoom.getByText("(770) 751-2500", { exact: true })).toBeVisible();
  const lyshon = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "Lyshon Calyen" }),
  });
  await expect(lyshon.getByText("(470) 294-7448", { exact: true })).toBeVisible();
  await expect(lyshon.getByText("(770) 643-9433", { exact: true })).toBeVisible();
  await expect(lyshon.getByText("(770) 643-9678", { exact: true })).toBeVisible();

  await filters.getByRole("button", { name: /^Emergency\s+3$/ }).click();
  await expect(page.getByRole("heading", { name: "Wellstar North Fulton Medical Center" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lyshon Calyen" })).toHaveCount(0);

  await filters.getByRole("button", { name: /^Magnolia\s+6$/ }).click();
  await expect(page.getByRole("heading", { name: "Lyshon Calyen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wellstar North Fulton Medical Center" })).toHaveCount(0);

  await filters.getByRole("button", { name: /^Doctors\s+2$/ }).click();
  const primaryCare = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "Albert F. Johary, MD" }),
  });
  await expect(primaryCare.getByText("Primary Care Physician", { exact: true })).toBeVisible();
  await expect(
    primaryCare.getByText("1320 Center Drive, Suite 100, Dunwoody, GA 30338", { exact: true }),
  ).toBeVisible();
  await expect(primaryCare.getByText("(770) 730-8908", { exact: true })).toBeVisible();
  await expect(primaryCare.getByText("(770) 730-8230", { exact: true })).toBeVisible();
  const cardiologist = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "Thomas M Guest, MD" }),
  });
  await expect(cardiologist.getByText("Cardiologist", { exact: true })).toBeVisible();
  await expect(
    cardiologist.getByText(
      "5671 Peachtree Dunwoody Road, Floor 3, Suite 300, Atlanta, GA 30342",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(cardiologist.getByText("(404) 778-6070", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lyshon Calyen" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Wellstar North Fulton Medical Center" })).toHaveCount(0);

  await filters.getByRole("button", { name: /^Pharmacy\s+1$/ }).click();
  const pharmacy = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "CVS Pharmacy #2081" }),
  });
  await expect(pharmacy.getByText("Pharmacy", { exact: true })).toBeVisible();
  await expect(
    pharmacy.getByText("8430 Holcomb Bridge Road, Alpharetta, GA 30022", { exact: true }),
  ).toBeVisible();
  await expect(pharmacy.getByText("(770) 640-6576", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lyshon Calyen" })).toHaveCount(0);
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

test("mobile: medications and directory are adjacent tabs", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const bottomNav = page.locator('nav[aria-label="Main"]:visible');
  await expect(bottomNav.getByRole("link", { name: "Meds", exact: true }).locator("svg")).toBeVisible();
  await expect(bottomNav.getByRole("link", { name: "Directory", exact: true }).locator("svg")).toBeVisible();
  await expect(bottomNav.getByRole("link", { name: "Calendar", exact: true })).toHaveCount(0);
  await expect(bottomNav.getByRole("link", { name: "Holidays", exact: true })).toHaveCount(0);

  await bottomNav.getByRole("button", { name: "More", exact: true }).click();

  for (const label of ["Calendar", "Explore", "FAQ", "Holidays", "About & Disclaimer"]) {
    await expect(bottomNav.getByRole("link", { name: label, exact: true }).locator("svg")).toBeVisible();
  }
});

test("mobile: the More pages coachmark teaches the menu once", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const tip = page.getByRole("button", { name: /Tap More for more pages/ });
  await expect(tip).toBeVisible();
  await expect(tip).toContainText("Calendar, explore, holidays, FAQ & About");

  const tipBox = await tip.boundingBox();
  const accessibilityBox = await page
    .getByRole("button", { name: "Accessibility settings", exact: true })
    .boundingBox();
  expect(tipBox).not.toBeNull();
  expect(accessibilityBox).not.toBeNull();
  expect(tipBox!.x + tipBox!.width).toBeLessThanOrEqual(accessibilityBox!.x);

  await tip.click();
  await expect(page.getByRole("button", { name: "More", exact: true })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.getByRole("link", { name: "Holidays", exact: true })).toBeVisible();
  await expect(tip).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("mc-more-discovered")))
    .toBe("true");

  await page.reload();
  await page.waitForTimeout(100);
  await expect(tip).toHaveCount(0);
});

test("mobile: accessibility dialog closes from the blank space above navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Accessibility settings", exact: true });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Accessibility" });
  await expect(dialog).toBeVisible();

  const dialogBox = await dialog.boundingBox();
  const triggerBox = await trigger.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(triggerBox).not.toBeNull();

  await page.mouse.click(dialogBox!.x + 8, triggerBox!.y + triggerBox!.height / 2);
  await expect(dialog).not.toBeVisible();
});
