import { describe, expect, test } from "vitest";
import {
  buildGoIconActivityMonth,
  currentAndNextMonth,
  endpointForMonth,
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

  test("computes default month pair and endpoint", () => {
    expect(currentAndNextMonth("2026-07-12")).toEqual(["2026-07", "2026-08"]);
    expect(endpointForMonth("2026-07")).toBe(
      "https://calendar.goicon.co/.netlify/functions/proxy?facilityId=3021&token=680ac1cd79254&year=2026&month=7&serviceLevel=AL",
    );
  });
});
