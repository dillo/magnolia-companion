import { describe, expect, test } from "vitest";
import {
  inferTime24, expandLocation, mergePages, routineTitles,
  buildActivityMonth, ROUTINE_MIN_DAYS, type RawDay,
} from "@/lib/ingest/postprocess";

describe("inferTime24", () => {
  test("morning hours 7–11 stay am", () => {
    const w: string[] = [];
    expect(inferTime24("9:00", "ctx", w)).toBe("09:00");
    expect(inferTime24("11:45", "ctx", w)).toBe("11:45");
    expect(w).toEqual([]);
  });
  test("hours 1–6 become pm", () => {
    const w: string[] = [];
    expect(inferTime24("1:30", "ctx", w)).toBe("13:30");
    expect(inferTime24("6:00", "ctx", w)).toBe("18:00");
    expect(w).toEqual([]);
  });
  test("noon stays 12", () => {
    const w: string[] = [];
    expect(inferTime24("12:00", "ctx", w)).toBe("12:00");
    expect(w).toEqual([]);
  });
  test("null passes through (all-day)", () => {
    const w: string[] = [];
    expect(inferTime24(null, "ctx", w)).toBeNull();
  });
  test("out-of-range hour warns but is kept", () => {
    const w: string[] = [];
    expect(inferTime24("19:00", "2026-07-22 \"X\"", w)).toBe("19:00");
    expect(w).toHaveLength(1);
    expect(w[0]).toMatch(/outside expected/);
  });
  test("garbage warns and returns null", () => {
    const w: string[] = [];
    expect(inferTime24("??", "ctx", w)).toBeNull();
    expect(w[0]).toMatch(/unreadable time/);
  });
});

describe("expandLocation", () => {
  test("expands known codes", () => {
    const w: string[] = [];
    expect(expandLocation("LR", "ctx", w)).toBe("Living Room");
    expect(expandLocation("bt", "ctx", w)).toBe("Bus Trip");
    expect(w).toEqual([]);
  });
  test("null passes through", () => {
    expect(expandLocation(null, "ctx", [])).toBeNull();
  });
  test("unknown code warns and is kept verbatim", () => {
    const w: string[] = [];
    expect(expandLocation("ZZ", "ctx", w)).toBe("ZZ");
    expect(w[0]).toMatch(/unknown location code/);
  });
});

function day(date: string, titles: string[]): RawDay {
  return { date, theme: null, events: titles.map((t) => ({ time: "9:00", title: t, locationCode: "LR", dimension: "learn" })) };
}

describe("mergePages", () => {
  test("merges and sorts pages", () => {
    const merged = mergePages([[day("2026-07-19", ["b"])], [day("2026-07-01", ["a"])]]);
    expect(merged.map((d) => d.date)).toEqual(["2026-07-01", "2026-07-19"]);
  });
  test("throws on duplicate dates across pages", () => {
    expect(() => mergePages([[day("2026-07-01", ["a"])], [day("2026-07-01", ["b"])]]))
      .toThrow(/duplicate date/);
  });
});

describe("routineTitles", () => {
  test("titles on 10+ distinct days are routine, case-insensitive", () => {
    const days: RawDay[] = [];
    for (let i = 1; i <= ROUTINE_MIN_DAYS; i++) {
      days.push(day(`2026-07-${String(i).padStart(2, "0")}`, [i % 2 ? "Evening News" : "EVENING NEWS", "One-off " + i]));
    }
    const routine = routineTitles(days);
    expect(routine.has("evening news")).toBe(true);
    expect(routine.has("one-off 1")).toBe(false);
  });
});

describe("buildActivityMonth", () => {
  test("assembles a valid month with inferred times, locations, routine flags", () => {
    const pages: RawDay[][] = [[]];
    for (let i = 1; i <= 12; i++) {
      pages[0].push({
        date: `2026-07-${String(i).padStart(2, "0")}`,
        theme: i === 8 ? "Nat'l Raspberry Day" : null,
        events: [
          { time: "9:00", title: "Magnolia Gazette", locationCode: "LR", dimension: "learn" },
          ...(i === 8 ? [{ time: "3:00", title: "Wine Down Wednesday", locationCode: "LR", dimension: "entertainment" }] : []),
        ],
      });
    }
    const { data, warnings } = buildActivityMonth("2026-07", ["scans/p1.jpg"], pages);
    expect(warnings).toEqual([]);
    const jul8 = data.days.find((d) => d.date === "2026-07-08")!;
    expect(jul8.theme).toBe("Nat'l Raspberry Day");
    const gazette = jul8.events.find((e) => e.title === "Magnolia Gazette")!;
    expect(gazette).toMatchObject({ start: "09:00", location: "Living Room", routine: true });
    const wine = jul8.events.find((e) => e.title === "Wine Down Wednesday")!;
    expect(wine).toMatchObject({ start: "15:00", dimension: "entertainment", routine: false });
  });
  test("unknown dimension becomes null with a warning", () => {
    const pages: RawDay[][] = [[{
      date: "2026-07-08", theme: null,
      events: [{ time: "9:00", title: "Mystery", locationCode: null, dimension: "fun" }],
    }]];
    const { data, warnings } = buildActivityMonth("2026-07", ["scans/p1.jpg"], pages);
    expect(data.days[0].events[0].dimension).toBeNull();
    expect(warnings[0]).toMatch(/unknown dimension "fun"/);
  });
});
