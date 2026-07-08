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
  await expect(
    page.getByLabel("Day detail").getByText("Therapy Dog Visit with Canine Assistants"),
  ).toBeVisible();
});

test("nav: current page is marked active", async ({ page }) => {
  await pinClock(page);
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Today" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Calendar" })).not.toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Calendar" }).click();
  await expect(nav.getByRole("link", { name: "Calendar" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Today" })).not.toHaveAttribute("aria-current", "page");
});

test("menu: day tabs swap the meal cards", async ({ page }) => {
  await pinClock(page);
  await page.goto("/menu");
  await expect(page.getByText("Fried catfish")).toBeVisible();
  await page.getByRole("tab", { name: /Mon\s*6/ }).click();
  await expect(page.getByText("Buttermilk pancakes")).toBeVisible();
});
