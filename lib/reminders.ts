import { addDaysISO, dayNameOfISO, daysUntil } from "./dates";

export const RENT_REMINDER_LEAD_DAYS = 3;

export type RentReminder = {
  dueDate: string;
  daysUntilDue: number;
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
 * Rent reminders run from three days before the first through the due date.
 * The second is the first date outside the reminder window.
 */
export function rentReminderFor(date: string): RentReminder | null {
  const currentMonthDueDate = `${date.slice(0, 7)}-01`;
  const nextMonthDueDate = firstOfNextMonthISO(date);

  for (const dueDate of [currentMonthDueDate, nextMonthDueDate]) {
    const startsOn = addDaysISO(dueDate, -RENT_REMINDER_LEAD_DAYS);
    const lastVisibleDate = dueDate;
    if (date >= startsOn && date <= lastVisibleDate) {
      return { dueDate, daysUntilDue: daysUntil(date, dueDate) };
    }
  }

  return null;
}

export function rentDueStatusLabel(daysUntilDue: number): string {
  if (daysUntilDue > 1) return `Due in ${daysUntilDue} days`;
  if (daysUntilDue === 1) return "Due tomorrow";
  if (daysUntilDue === 0) return "Due today";
  return "Payment due";
}

/** Visible throughout the weekend, then clears when the local date becomes Monday. */
export function medicationRefillReminderFor(date: string): MedicationRefillReminder | null {
  const day = dayNameOfISO(date);
  if (day !== "Saturday" && day !== "Sunday") return null;
  return { day };
}
