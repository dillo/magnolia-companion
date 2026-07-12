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
