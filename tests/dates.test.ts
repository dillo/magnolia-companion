import { describe, expect, test } from "vitest";
import {
  todayISO, addDaysISO, mondayOfISO, sundayOfISO, monthOfISO,
  dayNameOfISO, longDateOfISO, monthDayOfISO, monthNameOfISO, formatTime,
  msUntilNextLocalDate,
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

describe("msUntilNextLocalDate", () => {
  test("returns time until the next New York midnight", () => {
    expect(msUntilNextLocalDate(new Date("2026-07-09T02:00:00Z"))).toBe(2 * 60 * 60 * 1000);
  });

  test("handles daylight saving boundaries", () => {
    expect(msUntilNextLocalDate(new Date("2026-03-08T04:30:00Z"))).toBe(30 * 60 * 1000);
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

describe("sundayOfISO", () => {
  test("Wednesday maps to its Sunday-start menu week", () => {
    expect(sundayOfISO("2026-07-08")).toBe("2026-07-05");
  });
  test("Sunday maps to itself", () => {
    expect(sundayOfISO("2026-07-12")).toBe("2026-07-12");
  });
});

describe("formatting", () => {
  test("monthOfISO", () => expect(monthOfISO("2026-07-08")).toBe("2026-07"));
  test("dayNameOfISO", () => expect(dayNameOfISO("2026-07-08")).toBe("Wednesday"));
  test("longDateOfISO", () => expect(longDateOfISO("2026-07-08")).toBe("July 8, 2026"));
  test("monthDayOfISO", () => expect(monthDayOfISO("2026-07-08")).toBe("July 8"));
  test("monthNameOfISO", () => expect(monthNameOfISO("2026-08-01")).toBe("August"));
});

describe("formatTime", () => {
  test("pm hours drop to 12h clock", () => expect(formatTime("15:00")).toBe("3:00 PM"));
  test("am hour keeps minutes", () => expect(formatTime("09:05")).toBe("9:05 AM"));
  test("noon stays 12", () => expect(formatTime("12:30")).toBe("12:30 PM"));
  test("midnight is 12", () => expect(formatTime("00:15")).toBe("12:15 AM"));
});
