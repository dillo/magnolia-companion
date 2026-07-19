"use client";

import Link from "next/link";
import { useState } from "react";
import type { ActivityMonth, MenuDay, MenuWeek, VisitDay } from "@/lib/schema";
import {
  addDaysISO, mondayOfISO,
  dayNameOfISO, longDateOfISO, monthDayOfISO, monthNameOfISO, monthOfISO, formatTime,
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
  const weekEnd = addDaysISO(weekStart, 6);
  const weekRange = monthOfISO(weekStart) === monthOfISO(weekEnd)
    ? `${monthDayOfISO(weekStart)} – ${Number(weekEnd.slice(8))}`
    : `${monthDayOfISO(weekStart)} – ${monthDayOfISO(weekEnd)}`;

  const weekSpecialCount = weekDates.reduce(
    (n, d) => n + (findActivityDay(months, d)?.events.filter((e) => !e.routine).length ?? 0),
    0,
  );

  const showMenuSummary = pick !== "week";
  const upcomingVisits = upcomingVisitDays(visitDays, today, 3);

  return (
    <div className={`mx-auto grid max-w-5xl gap-8 ${
      showMenuSummary ? "lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start" : ""
    }`}>
      <section className="min-w-0 lg:max-w-xl">
        {pick === "week" ? (
          <Masthead
            eyebrow="This Week"
            main={weekRange}
            year={weekEnd.slice(0, 4)}
            accent={weekSpecialCount > 0
              ? `${weekSpecialCount} special ${weekSpecialCount === 1 ? "activity" : "activities"}`
              : null}
          />
        ) : (
          <Masthead
            eyebrow={pick === "tomorrow" ? "Tomorrow" : now ? greetingFor(now) : " "}
            main={`${dayNameOfISO(date)}, ${monthDayOfISO(date)}`}
            year={date.slice(0, 4)}
            accent={day?.theme ?? null}
          />
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

/**
 * Shared masthead skeleton for all three views: eyebrow, date h1, accent line
 * (day theme or week summary). Every line renders in every view (the accent
 * line reserves its height when empty) so the pills below never shift when
 * switching tabs.
 */
function Masthead({
  eyebrow,
  main,
  year,
  accent,
}: {
  eyebrow: string;
  main: string;
  year: string;
  accent: string | null;
}) {
  return (
    <>
      <p className="text-moss">{eyebrow}</p>
      <h1 className="whitespace-nowrap font-display text-title font-semibold">
        {/* Year hides below md; the fluid text-title size fits the longest year-less date ("Wednesday, September 30") at any width. */}
        {main}
        <span className="hidden md:inline">, {year}</span>
      </h1>
      <p className="mt-1.5 flex items-center gap-2 font-display text-xl italic text-copper">
        {accent ? (
          <>
            <MagnoliaFlourish className="h-5 w-5 shrink-0" />
            {accent}
          </>
        ) : (
          " "
        )}
      </p>
    </>
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

function WeekActivities({ months, dates, today }: { months: ActivityMonth[]; dates: string[]; today: string }) {
  return (
    <div className="space-y-3">
      {dates.map((date) => {
        const day = findActivityDay(months, date);
        const specials = day?.events.filter((e) => !e.routine) ?? [];
        const routineCount = (day?.events.length ?? 0) - specials.length;
        const isToday = date === today;
        const isTomorrow = date === addDaysISO(today, 1);
        return (
          <section
            key={date}
            className={`rounded-xl border bg-card px-4 py-3 shadow-sm ${
              isToday ? "border-copper ring-1 ring-copper" : "border-hairline"
            }`}
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="font-display text-xl font-semibold">
                {dayNameOfISO(date).slice(0, 3)} {Number(date.slice(8))}
              </h2>
              {isToday && (
                <span className="self-center rounded-full bg-copper px-2 py-0.5 text-[13px] font-bold text-petal">
                  Today
                </span>
              )}
              {isTomorrow && <span className="text-moss">· Tomorrow</span>}
              {day?.theme && <span className="font-display italic text-copper">· {day.theme}</span>}
            </div>
            <div className="mt-2 space-y-1.5">
              {!day && <p className="text-moss">Not added yet.</p>}
              {day && specials.length === 0 && <p className="text-moss">Daily routine only.</p>}
              {specials.map((e, i) => (
                <div key={i} className="flex items-baseline gap-3">
                  <span className="w-20 shrink-0 whitespace-nowrap text-right font-semibold tabular-nums text-copper">
                    {e.start ? formatTime(e.start) : "All day"}
                  </span>
                  <span>
                    {e.title} {e.dimension && <DimensionChip dimension={e.dimension} />}
                  </span>
                </div>
              ))}
              {routineCount > 0 && (
                <p className="ml-[5.75rem] text-[15px] text-moss">+ {routineCount} daily routine items</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
