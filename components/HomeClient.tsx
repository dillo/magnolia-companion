"use client";

import { useEffect, useState } from "react";
import type { ActivityMonth, MenuWeek } from "@/lib/schema";
import {
  todayISO, addDaysISO, mondayOfISO,
  dayNameOfISO, longDateOfISO, monthNameOfISO, formatTime,
} from "@/lib/dates";
import { findActivityDay, findMenuDay, scansForDate } from "@/lib/lookup";
import Timeline from "@/components/Timeline";
import MealCards from "@/components/MealCards";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";
import ScanLightbox from "@/components/ScanLightbox";

type DayPick = "today" | "tomorrow" | "week";
type Mode = "activities" | "meals";

const PICKS: { key: DayPick; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
];

export default function HomeClient({ months, weeks }: { months: ActivityMonth[]; weeks: MenuWeek[] }) {
  const [today, setToday] = useState<string | null>(null);
  const [pick, setPick] = useState<DayPick>("today");
  const [mode, setModeState] = useState<Mode>("activities");

  useEffect(() => {
    setToday(todayISO());
    try {
      if (localStorage.getItem("mc-mode") === "meals") setModeState("meals");
    } catch {}
  }, []);

  function setMode(m: Mode) {
    setModeState(m);
    try { localStorage.setItem("mc-mode", m); } catch {}
  }

  if (!today) return null; // date is client-side by design; render after mount

  const date = pick === "tomorrow" ? addDaysISO(today, 1) : today;
  const weekStart = mondayOfISO(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  const day = findActivityDay(months, date);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-semibold">
        {pick === "week" ? "This Week" : dayNameOfISO(date)}
      </h1>
      <p className="text-moss">
        {pick === "week"
          ? `${longDateOfISO(weekStart)} – ${longDateOfISO(addDaysISO(weekStart, 6))}`
          : longDateOfISO(date)}
      </p>
      {pick !== "week" && day?.theme && (
        <p className="font-display italic text-copper">{day.theme}</p>
      )}

      <div role="tablist" aria-label="Day" className="mt-3 flex w-fit rounded-full bg-hairline/60 p-1">
        {PICKS.map((p) => (
          <button key={p.key} role="tab" aria-selected={pick === p.key} onClick={() => setPick(p.key)}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold ${
              pick === p.key ? "bg-copper text-petal" : "text-moss"
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      <div role="tablist" aria-label="Content" className="mb-4 mt-3 flex border-b-2 border-hairline">
        {(["activities", "meals"] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
            className={`-mb-0.5 flex-1 border-b-[3px] pb-2 pt-2 text-lg font-semibold ${
              mode === m ? "border-ink text-ink" : "border-transparent text-moss"
            }`}>
            {m === "activities" ? "Activities" : "Meals"}
          </button>
        ))}
      </div>

      {pick === "week" ? (
        mode === "activities"
          ? <WeekActivities months={months} dates={weekDates} today={today} />
          : <WeekMeals weeks={weeks} dates={weekDates} today={today} />
      ) : mode === "activities" ? (
        day
          ? <Timeline events={day.events} />
          : <EmptyState message={`${monthNameOfISO(date)}'s calendar hasn't been added yet.`} />
      ) : (
        <MealCards day={findMenuDay(weeks, date)} />
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
                <span className="w-14 shrink-0 text-right font-semibold tabular-nums text-copper">
                  {e.start ? formatTime(e.start) : "All day"}
                </span>
                <span>
                  {e.title} {e.dimension && <DimensionChip dimension={e.dimension} />}
                </span>
              </div>
            ))}
            {routineCount > 0 && (
              <p className="ml-16 text-[15px] text-moss">+ {routineCount} daily routine items</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekMeals({ weeks, dates, today }: { weeks: MenuWeek[]; dates: string[]; today: string }) {
  return (
    <div className="divide-y divide-hairline">
      {dates.map((date) => {
        const day = findMenuDay(weeks, date);
        return (
          <div key={date} className="pb-3">
            <DayHeading date={date} today={today} theme={null} />
            {!day && <p className="text-moss">Menu not added yet.</p>}
            {day &&
              (["breakfast", "lunch", "dinner"] as const).map((meal) => (
                <p key={meal} className="mb-1 text-[15px]">
                  <b className="capitalize">{meal}</b>{" "}
                  {day[meal].items.length === 0
                    ? <span className="text-moss">not listed</span>
                    : day[meal].items.map((it, i) => (
                        <span key={i}>
                          <span className={it.kind === "dessert" ? "text-copper" : ""}>{it.name}</span>
                          {i < day[meal].items.length - 1 && " · "}
                        </span>
                      ))}
                </p>
              ))}
          </div>
        );
      })}
    </div>
  );
}
