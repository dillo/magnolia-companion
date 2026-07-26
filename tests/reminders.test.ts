import { describe, expect, test } from "vitest";
import {
  RENT_REMINDER_LEAD_DAYS,
  medicationRefillReminderFor,
  rentDueStatusLabel,
  rentReminderFor,
} from "@/lib/reminders";

describe("rentReminderFor", () => {
  test("starts three days before the first", () => {
    expect(RENT_REMINDER_LEAD_DAYS).toBe(3);
    expect(rentReminderFor("2026-07-28")).toBeNull();
    expect(rentReminderFor("2026-07-29")).toEqual({
      dueDate: "2026-08-01",
      daysUntilDue: 3,
    });
  });

  test("continues through the first and disappears on the second", () => {
    expect(rentReminderFor("2026-08-01")).toEqual({
      dueDate: "2026-08-01",
      daysUntilDue: 0,
    });
    expect(rentReminderFor("2026-08-02")).toBeNull();
  });

  test("handles short months and year boundaries", () => {
    expect(rentReminderFor("2027-02-26")?.dueDate).toBe("2027-03-01");
    expect(rentReminderFor("2026-12-29")?.dueDate).toBe("2027-01-01");
  });
});

describe("rentDueStatusLabel", () => {
  test("describes the approach to the due date", () => {
    expect(rentDueStatusLabel(3)).toBe("Due in 3 days");
    expect(rentDueStatusLabel(1)).toBe("Due tomorrow");
    expect(rentDueStatusLabel(0)).toBe("Due today");
  });
});

describe("medicationRefillReminderFor", () => {
  test("appears on Saturday and Sunday", () => {
    expect(medicationRefillReminderFor("2026-07-11")).toEqual({ day: "Saturday" });
    expect(medicationRefillReminderFor("2026-07-12")).toEqual({ day: "Sunday" });
  });

  test("is absent before the weekend and clears on Monday", () => {
    expect(medicationRefillReminderFor("2026-07-10")).toBeNull();
    expect(medicationRefillReminderFor("2026-07-13")).toBeNull();
  });
});
