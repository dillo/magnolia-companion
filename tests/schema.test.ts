import { describe, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { activityMonthSchema, menuWeekSchema } from "@/lib/schema";

function readJSON(rel: string) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
}

describe("activityMonthSchema", () => {
  test("accepts the committed July 2026 fixture", () => {
    const parsed = activityMonthSchema.parse(readJSON("content/activities/2026-07.json"));
    expect(parsed.month).toBe("2026-07");
    expect(parsed.days.length).toBeGreaterThanOrEqual(7);
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
  test("rejects a weekOf that is not a Monday", () => {
    const bad = { weekOf: "2026-07-07", sourceScan: null, alwaysAvailable: [], days: [
      { date: "2026-07-07", breakfast: { items: [] }, lunch: { items: [] }, dinner: { items: [] } },
    ]};
    expect(() => menuWeekSchema.parse(bad)).toThrow(/not a Monday/);
  });
  test("rejects a day outside the week", () => {
    const bad = { weekOf: "2026-07-06", sourceScan: null, alwaysAvailable: [], days: [
      { date: "2026-07-14", breakfast: { items: [] }, lunch: { items: [] }, dinner: { items: [] } },
    ]};
    expect(() => menuWeekSchema.parse(bad)).toThrow(/outside week/);
  });
});
