import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
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

export function stripFences(s: string): string {
  const m = /```(?:json)?\s*([\s\S]*?)```/.exec(s);
  return (m ? m[1] : s).trim();
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

export async function extractActivityPage(
  client: Anthropic,
  imagePath: string,
  month: string,
): Promise<{ days: RawDay[]; warnings: string[] }> {
  const mediaType = imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const data = fs.readFileSync(imagePath).toString("base64");
  const res = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8000,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data } },
        { type: "text", text: buildActivityPrompt(month) },
      ],
    }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return rawPageSchema.parse(JSON.parse(stripFences(text)));
}
