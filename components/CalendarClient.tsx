"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActivityMonth, VisitDay } from "@/lib/schema";
import { DIMENSIONS, type Dimension } from "@/lib/schema";
import { DIMENSION_META } from "@/lib/dimensions";
import { formatTime, dayNameOfISO, longDateOfISO } from "@/lib/dates";
import { visitDaysInRange } from "@/lib/lookup";
import Breadcrumbs from "@/components/Breadcrumbs";
import Timeline from "@/components/Timeline";
import EmptyState from "@/components/EmptyState";
import ScanLightbox from "@/components/ScanLightbox";
import { useToday } from "@/components/useToday";
import { VisitDayCard } from "@/components/VisitDays";

const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ordinalDay(iso: string): string {
  const day = Number(iso.slice(8));
  const mod100 = day % 100;
  const suffix = mod100 >= 11 && mod100 <= 13
    ? "th"
    : day % 10 === 1
      ? "st"
      : day % 10 === 2
        ? "nd"
        : day % 10 === 3
          ? "rd"
          : "th";
  return `${day}${suffix}`;
}

function ActivityFilterSelect({
  value,
  onChange,
}: {
  value: Dimension | "all";
  onChange: (value: Dimension | "all") => void;
}) {
  return (
    <div className="max-w-sm md:flex md:max-w-none md:items-center md:gap-3">
      <label htmlFor="calendar-filter" className="sr-only">
        Activity type
      </label>
      <div className="relative min-w-0 flex-1">
        <select
          id="calendar-filter"
          value={value}
          onChange={(event) => onChange(event.target.value as Dimension | "all")}
          className="w-full appearance-none rounded-lg border border-hairline bg-card px-4 py-3 pr-11 font-semibold text-ink shadow-sm"
        >
          <option value="all">All activities</option>
          {DIMENSIONS.map((d) => (
            <option key={d} value={d}>{DIMENSION_META[d].label}</option>
          ))}
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24"
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-copper">
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        </svg>
      </div>
    </div>
  );
}

