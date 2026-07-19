import type { CSSProperties } from "react";
import type { HeroState } from "@/lib/now";
import type { ActivityEvent } from "@/lib/schema";
import { formatTime } from "@/lib/dates";
import { DIMENSION_META } from "@/lib/dimensions";
import DimensionChip from "@/components/DimensionChip";

/** Soft dimension-tinted wash over the card surface; undefined when unclassified. */
function wash(event: ActivityEvent): CSSProperties | undefined {
  if (!event.dimension) return undefined;
  const tint = DIMENSION_META[event.dimension].bg;
  return { backgroundColor: `color-mix(in srgb, ${tint} 45%, var(--color-card))` };
}

function startsIn(minutesUntil: number, start: string): string {
  if (minutesUntil >= 60) return `At ${formatTime(start)}`;
  return minutesUntil === 1 ? "Starts in 1 minute" : `Starts in ${minutesUntil} minutes`;
}

function timeRange(e: ActivityEvent): string {
  if (!e.start) return "All day";
  return e.end ? `${formatTime(e.start)} – ${formatTime(e.end)}` : formatTime(e.start);
}

export default function HeroCard({
  state,
  tomorrow,
  tomorrowMissing,
}: {
  state: HeroState | null;
  tomorrow: ActivityEvent | null;
  tomorrowMissing: boolean;
}) {
  if (!state) return null;

  if (state.kind === "done") {
    return (
      <section aria-label="Right now" className="rounded-2xl border border-hairline bg-card px-5 py-4 shadow-sm">
        <p className="font-display text-2xl font-semibold">That&apos;s all for today</p>
        {tomorrow?.start ? (
          <p className="mt-1 text-moss">
            Tomorrow: {tomorrow.title}, {formatTime(tomorrow.start)}
          </p>
        ) : tomorrowMissing ? (
          <p className="mt-1 text-moss">Tomorrow&apos;s calendar hasn&apos;t been added yet.</p>
        ) : null}
      </section>
    );
  }

  const e = state.event;
  const label = state.kind === "now" ? "Happening now" : state.first ? "First up today" : "Up next";
  return (
    <section
      aria-label="Right now"
      className="rounded-2xl border border-hairline bg-card px-5 py-4 shadow-md"
      style={wash(e)}
    >
      <p className="text-[13px] font-bold uppercase tracking-wider text-copper">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold leading-snug">{e.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-moss">
        <span className="font-semibold tabular-nums text-copper">
          {state.kind === "now" ? timeRange(e) : startsIn(state.minutesUntil, e.start!)}
        </span>
        {e.location && <span>{e.location}</span>}
        {e.dimension && <DimensionChip dimension={e.dimension} />}
      </div>
      {state.kind === "now" && state.next?.start && (
        <p className="mt-3 border-t border-hairline/70 pt-2 text-moss">
          Up next: {state.next.title} at {formatTime(state.next.start)}
        </p>
      )}
    </section>
  );
}
