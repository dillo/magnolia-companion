import { describe, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { activityMonthSchema, contactsSchema, holidaysSchema, menuWeekSchema, nearbyPlacesSchema } from "@/lib/schema";

function readJSON(rel: string) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
}

describe("activityMonthSchema", () => {
  test("accepts the committed July 2026 fixture", () => {
    const parsed = activityMonthSchema.parse(readJSON("content/activities/2026-07.json"));
    expect(parsed.month).toBe("2026-07");
    expect(parsed.days.length).toBeGreaterThanOrEqual(7);
  });
  test("accepts API-generated activity months without source scans", () => {
    const parsed = activityMonthSchema.parse({
      month: "2026-08",
      sourceScans: [],
      days: [{ date: "2026-08-01", theme: null, events: [] }],
    });
    expect(parsed.sourceScans).toEqual([]);
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
  test("accepts the real printed Sunday-to-Saturday week shape", () => {
    const week = { weekOf: "2026-07-05", sourceScan: "scans/menu.jpg", alwaysAvailable: ["Milk offered at every meal"], days: [
      { date: "2026-07-05", breakfast: { items: [] }, lunch: { items: [] }, dinner: { items: [] } },
      { date: "2026-07-11", breakfast: { items: [] }, lunch: { items: [] }, dinner: { items: [] } },
    ]};
    expect(menuWeekSchema.parse(week).weekOf).toBe("2026-07-05");
  });
  test("rejects a day outside the week", () => {
    const bad = { weekOf: "2026-07-06", sourceScan: null, alwaysAvailable: [], days: [
      { date: "2026-07-14", breakfast: { items: [] }, lunch: { items: [] }, dinner: { items: [] } },
    ]};
    expect(() => menuWeekSchema.parse(bad)).toThrow(/outside week/);
  });
});

describe("holidaysSchema", () => {
  test("accepts the committed holiday fixture", () => {
    const parsed = holidaysSchema.parse(readJSON("content/holidays.json"));
    expect(parsed.some((day) => day.title === "Hanukkah" && day.type === "jewish")).toBe(true);
    expect(parsed.some((day) => day.title === "Mother's Day" && day.type === "family")).toBe(true);
  });
  test("rejects a holiday that ends before it starts", () => {
    const bad = [{
      startDate: "2026-12-25",
      endDate: "2026-12-24",
      title: "Christmas Day",
      type: "federal",
      timing: null,
      note: "Family visit day.",
    }];
    expect(() => holidaysSchema.parse(bad)).toThrow(/ends before it starts/);
  });
});

describe("nearbyPlacesSchema", () => {
  test("accepts the committed nearby places directory", () => {
    const parsed = nearbyPlacesSchema.parse(readJSON("content/nearby-places.json"));
    expect(parsed.center.name).toBe("Magnolia Place of Roswell");
    expect(parsed.places.some((place) => place.category === "hair_salon")).toBe(true);
    expect(parsed.places.some((place) => place.seniorFriendly)).toBe(true);
  });
  test("rejects duplicate nearby place ids", () => {
    const place = {
      id: "same",
      name: "Place",
      category: "shop",
      address: "123 Main St",
      phone: null,
      website: null,
      latitude: 34,
      longitude: -84,
      distanceMiles: 1,
      summary: "A test place.",
      seniorFriendly: true,
      notes: ["Easy parking."],
      tags: ["Test"],
    };
    expect(() => nearbyPlacesSchema.parse({
      center: {
        name: "Center",
        address: "655 Mansell Rd",
        latitude: 34,
        longitude: -84,
      },
      places: [place, place],
    })).toThrow(/duplicate nearby place/);
  });
});

describe("contactsSchema", () => {
  test("accepts the committed contacts fixture", () => {
    const parsed = contactsSchema.parse(readJSON("content/contacts.json"));
    expect(parsed.contacts).toHaveLength(2);
    expect(parsed.contacts[0].name).toBe("Roswell Fire Station 24");
  });
  test("accepts a fully populated contact", () => {
    const parsed = contactsSchema.parse({
      contacts: [
        {
          id: "jane-smith",
          name: "Jane Smith",
          role: "Executive Director",
          department: "Administration",
          phone: "(770) 555-0100",
          email: "jane.smith@example.com",
        },
      ],
    });
    expect(parsed.contacts[0].name).toBe("Jane Smith");
  });
  test("rejects duplicate contact ids", () => {
    const contact = {
      id: "same",
      name: "Jane Smith",
      role: "Executive Director",
      department: "Administration",
      phone: null,
      email: null,
    };
    expect(() => contactsSchema.parse({ contacts: [contact, contact] })).toThrow(/duplicate contact/);
  });
});
