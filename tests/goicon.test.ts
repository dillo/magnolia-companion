import { describe, expect, test } from "vitest";
import {
  buildGoIconActivityMonth,
  currentAndNextMonth,
  endpointForMonth,
  mergeMemoryCareWednesdayFlyerActivities,
  type GoIconEvent,
} from "@/lib/ingest/goicon";

function event(partial: Partial<GoIconEvent> & Pick<GoIconEvent, "id" | "title" | "start_date" | "end_date">): GoIconEvent {
  return {
    location: { v_name: "Living Room" },
    eventDimensions: [],
    ...partial,
  };
}

describe("Go Icon activity ingest", () => {
  test("builds an activity month from Personal Care calendar events", () => {
    const events: GoIconEvent[] = [
      event({
        id: 1,
        title: "INDEPENDENCE DAY",
        start_date: { m: "2026-07-04T05:00:00.000Z" },
        end_date: { m: "2026-07-05T03:59:59.000Z" },
        i_all_day: true,
        location: { v_name: "All Day" },
      }),
      event({
        id: 2,
        title: "Magnolia Gazette",
        start_date: { m: "2026-07-04T13:00:00.000Z" },
        end_date: { m: "2026-07-04T13:30:00.000Z" },
        eventDimensions: [
          { i_percentage: 80, dimension: { v_name: "Social" } },
          { i_percentage: 20, dimension: { v_name: "Intellectual" } },
        ],
      }),
      event({
        id: 3,
        title: "Garden Club",
        start_date: { m: "2026-07-04T18:00:00.000Z" },
        end_date: { m: "2026-07-04T19:00:00.000Z" },
        location: { v_name: "Front Portico" },
        eventDimensions: [{ i_percentage: 100, dimension: { v_name: "Environmental" } }],
      }),
    ];

    const month = buildGoIconActivityMonth("2026-07", events);
    const jul4 = month.days.find((day) => day.date === "2026-07-04")!;

    expect(month.sourceScans).toEqual([]);
    expect(month.days).toHaveLength(31);
    expect(jul4.theme).toBe("Independence Day");
    expect(jul4.events[0]).toMatchObject({
      start: "09:00",
      title: "Magnolia Gazette",
      location: "Living Room",
      dimension: "social",
    });
    expect(jul4.events[1]).toMatchObject({
      start: "14:00",
      title: "Garden Club",
      location: "Front Portico",
      dimension: "connect",
    });
  });

  test("marks recurring titles as routine", () => {
    const events: GoIconEvent[] = Array.from({ length: 10 }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return event({
        id: i + 1,
        title: "Evening News",
        start_date: { m: `2026-07-${day}T22:00:00.000Z` },
        end_date: { m: `2026-07-${day}T23:00:00.000Z` },
      });
    });

    const month = buildGoIconActivityMonth("2026-07", events);
    expect(month.days[0].events[0]).toMatchObject({ title: "Evening News", routine: true });
  });

  test("drops generic lobby entertainment when a same-slot Personal Care event is more specific", () => {
    const events: GoIconEvent[] = [
      event({
        id: 1,
        title: "Entertainment in the lobby",
        start_date: { m: "2026-07-17T19:00:00.000Z" },
        end_date: { m: "2026-07-17T20:00:00.000Z" },
        location: { v_name: "Living Room" },
      }),
      event({
        id: 2,
        title: "Happy Hour - Piano with John F.",
        start_date: { m: "2026-07-17T19:00:00.000Z" },
        end_date: { m: "2026-07-17T20:00:00.000Z" },
        location: { v_name: "Living Room" },
      }),
      event({
        id: 3,
        title: "Entertainment in the lobby",
        start_date: { m: "2026-07-18T19:00:00.000Z" },
        end_date: { m: "2026-07-18T20:00:00.000Z" },
        location: { v_name: "Living Room" },
      }),
    ];

    const month = buildGoIconActivityMonth("2026-07", events);
    const jul17 = month.days.find((day) => day.date === "2026-07-17")!;
    const jul18 = month.days.find((day) => day.date === "2026-07-18")!;

    expect(jul17.events).toHaveLength(1);
    expect(jul17.events[0]).toMatchObject({ start: "15:00", title: "Happy Hour - Piano with John F." });
    expect(jul18.events[0]).toMatchObject({ start: "15:00", title: "Entertainment in the Lobby" });
  });

  test("computes default month pair and endpoint", () => {
    expect(currentAndNextMonth("2026-07-12")).toEqual(["2026-07", "2026-08"]);
    expect(endpointForMonth("2026-07")).toBe(
      "https://calendar.goicon.co/.netlify/functions/proxy?facilityId=3021&token=680ac1cd79254&year=2026&month=7&serviceLevel=AL",
    );
  });

  test("fills a missing Wednesday 3pm Personal Care slot from Memory Care", () => {
    const personalCare = buildGoIconActivityMonth("2026-07", [
      event({
        id: 1,
        title: "Magnolia Gazette",
        start_date: { m: "2026-07-15T13:00:00.000Z" },
        end_date: { m: "2026-07-15T13:30:00.000Z" },
      }),
    ]);
    const memoryCare = buildGoIconActivityMonth("2026-07", [
      event({
        id: 2,
        title: "Wind Down Wednesday with Live Entertainment",
        start_date: { m: "2026-07-15T18:00:00.000Z" },
        end_date: { m: "2026-07-15T19:00:00.000Z" },
        location: { v_name: "Living Room" },
      }),
      event({
        id: 4,
        title: "Afternoon Hydration",
        start_date: { m: "2026-07-15T18:30:00.000Z" },
        end_date: { m: "2026-07-15T19:00:00.000Z" },
        location: { v_name: "Connections Neighborhood" },
      }),
      event({
        id: 3,
        title: "Connections Bingo",
        start_date: { m: "2026-07-16T19:00:00.000Z" },
        end_date: { m: "2026-07-16T20:00:00.000Z" },
      }),
    ]);

    const merged = mergeMemoryCareWednesdayFlyerActivities(personalCare, memoryCare);
    const jul15 = merged.days.find((day) => day.date === "2026-07-15")!;
    const jul16 = merged.days.find((day) => day.date === "2026-07-16")!;

    expect(jul15.events).toEqual([
      expect.objectContaining({ start: "09:00", title: "Magnolia Gazette" }),
      expect.objectContaining({
        start: "15:00",
        title: "Wind Down Wednesday with Live Entertainment",
        location: "Living Room",
      }),
    ]);
    expect(jul16.events).toHaveLength(0);
  });

  test("does not overwrite an existing Wednesday 3pm Personal Care slot", () => {
    const personalCare = buildGoIconActivityMonth("2026-07", [
      event({
        id: 1,
        title: "Personal Care Entertainment",
        start_date: { m: "2026-07-15T19:00:00.000Z" },
        end_date: { m: "2026-07-15T20:00:00.000Z" },
      }),
    ]);
    const memoryCare = buildGoIconActivityMonth("2026-07", [
      event({
        id: 2,
        title: "Memory Care Entertainment",
        start_date: { m: "2026-07-15T19:00:00.000Z" },
        end_date: { m: "2026-07-15T20:00:00.000Z" },
      }),
    ]);

    const merged = mergeMemoryCareWednesdayFlyerActivities(personalCare, memoryCare);
    const jul15 = merged.days.find((day) => day.date === "2026-07-15")!;

    expect(jul15.events).toHaveLength(1);
    expect(jul15.events[0]).toMatchObject({ start: "15:00", title: "Personal Care Entertainment" });
  });

  test("does not import a Memory Care flyer event when Personal Care has an event at the same source time", () => {
    const personalCare = buildGoIconActivityMonth("2026-07", [
      event({
        id: 1,
        title: "Personal Care Afternoon Event",
        start_date: { m: "2026-07-15T18:00:00.000Z" },
        end_date: { m: "2026-07-15T19:00:00.000Z" },
      }),
    ]);
    const memoryCare = buildGoIconActivityMonth("2026-07", [
      event({
        id: 2,
        title: "Wind Down Wednesday with Live Entertainment",
        start_date: { m: "2026-07-15T18:00:00.000Z" },
        end_date: { m: "2026-07-15T19:00:00.000Z" },
      }),
    ]);

    const merged = mergeMemoryCareWednesdayFlyerActivities(personalCare, memoryCare);
    const jul15 = merged.days.find((day) => day.date === "2026-07-15")!;

    expect(jul15.events).toHaveLength(1);
    expect(jul15.events[0]).toMatchObject({ start: "14:00", title: "Personal Care Afternoon Event" });
  });
});
