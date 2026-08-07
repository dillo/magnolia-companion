import { addDaysISO, dayNameOfISO, daysUntil } from "./dates";

export const RENT_REMINDER_LEAD_DAYS = 3;
export const RENT_GRACE_DAYS = 4;

export type RentReminder = {
  dueDate: string;
  daysUntilDue: number;
  graceEndsDate: string;
  lateFeeDate: string;
  daysUntilLateFee: number;
};

export type MedicationRefillReminder = {
  day: "Saturday" | "Sunday";
};

function firstOfNextMonthISO(date: string): string {
  const year = Number(date.slice(0, 4));
  const monthIndex = Number(date.slice(5, 7)) - 1;
  return new Date(Date.UTC(year, monthIndex + 1, 1, 12)).toISOString().slice(0, 10);
}

/**
 * Rent reminders run from three days before the first through the fifth.
 * The sixth, when the printed $250 late fee begins, is the first date outside
 * the reminder window.
 */
export function rentReminderFor(date: string): RentReminder | null {
  const currentMonthDueDate = `${date.slice(0, 7)}-01`;
  const nextMonthDueDate = firstOfNextMonthISO(date);

  for (const dueDate of [currentMonthDueDate, nextMonthDueDate]) {
    const startsOn = addDaysISO(dueDate, -RENT_REMINDER_LEAD_DAYS);
    const graceEndsDate = addDaysISO(dueDate, RENT_GRACE_DAYS);
    if (date >= startsOn && date <= graceEndsDate) {
      const lateFeeDate = addDaysISO(dueDate, RENT_GRACE_DAYS + 1);
      return {
        dueDate,
        daysUntilDue: daysUntil(date, dueDate),
        graceEndsDate,
        lateFeeDate,
        daysUntilLateFee: daysUntil(date, lateFeeDate),
      };
    }
  }

  return null;
}

export function rentDueStatusLabel(daysUntilDue: number): string {
  if (daysUntilDue > 1) return `Due in ${daysUntilDue} days`;
  if (daysUntilDue === 1) return "Due tomorrow";
  if (daysUntilDue === 0) return "Due today";
  if (daysUntilDue === -RENT_GRACE_DAYS) return "Fee starts tomorrow";
  if (daysUntilDue < 0) return "Grace period";
  return "Payment due";
}

/** Visible throughout the weekend, then clears when the local date becomes Monday. */
export function medicationRefillReminderFor(date: string): MedicationRefillReminder | null {
  const day = dayNameOfISO(date);
  if (day !== "Saturday" && day !== "Sunday") return null;
  return { day };
}
