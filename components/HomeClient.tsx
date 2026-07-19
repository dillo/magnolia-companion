"use client";

import Link from "next/link";
import { useState } from "react";
import type { ActivityMonth, MenuDay, MenuWeek, VisitDay } from "@/lib/schema";
import {
  addDaysISO, mondayOfISO,
  dayNameOfISO, longDateOfISO, monthNameOfISO, formatTime,
} from "@/lib/dates";
import { findActivityDay, findMenuDay, upcomingVisitDays } from "@/lib/lookup";
import Timeline from "@/components/Timeline";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";
import { useToday } from "@/components/useToday";
import { MEALS, mealHours } from "@/components/MealCards";
import { VisitDaysSummary } from "@/components/VisitDays";
import { greetingFor, heroStateFor, servingNow, tomorrowPreview } from "@/lib/now";
import { useNow } from "@/components/useNow";
import MagnoliaFlourish from "@/components/MagnoliaFlourish";
import HeroCard from "@/components/HeroCard";

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

export default function HomeClient({
  months,
  weeks,
  visitDays,
}: {
  months: ActivityMonth[];
  weeks: MenuWeek[];
  visitDays: VisitDay[];
}) {
  const today = useToday();
  const now = useNow();
  const [pick, setPick] = useState<DayPick>("today");

  if (!today) return null; // date is client-side by design; render after mount

  const date = pick === "tomorrow" ? addDaysISO(today, 1) : today;
  const weekStart = mondayOfISO(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  const day = findActivityDay(months, date);
  const tomorrowDay = findActivityDay(months, addDaysISO(today, 1));
  const menuDate = pick === "tomorrow" ? date : today;
  const menuDay = findMenuDay(weeks, menuDate);
  const menuTitle = pick === "tomorrow" ? "Tomorrow's Menu" : "Today's Menu";
  const activeDateLabel = pick === "week"
    ? `${longDateOfISO(weekStart)} – ${longDateOfISO(addDaysISO(weekStart, 6))}`
    : `${dayNameOfISO(date)}, ${longDateOfISO(date)}`;

  const showMenuSummary = pick !== "week";
  const upcomingVisits = upcomingVisitDays(visitDays, today, 3);

  return (
    <div className={`mx-auto grid max-w-5xl gap-8 ${
      showMenuSummary ? "lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start" : ""
    }`}>
      <section className="min-w-0 lg:max-w-xl">
        {pick === "today" ? (
          <>
            <p className="text-moss">{now ? greetingFor(now) : " "}</p>
            <h1 className="font-display text-4xl font-semibold">
              {dayNameOfISO(date)}, {longDateOfISO(date)}
            </h1>
            {day?.theme && (
              <p className="mt-1.5 flex items-center gap-2 font-display text-xl italic text-copper">
                <MagnoliaFlourish className="h-5 w-5 shrink-0" />
                {day.theme}
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-semibold">{pageTitle(pick)}</h1>
            <p className="mt-1 text-moss">
              {activeDateLabel}
              {day?.theme && pick !== "week" && (
                <span className="font-display italic text-copper"> · {day.theme}</span>
              )}
            </p>
          </>
        )}

        <div className="my-4 flex items-center gap-2 sm:gap-3">
          <div role="tablist" aria-label="Activity dates" className="grid w-full grid-cols-3 rounded-full bg-hairline/60 p-1 lg:flex lg:w-fit">
            {PICKS.map((p) => (
              <button key={p.key} role="tab" aria-selected={pick === p.key} onClick={() => setPick(p.key)}
                className={`whitespace-nowrap rounded-full px-2 py-2 text-center font-semibold sm:px-4 ${
                  pick === p.key ? "bg-copper text-petal" : "text-moss"
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {pick === "today" && now && day && (
          <div className="mb-5">
            <HeroCard
              state={heroStateFor(day.events, now)}
              tomorrow={tomorrowPreview(tomorrowDay)}
              tomorrowMissing={tomorrowDay === null}
            />
          </div>
        )}

        {pick === "week" ? (
          <WeekActivities months={months} dates={weekDates} today={today} />
        ) : (
          day
            ? <Timeline events={day.events} now={pick === "today" ? now : null} />
            : <EmptyState message={`${monthNameOfISO(date)}'s calendar hasn't been added yet.`} />
        )}

        <Link href="/calendar"
          className="mt-4 inline-block font-semibold text-copper underline-offset-4 hover:underline">
          View all activities
        </Link>
      </section>

      {showMenuSummary && (
        <aside className="space-y-5 pt-1 text-moss lg:sticky lg:top-6 lg:border-l lg:border-hairline lg:pl-6 lg:pt-0">
          <MenuSummary day={menuDay} date={menuDate} title={menuTitle} now={pick === "today" ? now : null} />
          <VisitDaysSummary days={upcomingVisits} />
        </aside>
      )}
    </div>
  );
}

function MenuSummary({
  day,
  date,
  title,
  now,
}: {
  day: MenuDay | null;
  date: string;
  title: string;
  now: string | null;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-moss">
          {dayNameOfISO(date)}, {longDateOfISO(date)}
        </p>
      </div>

      {!day && <p className="mb-3">The menu for this date hasn&apos;t been added yet.</p>}

      <div className="space-y-3">
        {MEALS.map((meal) => {
          const items = day?.[meal.key].items ?? null;
          return (
            <section key={meal.key} className="rounded-xl border border-hairline bg-card px-4 py-3 shadow-sm">
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h3 className="text-[15px] font-bold uppercase tracking-wider text-ink">{meal.label}</h3>
                {servingNow(meal, now) ? (
                  <span className="rounded-full bg-copper px-2.5 py-0.5 text-[13px] font-bold text-petal">
                    Serving now
                  </span>
                ) : (
                  <span className="tabular-nums text-moss">{mealHours(meal)}</span>
                )}
              </div>
              {items === null ? (
                <ul className="space-y-1" aria-label="Menu pending">
                  {Array.from({ length: 3 }, (_, index) => (
                    <li key={index} className="flex gap-2 leading-snug text-moss">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper/50" />
                      <span className="tracking-widest">...</span>
                    </li>
                  ))}
                </ul>
              ) : items.length === 0 ? (
                <p className="text-moss">Not listed</p>
              ) : (
                <ul className="space-y-1">
                  {items.map((item, index) => (
                    <li key={index} className="flex gap-2 leading-snug">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                      <span className={item.kind === "dessert" ? "text-copper" : ""}>
                        {item.kind === "dessert" && (
                          <span aria-hidden="true" className="mr-1 text-[13px] align-middle">◆</span>
                        )}
                        {item.name}
                      </span>
                    </li>
                  ))}
                  </ul>
              )}
            </section>
          );
        })}
      </div>

      <Link href="/menu" className="mt-4 inline-block font-semibold text-copper underline-offset-4 hover:underline">
        Full menu
      </Link>
    </section>
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
        const isToday = date === today;
        return (
          <div key={date} className="pb-3">
            <DayHeading date={date} today={today} theme={day?.theme ?? null} />
            <div className={isToday ? "mt-2 rounded-lg border border-copper bg-copper/10 py-2" : ""}>
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
          </div>
        );
      })}
    </div>
  );
}
