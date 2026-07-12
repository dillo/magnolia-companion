import { z } from "zod";
import { activityMonthSchema, DIMENSIONS, type ActivityMonth, type Dimension } from "@/lib/schema";
import { APP_TIME_ZONE } from "@/lib/dates";
import { routineTitles, type RawDay, type RawEvent } from "@/lib/ingest/postprocess";

export const GOICON_DEFAULTS = {
  facilityId: "3021",
  token: "680ac1cd79254",
  serviceLevel: "AL",
} as const;

const goIconDateSchema = z.object({
  m: z.string().datetime(),
});

const goIconDimensionSchema = z.object({
  i_percentage: z.number(),
  dimension: z.object({
    v_name: z.string(),
  }),
});

const goIconEventSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  start_date: goIconDateSchema,
  end_date: goIconDateSchema,
  i_all_day: z.union([z.number(), z.boolean()]).nullable().optional(),
  location: z.object({
    v_name: z.string().nullable(),
  }).nullable().optional(),
  eventDimensions: z.array(goIconDimensionSchema).nullable().optional(),
});

export const goIconEventsSchema = z.array(goIconEventSchema);
export type GoIconEvent = z.infer<typeof goIconEventSchema>;

export type GoIconFetchOptions = {
  facilityId?: string;
  token?: string;
  serviceLevel?: string;
};

const DIMENSION_MAP: Record<string, Dimension> = {
  physical: "physical",
  emotional: "emotional",
  spiritual: "spiritual",
  social: "social",
  intellectual: "intellectual",
  nutritional: "nutritional",
  environmental: "connect",
  purposeful: "connect",
  vocational: "learn",
  "health services": "physical",
};

function partsInAppZone(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function monthAfter(month: string): string {
  const [year, mo] = month.split("-").map(Number);
  return new Date(Date.UTC(year, mo, 1)).toISOString().slice(0, 7);
}

function titleCase(title: string): string {
  const cased = title
    .trim()
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bNat'L\b/g, "Nat'l")
    .replace(/\bNat'l\b/g, "Nat'l")
    .replace(/\b(And|Or|Of|The|In|On|At|To|For|With)\b/g, (m) => m.toLowerCase())
    .replace(/\bUsa\b/g, "USA");
  return cased.charAt(0).toUpperCase() + cased.slice(1);
}

function dimensionFor(event: GoIconEvent): Dimension | null {
  const sorted = [...(event.eventDimensions ?? [])]
    .filter((entry) => entry.i_percentage > 0)
    .sort((a, b) => b.i_percentage - a.i_percentage);
  const name = sorted[0]?.dimension.v_name.trim().toLowerCase();
  if (!name) return null;
  if ((DIMENSIONS as readonly string[]).includes(name)) return name as Dimension;
  return DIMENSION_MAP[name] ?? null;
}

function isAllDay(event: GoIconEvent): boolean {
  return event.i_all_day === true || event.i_all_day === 1 || event.location?.v_name?.toLowerCase() === "all day";
}

function toRawEvent(event: GoIconEvent): RawEvent {
  const start = partsInAppZone(event.start_date.m);
  return {
    time: start.time,
    title: titleCase(event.title),
    locationCode: event.location?.v_name && event.location.v_name !== "All Day" ? event.location.v_name : null,
    dimension: dimensionFor(event),
  };
}

export function buildGoIconActivityMonth(month: string, events: GoIconEvent[]): ActivityMonth {
  const byDate = new Map<string, { theme: string | null; events: RawEvent[] }>();
  const [year, mo] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, mo, 0)).getUTCDate();

  for (let day = 1; day <= daysInMonth; day++) {
    byDate.set(`${month}-${String(day).padStart(2, "0")}`, { theme: null, events: [] });
  }

  for (const event of events) {
    const start = partsInAppZone(event.start_date.m);
    if (!start.date.startsWith(`${month}-`)) continue;
    const day = byDate.get(start.date);
    if (!day) continue;

    if (isAllDay(event)) {
      const theme = titleCase(event.title);
      day.theme = day.theme ? `${day.theme} / ${theme}` : theme;
    } else {
      day.events.push(toRawEvent(event));
    }
  }

  const rawDays: RawDay[] = [...byDate].map(([date, day]) => ({
    date,
    theme: day.theme,
    events: day.events.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")),
  }));
  const routine = routineTitles(rawDays);

  return activityMonthSchema.parse({
    month,
    sourceScans: [],
    days: rawDays.map((day) => ({
      date: day.date,
      theme: day.theme,
      events: day.events.map((event) => ({
        start: event.time,
        end: null,
        title: event.title,
        location: event.locationCode,
        dimension: event.dimension,
        routine: routine.has(event.title.trim().toLowerCase()),
      })),
    })),
  });
}

export function currentAndNextMonth(todayISO: string): string[] {
  const current = todayISO.slice(0, 7);
  return [current, monthAfter(current)];
}

export function endpointForMonth(month: string, options: GoIconFetchOptions = {}): string {
  const [year, mo] = month.split("-");
  const params = new URLSearchParams({
    facilityId: options.facilityId ?? GOICON_DEFAULTS.facilityId,
    token: options.token ?? GOICON_DEFAULTS.token,
    year,
    month: String(Number(mo)),
    serviceLevel: options.serviceLevel ?? GOICON_DEFAULTS.serviceLevel,
  });
  return `https://calendar.goicon.co/.netlify/functions/proxy?${params}`;
}

export async function fetchGoIconEvents(month: string, options: GoIconFetchOptions = {}): Promise<GoIconEvent[]> {
  const response = await fetch(endpointForMonth(month, options));
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Go Icon request failed for ${month}: HTTP ${response.status} ${text.slice(0, 300)}`);
  }
  const raw: unknown = JSON.parse(text);
  if (raw && typeof raw === "object" && "shouldChunk" in raw) {
    throw new Error(`Go Icon requested chunking for ${month}; this ingest currently expects full-month responses`);
  }
  return goIconEventsSchema.parse(raw);
}

export async function fetchGoIconActivityMonths(
  months: string[],
  options: GoIconFetchOptions = {},
): Promise<ActivityMonth[]> {
  const data = await Promise.all(months.map(async (month) => {
    const events = await fetchGoIconEvents(month, options);
    return buildGoIconActivityMonth(month, events);
  }));
  return data.sort((a, b) => a.month.localeCompare(b.month));
}
