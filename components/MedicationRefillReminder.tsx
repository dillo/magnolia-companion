import { medicationRefillReminderFor } from "@/lib/reminders";

export default function MedicationRefillReminder({ date }: { date: string }) {
  const reminder = medicationRefillReminderFor(date);
  if (!reminder) return null;

  return (
    <section
      aria-label="Medication refill reminder"
      className="mb-4 grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2.5 rounded-xl border border-copper/30 bg-copper/10 px-3 py-1.5 shadow-sm"
    >
      <div
        aria-hidden="true"
        className="grid h-9 place-items-center rounded-md bg-copper text-petal"
      >
        <MedicationRefillIcon />
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold leading-tight text-ink">
          Refill pill box
        </h2>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-copper px-2 py-0.5 text-[12px] font-bold text-petal">
          Weekend task
        </span>
      </div>
    </section>
  );
}

function MedicationRefillIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5">
      <rect
        x="3"
        y="5"
        width="18"
        height="15"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M3 10h18M9 10v10M15 10v10" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="7.5" r="1" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
      <circle cx="18" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}
