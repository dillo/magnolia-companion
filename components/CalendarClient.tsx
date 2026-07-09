"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActivityMonth } from "@/lib/schema";
import { DIMENSIONS, type Dimension } from "@/lib/schema";
import { DIMENSION_META } from "@/lib/dimensions";
import { todayISO, formatTime, dayNameOfISO, longDateOfISO } from "@/lib/dates";
import Timeline from "@/components/Timeline";
import EmptyState from "@/components/EmptyState";
import ScanLightbox from "@/components/ScanLightbox";

const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarClient({ months }: { months: ActivityMonth[] }) {
  const [today, setToday] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [filter, setFilter] = useState<Dimension | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = todayISO();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- today must come from the browser clock after mount (static site)
    setToday(t);
    const i = months.findIndex((m) => m.month === t.slice(0, 7));
    setIdx(i >= 0 ? i : Math.max(0, months.length - 1));
  }, [months]);

  const closeDayDetails = useCallback(() => {
    setSelected(null);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }, []);

  useEffect(() => {
    if (!selected || !window.matchMedia("(min-width: 768px)").matches) return;
    closeButtonRef.current?.focus();
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDayDetails();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDayDetails, selected]);

  if (!today) return null;
  if (months.length === 0) return <EmptyState message="No activity calendars have been added yet." />;

  const month = months[idx];
  const [y, mo] = month.month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
  const byDate = new Map(month.days.map((d) => [d.date, d]));
  const dateOf = (n: number) => `${month.month}-${String(n).padStart(2, "0")}`;
  const monthTitle = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: "long", year: "numeric",
  }).format(new Date(Date.UTC(y, mo - 1, 1)));
  const selDay = selected ? byDate.get(selected) ?? null : null;

  function moveMonth(delta: number) {
    setIdx((i) => Math.min(months.length - 1, Math.max(0, i + delta)));
    setSelected(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">{monthTitle}</h1>
        <div className="flex gap-2">
          <button aria-label="Previous month" disabled={idx === 0} onClick={() => moveMonth(-1)}
            className="rounded-full border border-hairline px-4 py-1.5 font-bold text-copper disabled:opacity-30">‹</button>
          <button aria-label="Next month" disabled={idx === months.length - 1} onClick={() => moveMonth(1)}
            className="rounded-full border border-hairline px-4 py-1.5 font-bold text-copper disabled:opacity-30">›</button>
        </div>
      </div>

      <div className="my-3 flex flex-wrap gap-2">
        {(["all", ...DIMENSIONS] as const).map((d) => (
          <button key={d} aria-pressed={filter === d}
            onClick={() => setFilter(d)}
            className={`rounded-full border px-3.5 py-1.5 font-semibold ${
              filter === d ? "border-ink bg-ink text-petal" : "border-hairline bg-card text-moss"
            }`}>
            {d === "all" ? "All" : DIMENSION_META[d].label}
          </button>
        ))}
      </div>

      {/* Month grid: tablet & desktop */}
      <div className="hidden grid-cols-7 gap-1 md:grid" role="grid" aria-label={monthTitle}>
        {DOWS.map((d) => (
          <div key={d} className="py-1 text-center text-[13px] font-bold uppercase tracking-wider text-moss">{d}</div>
        ))}
        {Array.from({ length: firstDow }, (_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = dateOf(i + 1);
          const day = byDate.get(date);
          const specials = day?.events.filter((e) => !e.routine) ?? [];
          return (
            <button key={date} onClick={() => setSelected(date)}
              className={`min-h-24 rounded-lg border bg-card p-1.5 text-left align-top text-[13px] ${
                date === today ? "border-2 border-copper" : "border-hairline"
              }`}>
              <div className={`font-semibold tabular-nums ${date === today ? "text-copper" : "text-moss"}`}>{i + 1}</div>
              {day?.theme && (
                <div className="truncate font-display italic text-copper">{day.theme}</div>
              )}
              {specials.slice(0, 3).map((e, j) => {
                const filtered = filter !== "all";
                const dim = filtered && e.dimension !== filter;
                const highlighted = filtered && e.dimension === filter;
                return (
                  <div key={j} className={`flex items-center gap-1 truncate ${
                    dim ? "opacity-20" : highlighted ? "font-semibold text-ink" : ""
                  }`}>
                    {e.dimension && (
                      <span className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: DIMENSION_META[e.dimension].dot }} />
                    )}
                    <span className="truncate">{e.title}</span>
                  </div>
                );
              })}
              {specials.length > 3 && <div className="text-moss">+{specials.length - 3} more</div>}
            </button>
          );
        })}
      </div>
      <section aria-label="Activity dimension legend" className="mt-4 hidden border-y border-hairline py-3 md:block">
        <h2 className="mb-2 font-semibold">Activity dot colors</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[15px] text-moss">
          {DIMENSIONS.map((d) => (
            <div key={d} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: DIMENSION_META[d].dot }} />
              <span>{DIMENSION_META[d].label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Agenda list: phones */}
      <div className="divide-y divide-hairline border-y border-hairline md:hidden">
        {month.days.map((day) => {
          const specials = day.events.filter(
            (e) => !e.routine && (filter === "all" || e.dimension === filter),
          );
          if (specials.length === 0) return null;
          return (
            <button key={day.date} onClick={() => setSelected(day.date)} className="block w-full py-3 text-left">
              <div className="font-semibold">
                {dayNameOfISO(day.date).slice(0, 3)} {Number(day.date.slice(8))}
                {day.date === today && <span className="font-normal text-moss"> · Today</span>}
              </div>
              {day.theme && <div className="font-display text-[15px] italic text-copper">{day.theme}</div>}
              {specials.map((e, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="w-20 shrink-0 text-right font-semibold tabular-nums text-copper">
                    {e.start ? formatTime(e.start) : "All day"}
                  </span>
                  <span>{e.title}</span>
                </div>
              ))}
            </button>
          );
        })}
      </div>

      {/* Day detail */}
      {selDay && (
        <section aria-label="Day detail" className="mt-5 rounded-xl border border-hairline bg-petal p-4 md:hidden">
          <h2 className="font-display text-2xl font-semibold">
            {dayNameOfISO(selDay.date)}, {longDateOfISO(selDay.date)}
          </h2>
          {selDay.theme && <p className="mb-3 font-display italic text-copper">{selDay.theme}</p>}
          <Timeline events={selDay.events} />
        </section>
      )}

      {selDay && (
        <div role="dialog" aria-modal="true" aria-labelledby="calendar-day-title"
          className="fixed inset-0 z-50 hidden items-center justify-center bg-ink/55 p-6 md:flex"
          onClick={closeDayDetails}>
          <section className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-lg bg-petal p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h2 id="calendar-day-title" className="font-display text-3xl font-semibold">
                  {dayNameOfISO(selDay.date)}, {longDateOfISO(selDay.date)}
                </h2>
                {selDay.theme && <p className="font-display italic text-copper">{selDay.theme}</p>}
              </div>
              <button ref={closeButtonRef} type="button" aria-label="Close day details" onClick={closeDayDetails}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-card text-copper hover:bg-hairline">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
                </svg>
              </button>
            </div>
            <Timeline events={selDay.events} />
          </section>
        </div>
      )}

      <ScanLightbox scans={month.sourceScans} label="View this month's printed pages" />
    </div>
  );
}
