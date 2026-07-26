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

export const HOLIDAY_CATEGORIES = ["federal", "family", "jewish", "christian"] as const;
export type HolidayCategory = (typeof HOLIDAY_CATEGORIES)[number];

export const holidaySchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    title: z.string().min(1),
    categories: z.array(z.enum(HOLIDAY_CATEGORIES)).min(1),
    timing: z.string().min(1).nullable(),
    note: z.string().min(1),
  })
  .superRefine((holiday, ctx) => {
    if (holiday.endDate < holiday.startDate) {
      ctx.addIssue({ code: "custom", message: `${holiday.title} ends before it starts` });
    }
    if (new Set(holiday.categories).size !== holiday.categories.length) {
      ctx.addIssue({ code: "custom", message: `${holiday.title} has duplicate categories` });
    }
  });
export type Holiday = z.infer<typeof holidaySchema>;

export const holidaysSchema = z.array(holidaySchema).superRefine((holidays, ctx) => {
  const seen = new Set<string>();
  for (const holiday of holidays) {
    const key = `${holiday.startDate}:${holiday.title}`;
    if (seen.has(key)) {
      ctx.addIssue({ code: "custom", message: `duplicate holiday ${key}` });
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

export const CONTACT_CATEGORIES = ["magnolia", "emergency", "doctors"] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const contactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  category: z.enum(CONTACT_CATEGORIES),
  cell: z.string().min(1).nullable(),
  main: z.string().min(1).nullable(),
  fax: z.string().min(1).nullable(),
  email: z.string().email().nullable(),
  address: z.string().min(1).optional(),
});
export type Contact = z.infer<typeof contactSchema>;

export const contactsSchema = z
  .object({ contacts: z.array(contactSchema) })
  .superRefine((directory, ctx) => {
    const seen = new Set<string>();
    for (const contact of directory.contacts) {
      if (seen.has(contact.id)) {
        ctx.addIssue({ code: "custom", message: `duplicate contact ${contact.id}` });
      }
      seen.add(contact.id);
    }
  });
export type ContactsDirectory = z.infer<typeof contactsSchema>;

export const MEDICATION_PERIODS = ["morning", "evening"] as const;
export type MedicationPeriod = (typeof MEDICATION_PERIODS)[number];

export const MEDICATION_DAYS = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;
export type MedicationDay = (typeof MEDICATION_DAYS)[number];

export const medicationDoseSchema = z
  .object({
    period: z.enum(MEDICATION_PERIODS),
    amount: z.string().min(1),
    days: z.array(z.enum(MEDICATION_DAYS)).min(1),
  })
  .superRefine((dose, ctx) => {
    if (new Set(dose.days).size !== dose.days.length) {
      ctx.addIssue({ code: "custom", message: "dose has duplicate days" });
    }
  });
export type MedicationDose = z.infer<typeof medicationDoseSchema>;

export const medicationSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    purpose: z.string().min(1),
    doses: z.array(medicationDoseSchema).min(1),
  })
  .superRefine((medication, ctx) => {
    const covered = new Set<string>();
    for (const dose of medication.doses) {
      for (const day of dose.days) {
        const key = `${dose.period}:${day}`;
        if (covered.has(key)) {
          ctx.addIssue({
            code: "custom",
            message: `${medication.name} has overlapping ${dose.period} doses on ${day}`,
          });
        }
        covered.add(key);
      }
    }
  });
export type Medication = z.infer<typeof medicationSchema>;

export const medicationsSchema = z
  .object({ medications: z.array(medicationSchema) })
  .superRefine((directory, ctx) => {
    const seen = new Set<string>();
    for (const medication of directory.medications) {
      if (seen.has(medication.id)) {
        ctx.addIssue({ code: "custom", message: `duplicate medication id ${medication.id}` });
      }
      seen.add(medication.id);
    }
  });
export type MedicationsDirectory = z.infer<typeof medicationsSchema>;
