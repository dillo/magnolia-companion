"use client";

import { Fragment } from "react";
import { motion, useReducedMotionConfig } from "framer-motion";
import type { ActivityEvent } from "@/lib/schema";
import { formatTime } from "@/lib/dates";
import { timelineStatuses, type TimelineStatus } from "@/lib/now";
import { DIMENSION_META } from "@/lib/dimensions";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";

export default function Timeline({ events, now = null }: { events: ActivityEvent[]; now?: string | null }) {
  const reduced = useReducedMotionConfig();
  if (events.length === 0) return <EmptyState message="No activities listed for this day." />;

  const statuses: TimelineStatus[] = now
    ? timelineStatuses(events, now)
    : events.map(() => "upcoming");
  const markerIndex = now ? statuses.findIndex((s) => s === "current" || s === "upcoming") : -1;

  return (
    <div className="relative ml-1.5 border-l border-hairline py-1 pl-5">
      {events.map((e, i) => (
        <Fragment key={i}>
          {i === markerIndex && <NowMarker now={now!} />}
          <TimelineRow
            event={e}
            index={i}
            past={now !== null && statuses[i] === "past"}
            reduced={!!reduced}
            elevated={i === markerIndex}
          />
        </Fragment>
      ))}
    </div>
  );
}

function NowMarker({ now }: { now: string }) {
  return (
    <div aria-hidden="true" className="relative my-1.5 flex items-center gap-2">
      <span className="absolute -left-[1.45rem] h-2 w-2 rounded-full bg-copper" />
      <span className="h-px flex-1 bg-copper/60" />
      <span className="text-[13px] font-bold uppercase tracking-wider text-copper">
        Now · {formatTime(now)}
      </span>
    </div>
  );
}

function TimelineRow({
  event: e,
  index,
  past,
  reduced,
  elevated,
}: {
  event: ActivityEvent;
  index: number;
  past: boolean;
  reduced: boolean;
  elevated: boolean;
}) {
  const time = (
    <span
      className={`w-18 shrink-0 pt-0.5 text-right tabular-nums sm:w-20 ${
        e.routine ? "text-moss" : `font-semibold ${past ? "text-moss" : "text-copper"}`
      }`}
    >
      {e.start ? formatTime(e.start) : "All day"}
    </span>
  );

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: past && e.routine ? 0.9 : 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
      className="relative py-1.5"
    >
      <span
        aria-hidden="true"
        className={`absolute -left-[1.44rem] top-[0.95rem] h-2.5 w-2.5 rounded-full border-2 border-petal ${
          e.routine ? "bg-hairline" : past ? "bg-copper/40" : "bg-copper"
        }`}
      />
      {e.routine ? (
        <div className="flex items-baseline gap-3 py-0.5">
          {time}
          <span className="text-moss">{e.title}</span>
        </div>
      ) : (
        <div className="flex gap-3">
          {time}
          <div
            className={`min-w-0 flex-1 rounded-xl border border-hairline bg-card px-4 py-3 ${
              past ? "" : elevated ? "shadow-md" : "shadow-sm"
            }`}
            style={
              e.dimension
                ? { borderLeft: `3px solid ${DIMENSION_META[e.dimension].dot}` }
                : undefined
            }
          >
            <div className="text-lg font-semibold leading-snug">{e.title}</div>
            {(e.location || e.dimension) && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-moss">
                {e.location && <span>{e.location}</span>}
                {e.dimension && <DimensionChip dimension={e.dimension} />}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
