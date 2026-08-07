import { describe, expect, test } from "vitest";
import { loadMedications } from "@/lib/content";
import { medicationsSchema } from "@/lib/schema";

describe("medications", () => {
  test("loads and validates the committed medication directory", () => {
    const directory = loadMedications();
    expect(directory.medications).toHaveLength(10);

    const levothyroxine = directory.medications.find((medication) => medication.id === "levothyroxine");
    expect(levothyroxine?.doses).toEqual([
      {
        period: "morning",
        amount: "112 mcg",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      },
      {
        period: "morning",
        amount: "125 mcg",
        days: ["saturday", "sunday"],
      },
    ]);

    const ciprofloxacin = directory.medications.find((medication) => medication.id === "ciprofloxacin");
    expect(ciprofloxacin?.doses[0].days).toEqual(["monday", "wednesday", "friday"]);
  });

  test("rejects overlapping doses in the same period", () => {
    expect(() => medicationsSchema.parse({
      medications: [
        {
          id: "example",
          name: "Example",
          purpose: "Test",
          doses: [
            { period: "morning", amount: "10 mg", days: ["monday", "tuesday"] },
            { period: "morning", amount: "20 mg", days: ["tuesday", "wednesday"] },
          ],
        },
      ],
    })).toThrow(/overlapping morning doses on tuesday/);
  });

  test("rejects duplicate medication ids", () => {
    const medication = {
      id: "same",
      name: "Example",
      purpose: "Test",
      doses: [{ period: "morning", amount: "10 mg", days: ["monday"] }],
    };
    expect(() => medicationsSchema.parse({ medications: [medication, medication] }))
      .toThrow(/duplicate medication id same/);
  });
});
