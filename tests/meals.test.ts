import { describe, expect, test } from "vitest";
import { MEALS, mealHours } from "@/components/MealCards";

describe("meal serving hours", () => {
  test("dinner runs from 4:00 PM to 6:30 PM", () => {
    const dinner = MEALS.find((meal) => meal.key === "dinner");

    expect(dinner).toBeDefined();
    expect(dinner).toMatchObject({ start: "16:00", end: "18:30" });
    expect(mealHours(dinner!)).toBe("4:00 PM – 6:30 PM");
  });
});
