"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ActivityDay, ActivityMonth, MenuWeek } from "@/lib/schema";
import { mondayOfISO, addDaysISO, dayNameOfISO, longDateOfISO, formatTime } from "@/lib/dates";
import { findActivityDay } from "@/lib/lookup";
import MealCards from "@/components/MealCards";
import EmptyState from "@/components/EmptyState";
import ScanLightbox from "@/components/ScanLightbox";
import { useToday } from "@/components/useToday";

export default function MenuClient({ weeks, months }: { weeks: MenuWeek[]; months: ActivityMonth[] }) {
  const today = useToday();
  const [idx, setIdx] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const previousTodayRef = useRef<string | null>(null);
  const dateRef = useRef<string | null>(null);

  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  useEffect(() => {
    if (!today) return;
    const previousToday = previousTodayRef.current;
    previousTodayRef.current = today;
    const todayWeekIdx = weeks.findIndex((w) => w.weekOf === mondayOfISO(today));
    const fallbackIdx = Math.max(0, weeks.length - 1);
    const currentDate = dateRef.current;

    if (currentDate && currentDate !== previousToday) return;
    setIdx(todayWeekIdx >= 0 ? todayWeekIdx : fallbackIdx);
    setDate(today);
  }, [today, weeks]);

  if (!today || !date) return null;
  if (weeks.length === 0) return <EmptyState message="No menus have been added yet." />;

  const week = weeks[idx];
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(week.weekOf, i));
  const activeDate = weekDates.includes(date) ? date : week.weekOf;
  const day = week.days.find((d) => d.date === activeDate) ?? null;
  const todayActivities = findActivityDay(months, today);

  function moveWeek(delta: number) {
    const next = Math.min(weeks.length - 1, Math.max(0, idx + delta));
    setIdx(next);
    setDate(weeks[next].weekOf);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <section className="max-w-xl">
        <div className="flex items-center justify-between">
          <button disabled={idx === 0} onClick={() => moveWeek(-1)}
            className="font-bold text-copper disabled:opacity-30">‹ Last week</button>
          <h1 className="font-display text-3xl font-semibold">Week of {longDateOfISO(week.weekOf)}</h1>
          <button disabled={idx === weeks.length - 1} onClick={() => moveWeek(1)}
            className="font-bold text-copper disabled:opacity-30">Next ›</button>
        </div>

        <div
          role="tablist"
          aria-label="Day of week"
          className="my-4 grid grid-cols-7 gap-1 sm:gap-1.5"
        >
          {weekDates.map((d) => {
            const selected = activeDate === d;
            const isToday = today === d;
            return (
              <button key={d} role="tab" aria-selected={selected} onClick={() => setDate(d)}
                aria-label={`${dayNameOfISO(d)}, ${longDateOfISO(d)}${isToday ? ", today" : ""}`}
                className={`rounded-lg border px-0.5 py-2 text-center sm:px-1 ${
                  selected ? "border-copper bg-copper text-petal" : "border-hairline bg-card text-moss"
                }`}>
                <span className="block text-[13px] font-bold uppercase">{dayNameOfISO(d).slice(0, 3)}</span>
                <span className="block text-xl font-semibold leading-tight tabular-nums">{Number(d.slice(8))}</span>
                <span aria-hidden="true" className={`mx-auto mt-1 block h-1.5 w-1.5 rounded-full ${
                  isToday && !selected ? "bg-copper" : "bg-transparent"
                }`} />
              </button>
            );
          })}
        </div>

        <MealCards day={day} />

        {week.alwaysAvailable.length > 0 && (
          <p className="mt-4 text-[15px] text-moss">
            <b className="text-ink">Always available:</b> {week.alwaysAvailable.join(" · ")}
          </p>
        )}

        <ScanLightbox scans={week.sourceScan ? [week.sourceScan] : []} label="View the printed menu" />
      </section>

      <TodayActivitiesSummary day={todayActivities} today={today} />
    </div>
  );
}

function TodayActivitiesSummary({ day, today }: { day: ActivityDay | null; today: string }) {
  const specials = day?.events.filter((event) => !event.routine).slice(0, 4) ?? [];
  const routineCount = day ? day.events.filter((event) => event.routine).length : 0;

  return (
    <aside className="border-t border-hairline pt-5 text-[15px] text-moss lg:sticky lg:top-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
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
