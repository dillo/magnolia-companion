"use client";

import { useEffect, useState } from "react";
import type { MenuWeek } from "@/lib/schema";
import { todayISO, mondayOfISO, addDaysISO, dayNameOfISO, longDateOfISO } from "@/lib/dates";
import MealCards from "@/components/MealCards";
import EmptyState from "@/components/EmptyState";
import ScanLightbox from "@/components/ScanLightbox";

export default function MenuClient({ weeks }: { weeks: MenuWeek[] }) {
  const [today, setToday] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    const t = todayISO();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- today must come from the browser clock after mount (static site)
    setToday(t);
    const i = weeks.findIndex((w) => w.weekOf === mondayOfISO(t));
    setIdx(i >= 0 ? i : Math.max(0, weeks.length - 1));
    setDate(t);
  }, [weeks]);

  if (!today || !date) return null;
  if (weeks.length === 0) return <EmptyState message="No menus have been added yet." />;

  const week = weeks[idx];
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(week.weekOf, i));
  const activeDate = weekDates.includes(date) ? date : week.weekOf;
  const day = week.days.find((d) => d.date === activeDate) ?? null;

  function moveWeek(delta: number) {
    const next = Math.min(weeks.length - 1, Math.max(0, idx + delta));
    setIdx(next);
    setDate(weeks[next].weekOf);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between">
        <button disabled={idx === 0} onClick={() => moveWeek(-1)}
          className="font-bold text-copper disabled:opacity-30">‹ Last week</button>
        <h1 className="font-display text-xl font-semibold">Week of {longDateOfISO(week.weekOf)}</h1>
        <button disabled={idx === weeks.length - 1} onClick={() => moveWeek(1)}
          className="font-bold text-copper disabled:opacity-30">Next ›</button>
      </div>

      <div role="tablist" aria-label="Day of week" className="my-4 flex gap-1">
        {weekDates.map((d) => (
          <button key={d} role="tab" aria-selected={activeDate === d} onClick={() => setDate(d)}
            className={`flex-1 rounded-lg py-1.5 text-center ${
              activeDate === d ? "bg-copper text-petal" : "text-moss"
            }`}>
            <span className="block text-[13px] font-bold">{dayNameOfISO(d).slice(0, 3)}</span>
            <span className="block font-semibold tabular-nums">{Number(d.slice(8))}</span>
          </button>
        ))}
      </div>

      <MealCards day={day} />

      {week.alwaysAvailable.length > 0 && (
        <p className="mt-4 text-[15px] text-moss">
          <b className="text-ink">Always available:</b> {week.alwaysAvailable.join(" · ")}
        </p>
      )}

      <ScanLightbox scans={week.sourceScan ? [week.sourceScan] : []} label="View the printed menu" />
    </div>
  );
}
