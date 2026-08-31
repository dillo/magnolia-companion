import {
  dayNameOfISO,
  longDateOfISO,
  monthNameOfISO,
  shortMonthOfISO,
} from "@/lib/dates";
import { rentDueStatusLabel, type RentReminder } from "@/lib/reminders";

export default function RentPaymentSummary({
  reminder,
  onPaid,
  headingLevel = 2,
  variant = "notification",
}: {
  reminder: RentReminder;
  onPaid?: () => void;
  headingLevel?: 2 | 3;
  variant?: "card" | "notification";
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const isCard = variant === "card";

  return (
    <>
      <div
        aria-hidden="true"
        className={`flex flex-col items-center justify-center bg-copper text-center text-petal ${
          isCard ? "h-12 rounded-md" : "h-16 rounded-lg"
        }`}
      >
        <span className="text-[13px] font-bold uppercase leading-none">
          {shortMonthOfISO(reminder.dueDate)}
        </span>
        <span className={`${isCard ? "mt-0.5 text-xl" : "mt-1 text-2xl"} font-semibold leading-none tabular-nums`}>
          {Number(reminder.dueDate.slice(8))}
        </span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <Heading className={`min-w-0 font-semibold leading-tight text-ink ${isCard ? "font-display text-lg" : ""}`}>
            Rent payment
          </Heading>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-copper px-2 py-0.5 text-[13px] font-bold text-petal">
            {rentDueStatusLabel(reminder.daysUntilDue)}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3">
          <p className="min-w-28 flex-1 leading-snug text-moss">
            {reminder.daysUntilDue >= 0 ? "Due" : "Was due"}{" "}
            {dayNameOfISO(reminder.dueDate)}, {longDateOfISO(reminder.dueDate)}
          </p>
          {onPaid && (
            <button
              type="button"
              aria-label={`Mark ${monthNameOfISO(reminder.dueDate)} rent as paid and hide reminder`}
              onClick={onPaid}
              className="ml-auto inline-flex min-h-11 shrink-0 items-center font-semibold text-copper underline-offset-4 hover:underline"
            >
              I&apos;ve paid
            </button>
          )}
        </div>
      </div>
    </>
  );
}
