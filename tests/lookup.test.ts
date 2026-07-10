import { describe, expect, test } from "vitest";
import { loadActivityMonths, loadMenuWeeks } from "@/lib/content";
import { findActivityDay, findMenuDay, menuWeekFor, scansForDate } from "@/lib/lookup";

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
    expect(findMenuDay(weeks, "2026-08-01")).toBeNull();
  });
  test("menuWeekFor maps any date inside the stored menu week range", () => {
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
