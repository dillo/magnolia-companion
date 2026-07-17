import type { ActivityMonth, ActivityDay, MenuWeek, MenuDay, VisitDay } from "./schema";
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

export function upcomingVisitDays(days: VisitDay[], today: string, limit?: number): VisitDay[] {
  const upcoming = days
    .filter((day) => day.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title));
  return typeof limit === "number" ? upcoming.slice(0, limit) : upcoming;
}

export function visitDaysInRange(days: VisitDay[], start: string, end: string): VisitDay[] {
  return days
    .filter((day) => day.startDate <= end && day.endDate >= start)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title));
}
