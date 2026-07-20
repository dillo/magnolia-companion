import { describe, expect, test } from "vitest";
import { loadActivityMonths, loadContacts, loadMenuWeeks, loadVisitDays } from "@/lib/content";
import {
  findActivityDay, findMenuDay, menuWeekFor, publishedMenuWeeks, scansForDate,
  upcomingVisitDays, visitDaysInRange,
} from "@/lib/lookup";

const months = loadActivityMonths();
const weeks = loadMenuWeeks();
const visitDays = loadVisitDays();
const contacts = loadContacts();

describe("loaders", () => {
  test("loads and validates committed fixtures", () => {
    expect(months.length).toBeGreaterThanOrEqual(1);
    expect(months[0].month).toBe("2026-07");
    expect(weeks[0].weekOf).toBe("2026-07-05");
  });

  test("loadContacts returns the committed (currently empty) directory", () => {
    expect(contacts.contacts).toEqual([]);
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
    expect(findMenuDay(weeks, "2026-07-12")?.dinner.items.at(-1)?.name).toBe("Boston Cream Cake");
    expect(findMenuDay(weeks, "2026-08-01")).toBeNull();
  });
  test("menu lookups ignore placeholder menu files that have not been ingested", () => {
    expect(publishedMenuWeeks(weeks).map((w) => w.weekOf)).not.toContain("2026-07-06");
    expect(menuWeekFor(weeks, "2026-07-11")?.weekOf).toBe("2026-07-05");
    expect(menuWeekFor(weeks, "2026-07-12")?.weekOf).toBe("2026-07-12");
    expect(menuWeekFor(weeks, "2026-08-01")).toBeNull();
  });
  test("scansForDate returns the month's scans", () => {
    expect(scansForDate(months, "2026-07-08")).toEqual([]);
    expect(scansForDate(months, "2026-09-01")).toEqual([]);
  });
  test("visit day lookups find upcoming and ranged holidays", () => {
    expect(upcomingVisitDays(visitDays, "2026-07-17", 1)[0].title).toBe("Labor Day");
    expect(visitDaysInRange(visitDays, "2026-12-05", "2026-12-05").map((day) => day.title)).toContain("Hanukkah");
  });
});
