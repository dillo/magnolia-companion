import { APP_TIME_ZONE } from "./dates";
import type { ActivityDay, ActivityEvent } from "./schema";

const DEFAULT_EVENT_MINUTES = 60;

/** Current wall-clock time in the app time zone as zero-padded "HH:MM" (00-23 hours). */
export function clockHHMM(now: Date = new Date(), timeZone = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(now);
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function greetingFor(hhmm: string): string {
  if (hhmm < "12:00") return "Good morning";
  if (hhmm < "17:00") return "Good afternoon";
  return "Good evening";
}

type TimedEvent = ActivityEvent & { start: string };

/** Timed events in start order; "all day" events (no start) are excluded. */
function timedEvents(events: ActivityEvent[]): TimedEvent[] {
  return events
    .filter((e): e is TimedEvent => e.start !== null)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Printed end, else start + 60 minutes capped at the next event's start. */
function effectiveEndMinutes(timed: TimedEvent[], i: number): number {
  const e = timed[i];
  if (e.end) return minutesOf(e.end);
  const capped = minutesOf(e.start) + DEFAULT_EVENT_MINUTES;
  return i + 1 < timed.length ? Math.min(capped, minutesOf(timed[i + 1].start)) : capped;
}

export type HeroState =
  | { kind: "now"; event: ActivityEvent; next: ActivityEvent | null }
  | { kind: "upcoming"; event: ActivityEvent; first: boolean; minutesUntil: number }
  | { kind: "done" };

/** Hero card state at `hhmm`; null when the day has no timed events (hero not rendered). */
export function heroStateFor(events: ActivityEvent[], hhmm: string): HeroState | null {
  const timed = timedEvents(events);
  if (timed.length === 0) return null;
  const now = minutesOf(hhmm);
  for (let i = 0; i < timed.length; i++) {
    const start = minutesOf(timed[i].start);
    if (now < start) {
      return { kind: "upcoming", event: timed[i], first: i === 0, minutesUntil: start - now };
    }
    if (now < effectiveEndMinutes(timed, i)) {
      return { kind: "now", event: timed[i], next: timed[i + 1] ?? null };
    }
  }
  return { kind: "done" };
}

export type TimelineStatus = "past" | "current" | "upcoming" | "allday";

/** Status per event, in input order. All-day events are "allday" and never fade. */
export function timelineStatuses(events: ActivityEvent[], hhmm: string): TimelineStatus[] {
  const timed = timedEvents(events);
  const now = minutesOf(hhmm);
  return events.map((e) => {
    if (e.start === null) return "allday";
    const i = timed.indexOf(e as TimedEvent);
    if (now >= effectiveEndMinutes(timed, i)) return "past";
    if (now >= minutesOf(e.start)) return "current";
    return "upcoming";
  });
}

/** True while `hhmm` is inside the meal's serving window (inclusive). */
export function servingNow(meal: { start: string; end: string }, hhmm: string | null): boolean {
  return hhmm !== null && hhmm >= meal.start && hhmm <= meal.end;
}

/** What the day-complete hero advertises for tomorrow: first timed special, else first timed event. */
export function tomorrowPreview(day: ActivityDay | null): ActivityEvent | null {
  if (!day) return null;
  const timed = timedEvents(day.events);
  return timed.find((e) => !e.routine) ?? timed[0] ?? null;
}
