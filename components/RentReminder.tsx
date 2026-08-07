"use client";

import Link from "next/link";
import { dayNameOfISO, longDateOfISO, monthDayOfISO, monthNameOfISO, shortMonthOfISO } from "@/lib/dates";
import { rentDueStatusLabel } from "@/lib/reminders";
import { useRentReminder } from "@/components/useRentReminder";

export default function RentReminder({ date }: { date: string }) {
  const { reminder, acknowledge } = useRentReminder(date);
  if (!reminder) return null;

  const dueDateText = `${dayNameOfISO(reminder.dueDate)}, ${longDateOfISO(reminder.dueDate)}`;

  return (
    <section
      aria-label="Rent payment reminder"
      className="mb-4 grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-copper/40 bg-copper/15 px-3 py-2.5 shadow-md"
    >
      <div className="flex h-12 flex-col items-center justify-center rounded-md bg-copper text-center text-petal">
        <span className="text-sm font-bold uppercase leading-none">
          {shortMonthOfISO(reminder.dueDate)}
        </span>
        <span className="mt-0.5 text-xl font-semibold leading-none tabular-nums">1</span>
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-lg font-semibold leading-tight text-ink">
            Rent payment
          </h2>
          <span className="shrink-0 rounded-full bg-copper px-2 py-0.5 text-sm font-bold leading-tight text-petal">
            {rentDueStatusLabel(reminder.daysUntilDue)}
          </span>
        </div>
        <p className="mt-0.5 leading-snug text-moss">
          {reminder.daysUntilDue >= 0 ? "Rent is due" : "Rent was due"} {dueDateText}.
        </p>
        <p className="mt-0.5 leading-snug text-moss">
          No late fee through {monthDayOfISO(reminder.graceEndsDate)}. The $250 fee begins {monthDayOfISO(reminder.lateFeeDate)}.
        </p>
        <p className="mt-0.5 leading-snug text-moss">If you&apos;ve already paid, no action is needed.</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href="/faq#services-and-fees"
            className="inline-flex min-h-11 items-center font-semibold text-copper underline-offset-4 hover:underline"
          >
            Billing details
          </Link>
          <button
            type="button"
            onClick={acknowledge}
            className="min-h-11 font-semibold text-copper underline-offset-4 hover:underline"
          >
            Already paid? Hide for {monthNameOfISO(reminder.dueDate)}
          </button>
        </div>
      </div>
    </section>
  );
}
