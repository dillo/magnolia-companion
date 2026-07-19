import { z } from "zod";
import { addDaysISO } from "./dates";

export const DIMENSIONS = [
  "physical", "emotional", "spiritual", "move", "learn",
  "social", "intellectual", "entertainment", "nutritional", "connect",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const time24 = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "expected HH:MM 24h");

export const eventSchema = z.object({
  start: time24.nullable(),
  end: time24.nullable(),
  title: z.string().min(1),
  location: z.string().min(1).nullable(),
  dimension: z.enum(DIMENSIONS).nullable(),
  routine: z.boolean(),
});
export type ActivityEvent = z.infer<typeof eventSchema>;

export const activityDaySchema = z.object({
  date: isoDate,
  theme: z.string().min(1).nullable(),
  events: z.array(eventSchema),
});
export type ActivityDay = z.infer<typeof activityDaySchema>;

export const activityMonthSchema = z
  .object({
    month: z.string().regex(/^\d{4}-\d{2}$/, "expected YYYY-MM"),
    sourceScans: z.array(z.string().min(1)),
    days: z.array(activityDaySchema),
  })
  .superRefine((m, ctx) => {
    const seen = new Set<string>();
    for (const d of m.days) {
      if (!d.date.startsWith(`${m.month}-`)) {
        ctx.addIssue({ code: "custom", message: `day ${d.date} outside month ${m.month}` });
      }
      if (seen.has(d.date)) {
        ctx.addIssue({ code: "custom", message: `duplicate day ${d.date}` });
      }
      seen.add(d.date);
    }
  });
export type ActivityMonth = z.infer<typeof activityMonthSchema>;

export const MEAL_KINDS = ["main", "side", "dessert", "drink"] as const;
export const mealItemSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(MEAL_KINDS),
});
export type MealItem = z.infer<typeof mealItemSchema>;

export const mealSchema = z.object({ items: z.array(mealItemSchema) });
export type Meal = z.infer<typeof mealSchema>;

export const menuDaySchema = z.object({
  date: isoDate,
  breakfast: mealSchema,
  lunch: mealSchema,
  dinner: mealSchema,
});
export type MenuDay = z.infer<typeof menuDaySchema>;

export const menuWeekSchema = z
  .object({
    weekOf: isoDate,
    sourceScan: z.string().min(1).nullable(),
    alwaysAvailable: z.array(z.string().min(1)),
    days: z.array(menuDaySchema).min(1).max(7),
  })
  .superRefine((w, ctx) => {
    const end = addDaysISO(w.weekOf, 6);
    const seen = new Set<string>();
    for (const d of w.days) {
      if (d.date < w.weekOf || d.date > end) {
        ctx.addIssue({ code: "custom", message: `day ${d.date} outside week of ${w.weekOf}` });
      }
      if (seen.has(d.date)) {
        ctx.addIssue({ code: "custom", message: `duplicate day ${d.date}` });
      }
      seen.add(d.date);
    }
  });
export type MenuWeek = z.infer<typeof menuWeekSchema>;

export const VISIT_DAY_TYPES = ["federal", "family", "jewish", "christian"] as const;
export type VisitDayType = (typeof VISIT_DAY_TYPES)[number];

export const visitDaySchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    title: z.string().min(1),
    type: z.enum(VISIT_DAY_TYPES),
    timing: z.string().min(1).nullable(),
    note: z.string().min(1),
  })
  .superRefine((v, ctx) => {
    if (v.endDate < v.startDate) {
      ctx.addIssue({ code: "custom", message: `${v.title} ends before it starts` });
    }
  });
export type VisitDay = z.infer<typeof visitDaySchema>;

export const visitDaysSchema = z.array(visitDaySchema).superRefine((days, ctx) => {
  const seen = new Set<string>();
  for (const day of days) {
    const key = `${day.startDate}:${day.title}`;
    if (seen.has(key)) {
      ctx.addIssue({ code: "custom", message: `duplicate visit day ${key}` });
    }
    seen.add(key);
  }
});

export const NEARBY_PLACE_CATEGORIES = [
  "hair_salon", "restaurant", "shop", "medical", "park", "activity",
] as const;
export type NearbyPlaceCategory = (typeof NEARBY_PLACE_CATEGORIES)[number];

export const nearbyPlaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(NEARBY_PLACE_CATEGORIES),
  address: z.string().min(1),
  phone: z.string().min(1).nullable(),
  website: z.string().url().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  distanceMiles: z.number().nonnegative(),
  summary: z.string().min(1),
  seniorFriendly: z.boolean(),
  notes: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)),
});
export type NearbyPlace = z.infer<typeof nearbyPlaceSchema>;

export const nearbyPlacesSchema = z.object({
  center: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    latitude: z.number(),
    longitude: z.number(),
  }),
  places: z.array(nearbyPlaceSchema),
}).superRefine((directory, ctx) => {
  const seen = new Set<string>();
  for (const place of directory.places) {
    if (seen.has(place.id)) {
      ctx.addIssue({ code: "custom", message: `duplicate nearby place ${place.id}` });
    }
    seen.add(place.id);
  }
});
export type NearbyPlacesDirectory = z.infer<typeof nearbyPlacesSchema>;
