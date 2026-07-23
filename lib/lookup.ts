import type { ActivityMonth, ActivityDay, Holiday, MenuWeek, MenuDay } from "./schema";
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

export function upcomingHolidays(holidays: Holiday[], today: string, limit?: number): Holiday[] {
  const upcoming = holidays
    .filter((holiday) => holiday.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title));
  return typeof limit === "number" ? upcoming.slice(0, limit) : upcoming;
}

export function holidaysInRange(holidays: Holiday[], start: string, end: string): Holiday[] {
  return holidays
    .filter((holiday) => holiday.startDate <= end && holiday.endDate >= start)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title));
}
