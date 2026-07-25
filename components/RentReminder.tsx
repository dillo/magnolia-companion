import { dayNameOfISO, longDateOfISO, shortMonthOfISO } from "@/lib/dates";
import { rentDueStatusLabel, rentReminderFor } from "@/lib/reminders";

export default function RentReminder({ date }: { date: string }) {
  const reminder = rentReminderFor(date);
  if (!reminder) return null;

  const dueDateText = `${dayNameOfISO(reminder.dueDate)}, ${longDateOfISO(reminder.dueDate)}`;

  return (
    <section
      aria-label="Rent payment reminder"
      className="mb-4 grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-copper/30 bg-copper/10 px-3 py-2.5 shadow-sm"
    >
      <div className="flex h-12 flex-col items-center justify-center rounded-md bg-copper text-center text-petal">
        <span className="text-[11px] font-bold uppercase leading-none">
          {shortMonthOfISO(reminder.dueDate)}
        </span>
        <span className="mt-0.5 text-xl font-semibold leading-none tabular-nums">1</span>
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-lg font-semibold leading-tight text-ink">
            Rent payment
          </h2>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-copper px-2 py-0.5 text-[12px] font-bold text-petal">
            {rentDueStatusLabel(reminder.daysUntilDue)}
          </span>
        </div>
        <p className="mt-0.5 text-[15px] leading-snug text-moss">
          {reminder.daysUntilDue >= 0 ? "Rent is due" : "Rent was due"} {dueDateText}.
        </p>
      </div>
    </section>
  );
}
