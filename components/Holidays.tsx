import type { Holiday, HolidayType } from "@/lib/schema";
import {
  dayNameOfISO, daysUntil, longDateOfISO, relativeDayLabel, shortMonthOfISO,
} from "@/lib/dates";

const TYPE_LABELS: Record<HolidayType, string> = {
  federal: "Federal",
  family: "Family",
  jewish: "Jewish",
  christian: "Christian",
};

const TYPE_STYLES: Record<HolidayType, string> = {
  federal: "border-copper/40 bg-copper/10 text-copper",
  family: "border-ink/25 bg-ink/10 text-ink",
  jewish: "border-moss/35 bg-moss/10 text-moss",
  christian: "border-hairline bg-card text-moss",
};

export function HolidayTypePill({ type }: { type: HolidayType }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[13px] font-semibold ${TYPE_STYLES[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  );
}

export function holidayDateLabel(holiday: Holiday): string {
  if (holiday.startDate === holiday.endDate) {
    return `${dayNameOfISO(holiday.startDate)}, ${longDateOfISO(holiday.startDate)}`;
  }
  return `${longDateOfISO(holiday.startDate)} - ${longDateOfISO(holiday.endDate)}`;
}

export function HolidayCard({
  holiday,
  today = null,
  compact = false,
}: {
  holiday: Holiday;
  today?: string | null;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <article className="border-t border-hairline py-3 first:border-t-0 first:pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl font-semibold text-ink">{holiday.title}</h3>
          <HolidayTypePill type={holiday.type} />
        </div>
        <p className="mt-1 font-semibold text-copper">{holidayDateLabel(holiday)}</p>
        {holiday.timing && <p className="mt-1 text-moss">{holiday.timing}</p>}
        <p className="mt-2 leading-snug text-moss">{holiday.note}</p>
      </article>
    );
  }

  const inDays = today ? daysUntil(today, holiday.startDate) : null;
  const ongoing = inDays !== null && inDays < 0; // multi-day holiday already underway
  const soon = inDays !== null && inDays <= 30;
  return (
    <article className="rounded-xl border border-hairline bg-card px-4 py-3 shadow-sm">
      <div className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-3">
        <div
          className={`flex h-16 flex-col items-center justify-center rounded-lg text-center ${
            soon ? "bg-copper text-petal" : "border border-hairline bg-sand text-moss"
          }`}
        >
          <span className="text-[13px] font-bold uppercase leading-none">{shortMonthOfISO(holiday.startDate)}</span>
          <span className="mt-1 text-2xl font-semibold leading-none tabular-nums">{Number(holiday.startDate.slice(8))}</span>
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold leading-snug text-ink">{holiday.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <HolidayTypePill type={holiday.type} />
            {inDays !== null && (
              <span
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[13px] font-bold ${
                  soon ? "bg-copper text-petal" : "bg-hairline/60 text-moss"
                }`}
              >
                {ongoing ? "Ongoing" : relativeDayLabel(inDays)}
              </span>
            )}
          </div>
          <p className="mt-1 font-semibold text-copper">{holidayDateLabel(holiday)}</p>
          {holiday.timing && <p className="mt-1 text-moss">{holiday.timing}</p>}
          <p className="mt-2 leading-snug text-moss">{holiday.note}</p>
        </div>
      </div>
    </article>
  );
}
