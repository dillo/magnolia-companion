import type { ActivityMonth, ActivityDay, MenuWeek, MenuDay } from "./schema";
import { addDaysISO, monthOfISO } from "./dates";

export function findActivityDay(months: ActivityMonth[], date: string): ActivityDay | null {
  const month = months.find((m) => m.month === monthOfISO(date));
  return month?.days.find((d) => d.date === date) ?? null;
}

export function publishedMenuWeeks(weeks: MenuWeek[]): MenuWeek[] {
  return weeks.filter((w) => w.sourceScan !== null);
}

export function menuWeekFor(weeks: MenuWeek[], date: string): MenuWeek | null {
  return publishedMenuWeeks(weeks).find((w) => date >= w.weekOf && date <= addDaysISO(w.weekOf, 6)) ?? null;
}

export function findMenuDay(weeks: MenuWeek[], date: string): MenuDay | null {
  return menuWeekFor(weeks, date)?.days.find((d) => d.date === date) ?? null;
}

export function scansForDate(months: ActivityMonth[], date: string): string[] {
  return months.find((m) => m.month === monthOfISO(date))?.sourceScans ?? [];
}
