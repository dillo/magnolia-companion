import { describe, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { activityMonthSchema, menuWeekSchema, visitDaysSchema } from "@/lib/schema";

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

describe("visitDaysSchema", () => {
  test("accepts the committed visit day fixture", () => {
    const parsed = visitDaysSchema.parse(readJSON("content/visit-days.json"));
    expect(parsed.some((day) => day.title === "Rosh Hashanah" && day.type === "jewish")).toBe(true);
    expect(parsed.some((day) => day.title === "Mother's Day" && day.type === "family")).toBe(true);
  });
  test("rejects a visit day that ends before it starts", () => {
    const bad = [{
      startDate: "2026-12-25",
      endDate: "2026-12-24",
      title: "Christmas Day",
      type: "federal",
      timing: null,
      note: "Family visit day.",
    }];
    expect(() => visitDaysSchema.parse(bad)).toThrow(/ends before it starts/);
  });
});
