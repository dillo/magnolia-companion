import { DIMENSIONS, activityMonthSchema, type ActivityMonth, type Dimension } from "@/lib/schema";

export type RawEvent = {
  time: string | null;
  title: string;
  locationCode: string | null;
  dimension: string | null;
};
export type RawDay = { date: string; theme: string | null; events: RawEvent[] };

export const LOCATION_CODES: Record<string, string> = {
  AR: "Activity Room",
  B: "Bistro",
  BT: "Bus Trip",
  FP: "Front Portico",
  LR: "Living Room",
};

export const ROUTINE_MIN_DAYS = 10;

export function inferTime24(time: string | null, ctx: string, warnings: string[]): string | null {
  if (time === null) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) {
    warnings.push(`${ctx}: unreadable time "${time}"`);
    return null;
  }
  let h = Number(m[1]);
  if (h >= 7 && h <= 11) {
    // morning, keep as-is
  } else if (h >= 1 && h <= 6) {
    h += 12;
  } else if (h !== 12) {
    warnings.push(`${ctx}: time "${time}" outside expected 7:00–11:59 am / 12:00–6:59 pm range`);
  }
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

export function expandLocation(code: string | null, ctx: string, warnings: string[]): string | null {
  if (code === null) return null;
  const expanded = LOCATION_CODES[code.toUpperCase()];
  if (!expanded) {
    warnings.push(`${ctx}: unknown location code "${code}"`);
    return code;
  }
  return expanded;
}

export function mergePages(pages: RawDay[][]): RawDay[] {
  const byDate = new Map<string, RawDay>();
  for (const page of pages) {
    for (const d of page) {
      if (byDate.has(d.date)) throw new Error(`duplicate date across pages: ${d.date}`);
      byDate.set(d.date, d);
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function routineTitles(days: RawDay[]): Set<string> {
  const datesByTitle = new Map<string, Set<string>>();
  for (const d of days) {
    for (const e of d.events) {
      const key = e.title.trim().toLowerCase();
      let dates = datesByTitle.get(key);
      if (!dates) {
        dates = new Set();
        datesByTitle.set(key, dates);
      }
      dates.add(d.date);
    }
  }
  return new Set(
    [...datesByTitle].filter(([, dates]) => dates.size >= ROUTINE_MIN_DAYS).map(([title]) => title),
  );
}

export function buildActivityMonth(
  month: string,
  sourceScans: string[],
  pages: RawDay[][],
): { data: ActivityMonth; warnings: string[] } {
  const warnings: string[] = [];
  const days = mergePages(pages);
  const routine = routineTitles(days);
  const data = activityMonthSchema.parse({
    month,
    sourceScans,
    days: days.map((d) => ({
      date: d.date,
      theme: d.theme,
      events: d.events.map((e) => {
        const ctx = `${d.date} "${e.title}"`;
        const isDim = e.dimension !== null && (DIMENSIONS as readonly string[]).includes(e.dimension);
        if (e.dimension !== null && !isDim) warnings.push(`${ctx}: unknown dimension "${e.dimension}"`);
        return {
          start: inferTime24(e.time, ctx, warnings),
          end: null,
          title: e.title.trim(),
          location: expandLocation(e.locationCode, ctx, warnings),
          dimension: isDim ? (e.dimension as Dimension) : null,
          routine: routine.has(e.title.trim().toLowerCase()),
        };
      }),
    })),
  });
  return { data, warnings };
}
