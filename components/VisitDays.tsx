import Link from "next/link";
import type { VisitDay, VisitDayType } from "@/lib/schema";
import { dayNameOfISO, longDateOfISO } from "@/lib/dates";

const TYPE_LABELS: Record<VisitDayType, string> = {
  federal: "Federal",
  family: "Family",
  jewish: "Jewish",
  christian: "Christian",
};

const TYPE_STYLES: Record<VisitDayType, string> = {
  federal: "border-copper/40 bg-copper/10 text-copper",
  family: "border-ink/25 bg-ink/10 text-ink",
  jewish: "border-moss/35 bg-moss/10 text-moss",
  christian: "border-hairline bg-card text-moss",
};

export function VisitTypePill({ type }: { type: VisitDayType }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[13px] font-semibold ${TYPE_STYLES[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  );
}

export function visitDateLabel(day: VisitDay): string {
  if (day.startDate === day.endDate) {
    return `${dayNameOfISO(day.startDate)}, ${longDateOfISO(day.startDate)}`;
  }
  return `${longDateOfISO(day.startDate)} - ${longDateOfISO(day.endDate)}`;
}

export function VisitDayCard({ day, compact = false }: { day: VisitDay; compact?: boolean }) {
  return (
    <article className={compact ? "border-t border-hairline py-3 first:border-t-0 first:pt-0" : "py-4"}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-xl font-semibold text-ink">{day.title}</h3>
        <VisitTypePill type={day.type} />
      </div>
      <p className="mt-1 font-semibold text-copper">{visitDateLabel(day)}</p>
      {day.timing && <p className="mt-1 text-moss">{day.timing}</p>}
      <p className="mt-2 leading-snug text-moss">{day.note}</p>
    </article>
  );
}

export function VisitDaysSummary({ days }: { days: VisitDay[] }) {
  return (
    <section className="border-t border-hairline pt-5">
      <div className="mb-3">
        <h2 className="font-display text-xl font-semibold text-ink">Upcoming Holidays</h2>
        <p className="mt-1 text-moss">Upcoming holidays families may want to plan around.</p>
      </div>
      {days.length === 0 ? (
        <p className="text-moss">No holidays have been added yet.</p>
      ) : (
        <div>
          {days.map((day) => <VisitDayCard key={`${day.startDate}-${day.title}`} day={day} compact />)}
        </div>
      )}
      <Link href="/visits" className="mt-4 inline-block font-semibold text-copper underline-offset-4 hover:underline">
        All holidays
      </Link>
    </section>
  );
}
