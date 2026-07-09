"use client";

import Link from "next/link";
import { useState } from "react";
import type { ActivityMonth, MenuDay, MenuWeek } from "@/lib/schema";
import {
  addDaysISO, mondayOfISO,
  dayNameOfISO, longDateOfISO, monthNameOfISO, formatTime,
} from "@/lib/dates";
import { findActivityDay, findMenuDay } from "@/lib/lookup";
import Timeline from "@/components/Timeline";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";
import { useToday } from "@/components/useToday";
import { MEAL_HOURS } from "@/components/MealCards";

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

export default function HomeClient({ months, weeks }: { months: ActivityMonth[]; weeks: MenuWeek[] }) {
  const today = useToday();
  const [pick, setPick] = useState<DayPick>("today");

  if (!today) return null; // date is client-side by design; render after mount

  const date = pick === "tomorrow" ? addDaysISO(today, 1) : today;
  const weekStart = mondayOfISO(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  const day = findActivityDay(months, date);
  const todayMenu = findMenuDay(weeks, today);
  const activeDateLabel = pick === "week"
    ? `${longDateOfISO(weekStart)} – ${longDateOfISO(addDaysISO(weekStart, 6))}`
    : `${dayNameOfISO(date)}, ${longDateOfISO(date)}`;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <section className="max-w-xl">
        <h1 className="font-display text-3xl font-semibold">{pageTitle(pick)}</h1>
        <p className="mt-1 text-moss">
          {activeDateLabel}
          {pick !== "week" && day?.theme && (
            <span className="font-display italic text-copper"> · {day.theme}</span>
          )}
        </p>

        <div className="my-4 flex items-center gap-2 sm:gap-3">
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
          <Link href="/calendar" aria-label="View all activities"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-card text-copper hover:bg-hairline sm:h-auto sm:w-auto sm:border-0 sm:bg-transparent sm:font-semibold sm:underline-offset-4 sm:hover:bg-transparent sm:hover:underline">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 sm:hidden">
              <path d="M7 2v3M17 2v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span className="hidden sm:inline">View all activities</span>
          </Link>
        </div>

        {pick === "week" ? (
          <WeekActivities months={months} dates={weekDates} today={today} />
        ) : (
          day
            ? <Timeline events={day.events} />
            : <EmptyState message={`${monthNameOfISO(date)}'s calendar hasn't been added yet.`} />
        )}
      </section>

      <TodayMenuSummary day={todayMenu} today={today} />
    </div>
  );
}

function TodayMenuSummary({ day, today }: { day: MenuDay | null; today: string }) {
  return (
    <aside className="border-t border-hairline pt-5 text-[15px] text-moss lg:sticky lg:top-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
      <div className="mb-3">
        <h2 className="font-display text-xl font-semibold text-ink">Today&apos;s Menu</h2>
        <p className="mt-1 text-moss">
          {dayNameOfISO(today)}, {longDateOfISO(today)}
        </p>
      </div>

      {!day ? (
        <p>This week&apos;s menu hasn&apos;t been added yet.</p>
      ) : (
        <div className="space-y-4">
          {MEAL_HOURS.map(([key, label, hours]) => {
            const items = day[key].items.slice(0, 2);
            return (
              <section key={key}>
                <div className="mb-1">
                  <h3 className="font-semibold text-ink">{label}</h3>
                  <p className="text-[13px] tabular-nums">{hours}</p>
                </div>
                {items.length === 0 ? (
                  <p>Not listed</p>
                ) : (
                  <ul className="space-y-1">
                    {items.map((item, index) => (
                      <li key={index} className={item.kind === "dessert" ? "text-copper" : ""}>
                        {item.name}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Link href="/menu" className="mt-4 inline-block font-semibold text-copper underline-offset-4 hover:underline">
        Full menu
      </Link>
    </aside>
  );
}

function DayHeading({ date, today, theme }: { date: string; today: string; theme: string | null }) {
  const note = date === today ? "Today" : date === addDaysISO(today, 1) ? "Tomorrow" : null;
  return (
    <h2 className="mt-4 font-semibold">
      {dayNameOfISO(date).slice(0, 3)} {Number(date.slice(8))}
      {note && <span className="font-normal text-moss"> · {note}</span>}
      {theme && <span className="font-display text-[15px] font-normal italic text-copper"> · {theme}</span>}
    </h2>
  );
}

function WeekActivities({ months, dates, today }: { months: ActivityMonth[]; dates: string[]; today: string }) {
  return (
    <div className="divide-y divide-hairline border-y border-hairline">
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
