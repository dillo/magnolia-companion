import fs from "node:fs";
import path from "node:path";
import {
  activityMonthSchema, contactsSchema, holidaysSchema, menuWeekSchema, nearbyPlacesSchema,
  type ActivityMonth, type ContactsDirectory, type Holiday, type MenuWeek, type NearbyPlacesDirectory,
} from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readDir<T>(sub: string, parse: (raw: unknown, file: string) => T): T[] {
  const dir = path.join(CONTENT_DIR, sub);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => parse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), f));
}

/** Throws on invalid JSON/schema — failing the build is the point. */
export function loadActivityMonths(): ActivityMonth[] {
  return readDir("activities", (raw, file) => {
    try {
      return activityMonthSchema.parse(raw);
    } catch (err) {
      throw new Error(`content/activities/${file}: ${err instanceof Error ? err.message : err}`);
    }
  }).sort((a, b) => a.month.localeCompare(b.month));
}

export function loadMenuWeeks(): MenuWeek[] {
  return readDir("menus", (raw, file) => {
    try {
      return menuWeekSchema.parse(raw);
    } catch (err) {
      throw new Error(`content/menus/${file}: ${err instanceof Error ? err.message : err}`);
    }
  }).sort((a, b) => a.weekOf.localeCompare(b.weekOf));
}

export function loadHolidays(): Holiday[] {
  const file = path.join(CONTENT_DIR, "holidays.json");
  if (!fs.existsSync(file)) return [];
  try {
    return holidaysSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")))
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title));
  } catch (err) {
    throw new Error(`content/holidays.json: ${err instanceof Error ? err.message : err}`);
  }
}

export function loadNearbyPlaces(): NearbyPlacesDirectory {
  const file = path.join(CONTENT_DIR, "nearby-places.json");
  if (!fs.existsSync(file)) {
    return {
      center: {
        name: "Magnolia Place of Roswell",
        address: "655 Mansell Rd, Roswell, GA 30076",
        latitude: 34.0403,
        longitude: -84.3373,
      },
      places: [],
    };
  }
  try {
    return nearbyPlacesSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (err) {
    throw new Error(`content/nearby-places.json: ${err instanceof Error ? err.message : err}`);
  }
}

export function loadContacts(): ContactsDirectory {
  const file = path.join(CONTENT_DIR, "contacts.json");
  if (!fs.existsSync(file)) return { contacts: [] };
  try {
    return contactsSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (err) {
    throw new Error(`content/contacts.json: ${err instanceof Error ? err.message : err}`);
  }
}
