"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FeaturedFaq } from "@/lib/faqs";
import type { Contact, MenuWeek } from "@/lib/schema";
import { addDaysISO, dayNameOfISO, longDateOfISO, sundayOfISO } from "@/lib/dates";
import { menuWeekFor, publishedMenuWeeks } from "@/lib/lookup";
import Breadcrumbs from "@/components/Breadcrumbs";
import MealCards from "@/components/MealCards";
import EmptyState from "@/components/EmptyState";
import ScanLightbox from "@/components/ScanLightbox";
import HelpfulToday from "@/components/HelpfulToday";
import { useToday } from "@/components/useToday";
import { useNow } from "@/components/useNow";

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

export default function MenuClient({
  weeks,
  featuredFaqs,
  contacts,
}: {
  weeks: MenuWeek[];
  featuredFaqs: FeaturedFaq[];
  contacts: Contact[];
}) {
  const today = useToday();
  const now = useNow();
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
  const weekRange = weekRangeLabel(weekStart);

  function moveWeek(delta: number) {
    const next = idx < 0 ? menus.length - 1 : Math.min(menus.length - 1, Math.max(0, idx + delta));
    setIdx(next);
    setDate(menus[next].weekOf);
  }

  function moveDayFocus(index: number, event: React.KeyboardEvent<HTMLButtonElement>) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % weekDates.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + weekDates.length) % weekDates.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = weekDates.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextDate = weekDates[nextIndex];
    setDate(nextDate);
    window.requestAnimationFrame(() => document.getElementById(`menu-day-tab-${nextDate}`)?.focus());
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <section className="max-w-xl">
        <Breadcrumbs />
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
          <button
            type="button"
            aria-label="Previous menu week"
            disabled={idx === 0}
            onClick={() => moveWeek(-1)}
            className="mt-0.5 min-h-11 whitespace-nowrap rounded-full px-2 font-bold text-copper hover:bg-card disabled:cursor-not-allowed disabled:bg-transparent disabled:text-moss"
          >
            ‹ Last
          </button>
          <div className="min-w-0 text-center">
            <h1 className="whitespace-nowrap font-display text-title font-semibold">This Week</h1>
            <p className="mt-1 truncate text-moss">{weekRange}</p>
          </div>
          <button
            type="button"
            aria-label="Next menu week"
            disabled={idx < 0 || idx === menus.length - 1}
            onClick={() => moveWeek(1)}
            className="mt-0.5 min-h-11 whitespace-nowrap rounded-full px-2 font-bold text-copper hover:bg-card disabled:cursor-not-allowed disabled:bg-transparent disabled:text-moss"
          >
            Next ›
          </button>
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
              <button
                key={d}
                id={`menu-day-tab-${d}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="menu-day-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setDate(d)}
                onKeyDown={(event) => moveDayFocus(weekDates.indexOf(d), event)}
                aria-label={`${dayNameOfISO(d)}, ${longDateOfISO(d)}${isToday ? ", today" : ""}`}
                className={`min-h-14 rounded-lg border-2 px-0.5 py-1 text-center sm:px-1 sm:py-2 ${selected
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

        <div
          id="menu-day-panel"
          role="tabpanel"
          aria-labelledby={`menu-day-tab-${activeDate}`}
        >
          <MealCards day={day} now={activeDate === today ? now : null} />
        </div>

        <ScanLightbox scans={week?.sourceScan ? [week.sourceScan] : []} label="View the printed menu" />
      </section>

      <aside className="pt-1 lg:sticky lg:top-24">
        <HelpfulToday today={today} faqs={featuredFaqs} contacts={contacts} />
      </aside>
    </div>
  );
}
