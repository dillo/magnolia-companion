import { describe, expect, test } from "vitest";
import {
  todayISO, addDaysISO, mondayOfISO, monthOfISO,
  dayNameOfISO, longDateOfISO, monthNameOfISO, formatTime,
} from "@/lib/dates";

describe("todayISO", () => {
  test("converts UTC instant to New York date", () => {
    // 2026-07-09 02:00 UTC is still 2026-07-08 22:00 in New York (EDT)
    expect(todayISO(new Date("2026-07-09T02:00:00Z"))).toBe("2026-07-08");
  });
  test("midnight rollover in New York", () => {
    expect(todayISO(new Date("2026-07-09T04:01:00Z"))).toBe("2026-07-09");
  });
});

describe("addDaysISO", () => {
  test("crosses month boundary", () => {
    expect(addDaysISO("2026-07-31", 1)).toBe("2026-08-01");
  });
  test("negative offsets", () => {
    expect(addDaysISO("2026-08-01", -1)).toBe("2026-07-31");
  });
});

describe("mondayOfISO", () => {
  test("Wednesday maps to its Monday", () => {
    expect(mondayOfISO("2026-07-08")).toBe("2026-07-06");
  });
  test("Sunday belongs to the preceding Monday's week", () => {
    expect(mondayOfISO("2026-07-12")).toBe("2026-07-06");
  });
  test("Monday maps to itself", () => {
    expect(mondayOfISO("2026-07-06")).toBe("2026-07-06");
  });
});

describe("formatting", () => {
  test("monthOfISO", () => expect(monthOfISO("2026-07-08")).toBe("2026-07"));
  test("dayNameOfISO", () => expect(dayNameOfISO("2026-07-08")).toBe("Wednesday"));
  test("longDateOfISO", () => expect(longDateOfISO("2026-07-08")).toBe("July 8, 2026"));
  test("monthNameOfISO", () => expect(monthNameOfISO("2026-08-01")).toBe("August"));
});

describe("formatTime", () => {
  test("pm hours drop to 12h clock", () => expect(formatTime("15:00")).toBe("3:00"));
  test("am hour keeps minutes", () => expect(formatTime("09:05")).toBe("9:05"));
  test("noon stays 12", () => expect(formatTime("12:30")).toBe("12:30"));
  test("midnight is 12", () => expect(formatTime("00:15")).toBe("12:15"));
});