export default function CalendarClient({ months, visitDays }: { months: ActivityMonth[]; visitDays: VisitDay[] }) {
  const today = useToday();
  const [idx, setIdx] = useState(0);
  const [filter, setFilter] = useState<Dimension | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!today) return;
    const i = months.findIndex((m) => m.month === today.slice(0, 7));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- today must come from the browser clock after mount (static site)
    setIdx(i >= 0 ? i : Math.max(0, months.length - 1));
  }, [months, today]);

  const closeDayDetails = useCallback(() => {
    setSelected(null);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }, []);

  useEffect(() => {
    if (!selected) return;
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
  const monthStart = dateOf(1);
  const monthEnd = dateOf(daysInMonth);
  const monthVisitDays = visitDaysInRange(visitDays, monthStart, monthEnd);
  const monthTitle = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: "long", year: "numeric",
  }).format(new Date(Date.UTC(y, mo - 1, 1)));
  const selDay = selected ? byDate.get(selected) ?? null : null;
  const selectedVisitDays = selected
    ? visitDaysInRange(visitDays, selected, selected)
    : [];

  function moveMonth(delta: number) {
    setIdx((i) => Math.min(months.length - 1, Math.max(0, i + delta)));
    setSelected(null);
  }

  return (
    <div>
      <Breadcrumbs />
      <div className="md:flex md:items-start md:justify-between md:gap-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-semibold">{monthTitle}</h1>
          <div className="flex gap-2 md:ml-4">
            <button aria-label="Previous month" disabled={idx === 0} onClick={() => moveMonth(-1)}
              className="rounded-full border border-hairline px-4 py-1.5 font-bold text-copper disabled:opacity-30">‹</button>
            <button aria-label="Next month" disabled={idx === months.length - 1} onClick={() => moveMonth(1)}
              className="rounded-full border border-hairline px-4 py-1.5 font-bold text-copper disabled:opacity-30">›</button>
          </div>
        </div>
        <div className="my-4 md:my-0 md:w-[22rem]">
          <ActivityFilterSelect value={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Month grid: tablet & desktop */}
      <div className="hidden grid-cols-7 gap-1 md:mt-6 md:grid" role="grid" aria-label={monthTitle}>
        {DOWS.map((d) => (
          <div key={d} className="py-1 text-center text-[13px] font-bold uppercase tracking-wider text-moss">{d}</div>
        ))}
        {Array.from({ length: firstDow }, (_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = dateOf(i + 1);
          const day = byDate.get(date);
          const specials = day?.events.filter((e) => !e.routine) ?? [];
          const visits = monthVisitDays.filter((visit) => visit.startDate <= date && visit.endDate >= date);
          const isToday = date === today;
          return (
            <button key={date} onClick={() => setSelected(date)}
              className={`min-h-24 rounded-lg border p-1.5 text-left align-top text-[13px] ${
                isToday ? "border-2 border-copper bg-copper/10" : "border-hairline bg-card"
              }`}>
              <div className={`font-semibold tabular-nums ${isToday ? "text-copper" : "text-moss"}`}>{i + 1}</div>
              {day?.theme && (
                <div className="truncate font-display italic text-copper">{day.theme}</div>
              )}
              {visits.slice(0, 2).map((visit) => (
                <div key={visit.title} className="mb-1 truncate rounded-full border border-copper/30 bg-copper/10 px-2 py-0.5 font-semibold text-copper">
                  {visit.title}
                </div>
              ))}
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
          const visits = monthVisitDays.filter((visit) => visit.startDate <= day.date && visit.endDate >= day.date);
          if (specials.length === 0 && visits.length === 0) return null;
          const isToday = day.date === today;
          return (
            <div key={day.date}
              className={`px-3 py-3 ${
                isToday ? "rounded-lg border border-copper bg-copper/10" : ""
              }`}>
              <div className="mb-1 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {dayNameOfISO(day.date).slice(0, 3)} {ordinalDay(day.date)}
                    {isToday && <span className="font-normal text-moss"> · Today</span>}
                  </div>
                  {day.theme && <div className="font-display text-[15px] italic text-copper">{day.theme}</div>}
                  {visits.map((visit) => (
                    <div key={visit.title} className="mt-1 font-semibold text-copper">{visit.title}</div>
                  ))}
                </div>
                <button type="button" onClick={() => setSelected(day.date)}
                  aria-label={`Show details for ${dayNameOfISO(day.date)}, ${longDateOfISO(day.date)}`}
                  className="shrink-0 font-semibold text-copper underline-offset-4 hover:underline">
                  <span>Details</span>
                </button>
              </div>
              {specials.map((e, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="w-20 shrink-0 text-right font-semibold tabular-nums text-copper">
                    {e.start ? formatTime(e.start) : "All day"}
                  </span>
                  <span>{e.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {monthVisitDays.length > 0 && (
        <section className="mt-4 border-y border-hairline py-3">
          <h2 className="mb-2 font-semibold">Family visit days this month</h2>
          <div className="flex flex-wrap gap-2 text-[15px]">
            {monthVisitDays.map((day) => (
              <button key={`${day.startDate}-${day.title}`} type="button" onClick={() => setSelected(day.startDate)}
                className="rounded-full border border-hairline bg-card px-3 py-1 text-left font-semibold text-copper">
                {day.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {(selDay || selectedVisitDays.length > 0) && selected && (
        <div role="dialog" aria-modal="true" aria-labelledby="calendar-day-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 md:p-6"
          onClick={closeDayDetails}>
          <section className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-lg bg-petal p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h2 id="calendar-day-title" className="font-display text-3xl font-semibold">
                  {dayNameOfISO(selected)}, {longDateOfISO(selected)}
                </h2>
                {selDay?.theme && <p className="font-display italic text-copper">{selDay.theme}</p>}
              </div>
              <button ref={closeButtonRef} type="button" aria-label="Close day details" onClick={closeDayDetails}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-card text-copper hover:bg-hairline">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
                </svg>
              </button>
            </div>
            {selectedVisitDays.length > 0 && (
              <div className="mb-5 space-y-3">
                {selectedVisitDays.map((day) => (
                  <VisitDayCard key={`${day.startDate}-${day.title}`} day={day} compact />
                ))}
              </div>
            )}
            {selDay ? <Timeline events={selDay.events} /> : <EmptyState message="No activities have been added for this date." />}
          </section>
        </div>
      )}

      <ScanLightbox scans={month.sourceScans} label="View this month's printed pages" />
    </div>
  );
}
