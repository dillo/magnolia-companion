const DAY_MS = 86_400_000;

/** Anchor an ISO date at UTC noon so day math never crosses DST boundaries. */
function toUTCNoon(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

export function todayISO(now: Date = new Date(), timeZone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function addDaysISO(iso: string, n: number): string {
  return new Date(toUTCNoon(iso).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

export function mondayOfISO(iso: string): string {
  const dow = toUTCNoon(iso).getUTCDay(); // 0 = Sunday
  return addDaysISO(iso, dow === 0 ? -6 : 1 - dow);
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

export function monthNameOfISO(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long" }).format(toUTCNoon(iso));
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}`;
}
