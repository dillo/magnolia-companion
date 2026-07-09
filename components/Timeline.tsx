import type { ActivityEvent } from "@/lib/schema";
import { formatTime } from "@/lib/dates";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";

export default function Timeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) return <EmptyState message="No activities listed for this day." />;
  return (
    <div>
      {events.map((e, i) =>
        e.routine ? (
          <div key={i} className="mb-2 flex items-baseline gap-3">
            <span className="w-20 shrink-0 text-right tabular-nums text-moss">
              {e.start ? formatTime(e.start) : "All day"}
            </span>
            <span className="text-moss">{e.title}</span>
          </div>
        ) : (
          <div key={i} className="mb-2.5 flex gap-3">
            <span className="w-20 shrink-0 pt-3 text-right font-semibold tabular-nums text-copper">
              {e.start ? formatTime(e.start) : "All day"}
            </span>
            <div className="flex-1 rounded-xl border border-hairline bg-card px-3.5 py-2.5">
              <div className="text-lg font-semibold leading-snug">{e.title}</div>
              {(e.location || e.dimension) && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-moss">
                  {e.location && <span>{e.location}</span>}
                  {e.dimension && <DimensionChip dimension={e.dimension} />}
                </div>
              )}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
