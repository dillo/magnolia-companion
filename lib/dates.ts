const DAY_MS = 86_400_000;
export const APP_TIME_ZONE = "America/New_York";

/** Anchor an ISO date at UTC noon so day math never crosses DST boundaries. */
function toUTCNoon(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

export function todayISO(now: Date = new Date(), timeZone = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function msUntilNextLocalDate(now: Date = new Date(), timeZone = APP_TIME_ZONE): number {
  const current = todayISO(now, timeZone);
  const startMs = now.getTime();
  let low = startMs + 1;
  let high = startMs + DAY_MS * 2;

  while (todayISO(new Date(high), timeZone) === current) {
    high += DAY_MS;
  }

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (todayISO(new Date(mid), timeZone) === current) low = mid + 1;
    else high = mid;
  }

  return Math.max(0, low - startMs);
}

export function addDaysISO(iso: string, n: number): string {
  return new Date(toUTCNoon(iso).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

export function mondayOfISO(iso: string): string {
  const dow = toUTCNoon(iso).getUTCDay(); // 0 = Sunday
  return addDaysISO(iso, dow === 0 ? -6 : 1 - dow);
}

export function sundayOfISO(iso: string): string {
  return addDaysISO(iso, -toUTCNoon(iso).getUTCDay());
}

export function monthOfISO(iso: string): string {
  return iso.slice(0, 7);
}

export function dayNameOfISO(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long" }).format(toUTCNoon(iso));
}

export function longDateOfISO(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: "long", day: "numeric", year: "numeric",
  }).format(toUTCNoon(iso));
}

export function monthDayOfISO(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: "long", day: "numeric",
  }).format(toUTCNoon(iso));
}

export function monthNameOfISO(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long" }).format(toUTCNoon(iso));
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const meridiem = h < 12 ? "AM" : "PM";
  return `${h12}:${String(m).padStart(2, "0")} ${meridiem}`;
}
