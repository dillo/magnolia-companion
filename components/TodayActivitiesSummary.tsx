import Link from "next/link";
import type { ActivityDay } from "@/lib/schema";
import { dayNameOfISO, formatTime, longDateOfISO } from "@/lib/dates";

export default function TodayActivitiesSummary({ day, today }: { day: ActivityDay | null; today: string }) {
  const specials = day?.events.filter((event) => !event.routine).slice(0, 4) ?? [];
  const routineCount = day ? day.events.filter((event) => event.routine).length : 0;

  return (
    <aside className="pt-1 text-moss lg:sticky lg:top-6 lg:border-l lg:border-hairline lg:pl-6 lg:pt-0">
      <div className="mb-3">
        <h2 className="font-display text-xl font-semibold text-ink">Today&apos;s Activities</h2>
        <p className="mt-1 text-moss">
          {dayNameOfISO(today)}, {longDateOfISO(today)}
        </p>
      </div>

      {!day ? (
        <p>{today.slice(0, 7)}&apos;s calendar hasn&apos;t been added yet.</p>
      ) : specials.length === 0 ? (
        <p>No special activities listed for today.</p>
      ) : (
        <div className="space-y-3">
          {specials.map((event, index) => (
            <section key={index}>
              <div className="font-semibold tabular-nums text-copper">
                {event.start ? formatTime(event.start) : "All day"}
              </div>
              <div className="font-semibold leading-snug text-ink">{event.title}</div>
              {event.location && <div>{event.location}</div>}
            </section>
          ))}
          {routineCount > 0 && (
            <p>+ {routineCount} daily routine items</p>
          )}
        </div>
      )}

      <Link href="/" className="mt-4 inline-block font-semibold text-copper underline-offset-4 hover:underline">
        All activities
      </Link>
    </aside>
  );
}
