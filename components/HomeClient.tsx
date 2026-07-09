"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ActivityMonth } from "@/lib/schema";
import {
  todayISO, addDaysISO, mondayOfISO,
  dayNameOfISO, longDateOfISO, monthNameOfISO, formatTime,
} from "@/lib/dates";
import { findActivityDay, scansForDate } from "@/lib/lookup";
import Timeline from "@/components/Timeline";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";
import ScanLightbox from "@/components/ScanLightbox";

type DayPick = "today" | "tomorrow" | "week";

const PICKS: { key: DayPick; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
];

function pageTitle(pick: DayPick) {
  if (pick === "today") return "Today's Activities";
  if (pick === "tomorrow") return "Tomorrow's Activities";
  return "This Week's Activities";
}

export default function HomeClient({ months }: { months: ActivityMonth[] }) {
  const [today, setToday] = useState<string | null>(null);
  const [pick, setPick] = useState<DayPick>("today");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- today must come from the browser clock after mount (static site)
    setToday(todayISO());
  }, []);

  if (!today) return null; // date is client-side by design; render after mount

  const date = pick === "tomorrow" ? addDaysISO(today, 1) : today;
  const weekStart = mondayOfISO(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  const day = findActivityDay(months, date);
  const activeDateLabel = pick === "week"
    ? `${longDateOfISO(weekStart)} – ${longDateOfISO(addDaysISO(weekStart, 6))}`
    : `${dayNameOfISO(date)}, ${longDateOfISO(date)}`;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-semibold">{pageTitle(pick)}</h1>
      <p className="mt-1 text-moss">{activeDateLabel}</p>
      {pick !== "week" && day?.theme && (
        <p className="font-display italic text-copper">{day.theme}</p>
      )}

      <div className="my-4 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Activity dates" className="flex w-fit rounded-full bg-hairline/60 p-1">
          {PICKS.map((p) => (
            <button key={p.key} role="tab" aria-selected={pick === p.key} onClick={() => setPick(p.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold ${
                pick === p.key ? "bg-copper text-petal" : "text-moss"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
        <Link href="/calendar" className="font-semibold text-copper underline-offset-4 hover:underline">
          View all activities
        </Link>
      </div>

      {pick === "week" ? (
        <WeekActivities months={months} dates={weekDates} today={today} />
      ) : (
        day
          ? <Timeline events={day.events} />
          : <EmptyState message={`${monthNameOfISO(date)}'s calendar hasn't been added yet.`} />
      )}

      <ScanLightbox scans={scansForDate(months, date)} label="View this month's printed pages" />
    </div>
  );
}

function DayHeading({ date, today, theme }: { date: string; today: string; theme: string | null }) {
  const note = date === today ? "Today" : date === addDaysISO(today, 1) ? "Tomorrow" : null;
  return (
    <>
      <h2 className="mt-4 font-semibold">
        {dayNameOfISO(date).slice(0, 3)} {Number(date.slice(8))}
        {note && <span className="font-normal text-moss"> · {note}</span>}
      </h2>
      {theme && <p className="font-display text-[15px] italic text-copper">{theme}</p>}
    </>
  );
}

function WeekActivities({ months, dates, today }: { months: ActivityMonth[]; dates: string[]; today: string }) {
  return (
    <div className="divide-y divide-hairline">
      {dates.map((date) => {
        const day = findActivityDay(months, date);
        const specials = day?.events.filter((e) => !e.routine) ?? [];
        const routineCount = (day?.events.length ?? 0) - specials.length;
        return (
          <div key={date} className="pb-3">
            <DayHeading date={date} today={today} theme={day?.theme ?? null} />
            {!day && <p className="text-moss">Not added yet.</p>}
            {specials.map((e, i) => (
              <div key={i} className="mb-1.5 flex items-baseline gap-2">
                <span className="w-20 shrink-0 text-right font-semibold tabular-nums text-copper">
                  {e.start ? formatTime(e.start) : "All day"}
                </span>
                <span>
                  {e.title} {e.dimension && <DimensionChip dimension={e.dimension} />}
                </span>
              </div>
            ))}
            {routineCount > 0 && (
              <p className="ml-[5.5rem] text-[15px] text-moss">+ {routineCount} daily routine items</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
