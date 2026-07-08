import { describe, expect, test } from "vitest";
import { stripFences, rawPageSchema, parsePageText } from "@/lib/ingest/extract";

describe("stripFences", () => {
  test("unwraps a json code fence", () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
  test("returns bare JSON untouched", () => {
    expect(stripFences('{"a":1}')).toBe('{"a":1}');
  });
});

describe("rawPageSchema", () => {
  test("accepts a well-formed page", () => {
    const page = {
      days: [{
        date: "2026-07-08", theme: "Nat'l Raspberry Day",
        events: [{ time: "9:00", title: "Magnolia Gazette", locationCode: "LR", dimension: "learn" }],
      }],
      warnings: ["could not read the 10:15 entry on July 22"],
    };
    expect(rawPageSchema.parse(page).days[0].events).toHaveLength(1);
  });
  test("rejects a day without a date", () => {
    expect(() => rawPageSchema.parse({ days: [{ theme: null, events: [] }], warnings: [] })).toThrow();
  });
});

describe("parsePageText", () => {
  const page = '{"days":[{"date":"2026-07-08","theme":null,"events":[]}],"warnings":[]}';
  test("parses a complete response", () => {
    expect(parsePageText(page, "end_turn").days).toHaveLength(1);
  });
  test("parses even when wrapped in a fence", () => {
    expect(parsePageText("```json\n" + page + "\n```", "end_turn").days).toHaveLength(1);
  });
  test("truncated output raises a clear error, not a JSON parse crash", () => {
    expect(() => parsePageText('```json\n{"days":[{"da', "max_tokens"))
      .toThrow(/truncated/);
  });
  test("refusal raises a clear error", () => {
    expect(() => parsePageText("", "refusal")).toThrow(/refus/i);
  });
});
