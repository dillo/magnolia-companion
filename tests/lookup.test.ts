import { describe, expect, test } from "vitest";
import { loadActivityMonths, loadMenuWeeks } from "@/lib/content";
import { findActivityDay, findMenuDay, menuWeekFor, publishedMenuWeeks, scansForDate } from "@/lib/lookup";

const months = loadActivityMonths();
const weeks = loadMenuWeeks();

describe("loaders", () => {
  test("loads and validates committed fixtures", () => {
    expect(months.length).toBeGreaterThanOrEqual(1);
    expect(months[0].month).toBe("2026-07");
    expect(weeks[0].weekOf).toBe("2026-07-05");
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
    expect(findMenuDay(weeks, "2026-07-08")?.lunch.items[0].name).toBe("Garden Green Salad");
    expect(findMenuDay(weeks, "2026-07-12")).toBeNull();
    expect(findMenuDay(weeks, "2026-08-01")).toBeNull();
  });
  test("menu lookups ignore placeholder menu files that have not been ingested", () => {
    expect(publishedMenuWeeks(weeks).map((w) => w.weekOf)).not.toContain("2026-07-06");
    expect(menuWeekFor(weeks, "2026-07-11")?.weekOf).toBe("2026-07-05");
    expect(menuWeekFor(weeks, "2026-07-12")).toBeNull();
    expect(menuWeekFor(weeks, "2026-07-14")).toBeNull();
  });
  test("scansForDate returns the month's scans", () => {
    expect(scansForDate(months, "2026-07-08")).toEqual([]);
    expect(scansForDate(months, "2026-09-01")).toEqual([]);
  });
});
