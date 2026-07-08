import fs from "node:fs";
import path from "node:path";
import {
  activityMonthSchema, menuWeekSchema,
  type ActivityMonth, type MenuWeek,
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
