import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { MEAL_KINDS, type MenuWeek } from "@/lib/schema";
import type { RawDay } from "./postprocess";

export const rawPageSchema = z.object({
  days: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      theme: z.string().min(1).nullable(),
      events: z.array(
        z.object({
          time: z.string().nullable(),
          title: z.string().min(1),
          locationCode: z.string().nullable(),
          dimension: z.string().nullable(),
        }),
      ),
    }),
  ),
  warnings: z.array(z.string()),
});

const mealItemSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(MEAL_KINDS),
});

const mealSchema = z.object({ items: z.array(mealItemSchema) });

export const rawMenuWeekSchema = z.object({
  weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  alwaysAvailable: z.array(z.string().min(1)),
  days: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    breakfast: mealSchema,
    lunch: mealSchema,
    dinner: mealSchema,
  })).min(1).max(7),
  warnings: z.array(z.string()),
});

export type RawMenuWeek = z.infer<typeof rawMenuWeekSchema>;

export function stripFences(s: string): string {
  const m = /```(?:json)?\s*([\s\S]*?)```/.exec(s);
  return (m ? m[1] : s).trim();
}

export function parsePageText(
  text: string,
  stopReason: string | null,
): { days: RawDay[]; warnings: string[] } {
  if (stopReason === "max_tokens") {
    throw new Error("model output was truncated (hit max_tokens) — raise max_tokens in lib/ingest/extract.ts and retry");
  }
  if (stopReason === "refusal") {
    throw new Error("the model refused this request — check the photo and retry");
  }
  return rawPageSchema.parse(JSON.parse(stripFences(text)));
}

export function parseMenuText(text: string, stopReason: string | null): RawMenuWeek {
  if (stopReason === "max_tokens") {
    throw new Error("model output was truncated (hit max_tokens) — raise max_tokens in lib/ingest/extract.ts and retry");
  }
  if (stopReason === "refusal") {
    throw new Error("the model refused this request — check the photo and retry");
  }
  return rawMenuWeekSchema.parse(JSON.parse(stripFences(text)));
}

export function buildActivityPrompt(month: string): string {
  return `You are reading a photographed page of the printed monthly activity calendar from Magnolia Place of Roswell, a senior assisted living facility, for the month ${month}.

Return ONLY a JSON object (no prose, no markdown fence) with this exact shape:
{
  "days": [
    { "date": "YYYY-MM-DD", "theme": string|null,
      "events": [ { "time": string|null, "title": string, "locationCode": string|null, "dimension": string|null } ] }
  ],
  "warnings": [ string ]
}

Rules:
- Include only dates actually visible on this page, using month ${month} for the date prefix.
- "theme" is the all-day day title printed at the top of a date cell (e.g. "NAT'L RASPBERRY DAY"), converted to Title Case ("Nat'l Raspberry Day"); null if none.
- "time" is exactly as printed (e.g. "9:00", "10:15"). Use null for all-day items.
- "title" is the event text with any trailing location code removed.
- "locationCode" is the trailing code when present: AR, B, BT, FP, or LR. "AD" printed beside an item means All Day — it is NOT a location; set time to null instead and leave locationCode null.
- "dimension" is your best classification of the event from exactly this list: physical, emotional, spiritual, move, learn, social, intellectual, entertainment, nutritional, connect. Use null when unsure. (The printed colored tick marks are unreadable in photos — classify from the event title.)
- Ignore birthday lists, the meeting-places legend, the Dimensions of Wellness legend, and all page decoration.
- For anything you cannot read confidently, add a warning string naming the date and time slot, and omit or best-guess the entry as appropriate.`;
}

export function buildMenuPrompt(): string {
  return `You are reading a photographed weekly menu from Magnolia Place of Roswell, a senior assisted living facility.

Return ONLY a JSON object (no prose, no markdown fence) with this exact shape:
{
  "weekOf": "YYYY-MM-DD",
  "alwaysAvailable": [ string ],
  "days": [
    {
      "date": "YYYY-MM-DD",
      "breakfast": { "items": [ { "name": string, "kind": "main"|"side"|"dessert"|"drink" } ] },
      "lunch": { "items": [ { "name": string, "kind": "main"|"side"|"dessert"|"drink" } ] },
      "dinner": { "items": [ { "name": string, "kind": "main"|"side"|"dessert"|"drink" } ] }
    }
  ],
  "warnings": [ string ]
}

Rules:
- "weekOf" is the first visible date on the printed menu, even when the week starts on Sunday.
- Include every visible day column in chronological order.
- Convert printed dates like "Sun 07-05-2026" to ISO dates like "2026-07-05".
- Preserve menu item names as printed, but normalize obvious line wrapping into one item.
- Keep repeated items such as coffee, 100% juice, whole grain toast, garden green salad, soup du jour, baked roll, and beverage choice when they are printed in a meal cell.
- Put footer-wide notes such as "Milk offered at every meal" in "alwaysAvailable" instead of repeating them on every meal.
- Ignore nutrition icons and legends (heart, leaf, blue mark) because this app does not store dietary flags yet.
- Classify beverages as "drink"; desserts as "dessert"; vegetables, fruit, bread, toast, rice, potatoes, salad, and other accompaniments as "side"; entrees, soups, sandwiches, pizza, and protein dishes as "main".
- For anything you cannot read confidently, add a warning string naming the date and meal, and omit or best-guess the item as appropriate.`;
}

export async function extractMenuWeek(
  client: Anthropic,
  imagePath: string,
): Promise<RawMenuWeek> {
  const mediaType = imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const data = fs.readFileSync(imagePath).toString("base64");
  const res = await client.messages
    .stream({
      model: "claude-sonnet-5",
      max_tokens: 32000,
      output_config: { format: zodOutputFormat(rawMenuWeekSchema) },
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data } },
          { type: "text", text: buildMenuPrompt() },
        ],
      }],
    })
    .finalMessage();
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return parseMenuText(text, res.stop_reason);
}

export function buildMenuWeek(raw: RawMenuWeek, sourceScan: string): MenuWeek {
  return {
    weekOf: raw.weekOf,
    sourceScan,
    alwaysAvailable: raw.alwaysAvailable,
    days: raw.days,
  };
}

export async function extractActivityPage(
  client: Anthropic,
  imagePath: string,
  month: string,
): Promise<{ days: RawDay[]; warnings: string[] }> {
  const mediaType = imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const data = fs.readFileSync(imagePath).toString("base64");
  // Structured outputs guarantee schema-valid JSON; streaming avoids HTTP
  // timeouts at the large max_tokens a full calendar page needs.
  const res = await client.messages
    .stream({
      model: "claude-sonnet-5",
      max_tokens: 64000,
      output_config: { format: zodOutputFormat(rawPageSchema) },
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data } },
          { type: "text", text: buildActivityPrompt(month) },
        ],
      }],
    })
    .finalMessage();
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return parsePageText(text, res.stop_reason);
}
