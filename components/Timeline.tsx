import type { ActivityEvent } from "@/lib/schema";
import { formatTime } from "@/lib/dates";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";

export default function Timeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) return <EmptyState message="No activities listed for this day." />;
  return (
    <div className="divide-y divide-hairline border-y border-hairline">
      {events.map((e, i) =>
        e.routine ? (
          <section key={i} className="flex items-baseline gap-3 px-0 py-2">
            <span className="w-18 shrink-0 text-right tabular-nums text-moss sm:w-20">
              {e.start ? formatTime(e.start) : "All day"}
            </span>
            <span className="text-moss">{e.title}</span>
          </section>
        ) : (
          <section key={i} className="flex gap-3 px-0 py-3">
            <span className="w-18 shrink-0 text-right font-semibold tabular-nums text-copper sm:w-20">
              {e.start ? formatTime(e.start) : "All day"}
            </span>
            <div className="flex-1">
              <div className="text-lg font-semibold leading-snug">{e.title}</div>
              {(e.location || e.dimension) && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-moss">
                  {e.location && <span>{e.location}</span>}
                  {e.dimension && <DimensionChip dimension={e.dimension} />}
                </div>
              )}
            </div>
          </section>
        ),
      )}
    </div>
  );
}
