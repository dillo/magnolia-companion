import { describe, expect, test } from "vitest";
import { loadActivityMonths, loadContacts, loadHolidays, loadMenuWeeks } from "@/lib/content";
import {
  findActivityDay, findMenuDay, menuWeekFor, publishedMenuWeeks, scansForDate,
  holidaysInRange, upcomingHolidays,
} from "@/lib/lookup";

const months = loadActivityMonths();
const weeks = loadMenuWeeks();
const holidays = loadHolidays();
const contacts = loadContacts();

describe("loaders", () => {
  test("loads and validates committed fixtures", () => {
    expect(months.length).toBeGreaterThanOrEqual(1);
    expect(months[0].month).toBe("2026-07");
    expect(weeks[0].weekOf).toBe("2026-07-05");
  });

  test("loadContacts returns the committed directory", () => {
    expect(contacts.contacts).toHaveLength(12);
    expect(contacts.contacts[0].name).toBe("Lyshon Calyen");
    expect(contacts.contacts.at(-1)?.name).toBe("Roswell Public Safety Headquarters");
    expect(contacts.contacts.filter((contact) => contact.category === "magnolia")).toHaveLength(6);
    expect(contacts.contacts.filter((contact) => contact.category === "emergency")).toHaveLength(3);
    expect(contacts.contacts.filter((contact) => contact.category === "doctors")).toHaveLength(2);
    expect(contacts.contacts.filter((contact) => contact.category === "pharmacy")).toHaveLength(1);
    expect(
      contacts.contacts.find((contact) => contact.id === "wellstar-north-fulton-medical-center")?.address,
    ).toBe("3000 Hospital Boulevard, Roswell, GA 30076");
    expect(contacts.contacts.find((contact) => contact.id === "cvs-pharmacy-2081")).toMatchObject({
      main: "(770) 640-6576",
      address: "8430 Holcomb Bridge Road, Alpharetta, GA 30022",
    });
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
    expect(findMenuDay(weeks, "2026-08-03")?.lunch.items[1].name).toBe("Honey Dijon Roasted Chicken");
    expect(findMenuDay(weeks, "2099-01-01")).toBeNull();
  });
  test("menu lookups use published weeks and ignore placeholders", () => {
    expect(publishedMenuWeeks(weeks).map((w) => w.weekOf)).not.toContain("2026-07-06");
    expect(menuWeekFor(weeks, "2026-07-11")?.weekOf).toBe("2026-07-05");
    expect(menuWeekFor(weeks, "2026-07-12")?.weekOf).toBe("2026-07-12");
    expect(menuWeekFor(weeks, "2026-08-01")?.weekOf).toBe("2026-07-26");
  });
  test("scansForDate returns the month's scans", () => {
    expect(scansForDate(months, "2026-07-08")).toEqual([]);
    expect(scansForDate(months, "2026-09-01")).toEqual([]);
  });
  test("holiday lookups find upcoming and ranged holidays", () => {
    expect(upcomingHolidays(holidays, "2026-07-17", 1)[0].title).toBe("Labor Day");
    expect(holidaysInRange(holidays, "2026-12-05", "2026-12-05").map((day) => day.title)).toContain("Hanukkah");
  });
});
