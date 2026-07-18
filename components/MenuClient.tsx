"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ActivityDay, ActivityMonth, MenuWeek } from "@/lib/schema";
import { addDaysISO, dayNameOfISO, longDateOfISO, formatTime, sundayOfISO } from "@/lib/dates";
import { findActivityDay, menuWeekFor, publishedMenuWeeks } from "@/lib/lookup";
import Breadcrumbs from "@/components/Breadcrumbs";
import MealCards from "@/components/MealCards";
import EmptyState from "@/components/EmptyState";
import ScanLightbox from "@/components/ScanLightbox";
import { useToday } from "@/components/useToday";

function weekRangeLabel(start: string): string {
  const end = addDaysISO(start, 6);
  const startDate = new Date(`${start}T12:00:00Z`);
  const endDate = new Date(`${end}T12:00:00Z`);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const month = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long" });
  const monthDay = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric" });
  const fullDate = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });

  if (sameMonth) {
    return `${month.format(startDate)} ${startDate.getUTCDate()}-${endDate.getUTCDate()}, ${endDate.getUTCFullYear()}`;
  }
  if (sameYear) {
    return `${monthDay.format(startDate)} - ${monthDay.format(endDate)}, ${endDate.getUTCFullYear()}`;
  }
  return `${fullDate.format(startDate)} - ${fullDate.format(endDate)}`;
}

export default function MenuClient({ weeks, months }: { weeks: MenuWeek[]; months: ActivityMonth[] }) {
  const today = useToday();
  const menus = useMemo(() => publishedMenuWeeks(weeks), [weeks]);
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
    const todayWeek = menuWeekFor(menus, today);
    const todayWeekIdx = todayWeek ? menus.indexOf(todayWeek) : -1;
    const currentDate = dateRef.current;

    if (currentDate && currentDate !== previousToday) return;
    setIdx(todayWeekIdx);
    setDate(today);
  }, [today, menus]);

  if (!today || !date) return null;
  if (menus.length === 0) return <EmptyState message="No menus have been added yet." />;

  const week = idx >= 0 ? menus[idx] : null;
  const weekStart = week?.weekOf ?? sundayOfISO(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  const activeDate = weekDates.includes(date) ? date : weekStart;
  const day = week?.days.find((d) => d.date === activeDate) ?? null;
  const todayActivities = findActivityDay(months, today);
  const weekRange = weekRangeLabel(weekStart);

  function moveWeek(delta: number) {
    const next = idx < 0 ? menus.length - 1 : Math.min(menus.length - 1, Math.max(0, idx + delta));
    setIdx(next);
    setDate(menus[next].weekOf);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <section className="max-w-xl">
        <Breadcrumbs />
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
          <button disabled={idx === 0} onClick={() => moveWeek(-1)}
            className="mt-1 whitespace-nowrap font-bold text-copper disabled:opacity-30">‹ Last</button>
          <div className="min-w-0 text-center">
            <h1 className="whitespace-nowrap font-display text-3xl font-semibold">This Week</h1>
            <p className="mt-1 truncate text-moss">{weekRange}</p>
          </div>
          <button disabled={idx < 0 || idx === menus.length - 1} onClick={() => moveWeek(1)}
            className="mt-1 whitespace-nowrap font-bold text-copper disabled:opacity-30">Next ›</button>
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
                className={`rounded-lg border-2 px-0.5 py-1 text-center sm:px-1 sm:py-2 ${
                  selected
                    ? "border-copper bg-copper text-petal"
                    : isToday
                      ? "border-copper bg-card text-moss"
                      : "border-transparent bg-card text-moss ring-1 ring-inset ring-hairline"
                }`}>
                <span className="block text-[13px] font-bold uppercase">{dayNameOfISO(d).slice(0, 3)}</span>
                <span className="block text-xl font-semibold leading-tight tabular-nums">{Number(d.slice(8))}</span>
              </button>
            );
          })}
        </div>

        {!week && (
          <p className="mb-3 text-moss">
            This week&apos;s menu hasn&apos;t been added yet. Add the new menu after Sunday ingest.
          </p>
        )}

        <MealCards day={day} />

        <ScanLightbox scans={week?.sourceScan ? [week.sourceScan] : []} label="View the printed menu" />
      </section>

      <TodayActivitiesSummary day={todayActivities} today={today} />
    </div>
  );
}

function TodayActivitiesSummary({ day, today }: { day: ActivityDay | null; today: string }) {
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
