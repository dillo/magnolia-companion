import { describe, expect, test } from "vitest";
import {
  clockHHMM, minutesOf, greetingFor, heroStateFor, timelineStatuses,
  servingNow, tomorrowPreview,
} from "@/lib/now";
import type { ActivityDay, ActivityEvent } from "@/lib/schema";

function ev(partial: Partial<ActivityEvent>): ActivityEvent {
  return { start: null, end: null, title: "Event", location: null, dimension: null, routine: false, ...partial };
}

// 09:00 Gazette (routine, ends 10:00 by 60-min default), 10:15 Chair Yoga (ends 11:15),
// 13:00-14:00 Prize Bingo (printed end), 18:00 Evening News (last event, ends 19:00).
const day: ActivityEvent[] = [
  ev({ start: "09:00", title: "Gazette", routine: true }),
  ev({ start: "10:15", title: "Chair Yoga" }),
  ev({ start: "13:00", end: "14:00", title: "Prize Bingo" }),
  ev({ start: "18:00", title: "Evening News", routine: true }),
];

describe("clockHHMM", () => {
  test("converts UTC instant to New York wall clock", () => {
    expect(clockHHMM(new Date("2026-07-08T19:00:00Z"))).toBe("15:00");
  });
  test("midnight is 00, not 24", () => {
    expect(clockHHMM(new Date("2026-07-09T04:30:00Z"))).toBe("00:30");
  });
});

describe("minutesOf", () => {
  test("parses zero-padded HH:MM", () => {
    expect(minutesOf("09:05")).toBe(545);
  });
});

describe("greetingFor", () => {
  test.each([
    ["05:00", "Good morning"],
    ["11:59", "Good morning"],
    ["12:00", "Good afternoon"],
    ["16:59", "Good afternoon"],
    ["17:00", "Good evening"],
    ["23:30", "Good evening"],
  ])("%s -> %s", (hhmm, expected) => {
    expect(greetingFor(hhmm)).toBe(expected);
  });
});

describe("heroStateFor", () => {
  test("before the first event: upcoming, first", () => {
    expect(heroStateFor(day, "08:00")).toEqual({
      kind: "upcoming", event: day[0], first: true, minutesUntil: 60,
    });
  });
  test("exactly at start: happening now, with next", () => {
    expect(heroStateFor(day, "09:00")).toEqual({ kind: "now", event: day[0], next: day[1] });
  });
  test("default end is start + 60: over at 10:00, next up in 15", () => {
    expect(heroStateFor(day, "10:00")).toEqual({
      kind: "upcoming", event: day[1], first: false, minutesUntil: 15,
    });
  });
  test("gap between events: upcoming, not first", () => {
    expect(heroStateFor(day, "12:00")).toEqual({
      kind: "upcoming", event: day[2], first: false, minutesUntil: 60,
    });
  });
  test("printed end is honored", () => {
    expect(heroStateFor(day, "13:30")).toEqual({ kind: "now", event: day[2], next: day[3] });
  });
  test("exactly at end: no longer happening", () => {
    expect(heroStateFor(day, "14:00")).toEqual({
      kind: "upcoming", event: day[3], first: false, minutesUntil: 240,
    });
  });
  test("after the last event's default end: done", () => {
    expect(heroStateFor(day, "19:30")).toEqual({ kind: "done" });
  });
  test("default end caps at the next event's start", () => {
    const packed = [ev({ start: "09:00", title: "A" }), ev({ start: "09:30", title: "B" })];
    expect(heroStateFor(packed, "09:45")).toEqual({ kind: "now", event: packed[1], next: null });
  });
  test("unsorted input is handled", () => {
    expect(heroStateFor([...day].reverse(), "12:00")).toEqual({
      kind: "upcoming", event: day[2], first: false, minutesUntil: 60,
    });
  });
  test("no timed events: null", () => {
    expect(heroStateFor([], "12:00")).toBeNull();
    expect(heroStateFor([ev({ title: "All-day theme" })], "12:00")).toBeNull();
  });
});

describe("timelineStatuses", () => {
  test("partitions past / current / upcoming in input order", () => {
    expect(timelineStatuses(day, "13:30")).toEqual(["past", "past", "current", "upcoming"]);
  });
  test("all-day events are never past", () => {
    const withAllDay = [ev({ title: "Theme" }), ...day];
    expect(timelineStatuses(withAllDay, "19:30")).toEqual([
      "allday", "past", "past", "past", "past",
    ]);
  });
});

describe("servingNow", () => {
  const lunch = { start: "11:30", end: "13:00" };
  test("inside the window", () => {
    expect(servingNow(lunch, "12:15")).toBe(true);
  });
  test("boundaries are inclusive", () => {
    expect(servingNow(lunch, "11:30")).toBe(true);
    expect(servingNow(lunch, "13:00")).toBe(true);
  });
  test("outside the window", () => {
    expect(servingNow(lunch, "13:01")).toBe(false);
  });
  test("null clock (pre-mount) is false", () => {
    expect(servingNow(lunch, null)).toBe(false);
  });
});

describe("tomorrowPreview", () => {
  const mkDay = (events: ActivityEvent[]): ActivityDay => ({ date: "2026-07-09", theme: null, events });
  test("prefers the first timed special", () => {
    const special = ev({ start: "13:00", title: "Kroger Shopping" });
    const d = mkDay([ev({ start: "09:00", title: "Gazette", routine: true }), special]);
    expect(tomorrowPreview(d)).toBe(special);
  });
  test("falls back to the first timed event", () => {
    const routine = ev({ start: "09:00", title: "Gazette", routine: true });
    expect(tomorrowPreview(mkDay([routine]))).toBe(routine);
  });
  test("no timed events or no day: null", () => {
    expect(tomorrowPreview(mkDay([ev({ title: "All day" })]))).toBeNull();
    expect(tomorrowPreview(null)).toBeNull();
  });
});
