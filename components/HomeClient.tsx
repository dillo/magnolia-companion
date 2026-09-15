"use client";

import Link from "next/link";
import type { FeaturedFaq } from "@/lib/faqs";
import type { ActivityMonth, Contact, MenuWeek } from "@/lib/schema";
import {
  addDaysISO, mondayOfISO,
  dayNameOfISO, monthDayOfISO, monthNameOfISO, monthOfISO, formatTime,
} from "@/lib/dates";
import { findActivityDay, findMenuDay } from "@/lib/lookup";
import Timeline from "@/components/Timeline";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";
import { useToday } from "@/components/useToday";
import MealCards from "@/components/MealCards";
import HelpfulToday from "@/components/HelpfulToday";
import { greetingFor } from "@/lib/now";
import { useNow } from "@/components/useNow";
import MagnoliaFlourish from "@/components/MagnoliaFlourish";
import MedicationRefillReminder from "@/components/MedicationRefillReminder";
import RentReminder from "@/components/RentReminder";
import {
  useHomeNavigation,
  type ActivityPick,
  type HomeSection,
  type MealPick,
} from "@/components/HomeNavigationContext";

const HOME_SECTIONS: { key: HomeSection; label: string; description: string }[] = [
  { key: "activities", label: "Activities", description: "What’s happening" },
  { key: "meals", label: "Meals", description: "What’s being served" },
];

const ACTIVITY_PICKS: { key: ActivityPick; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
];

const MEAL_PICKS: { key: MealPick; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
];

export default function HomeClient({
  months,
  weeks,
  featuredFaqs,
  contacts,
}: {
  months: ActivityMonth[];
  weeks: MenuWeek[];
  featuredFaqs: FeaturedFaq[];
  contacts: Contact[];
}) {
  const today = useToday();
  const now = useNow();
  const {
    section,
    activityPick,
    mealPick,
    selectSection,
    selectActivityPick,
    selectMealPick,
  } = useHomeNavigation();

  if (!today) {
    return (
      <div className="mx-auto min-h-64 max-w-5xl" aria-busy="true">
        <p role="status" className="text-moss">Preparing today&apos;s daybook…</p>
      </div>
    );
  }

  const activityDate = activityPick === "tomorrow" ? addDaysISO(today, 1) : today;
  const mealDate = mealPick === "tomorrow" ? addDaysISO(today, 1) : today;
  const weekStart = mondayOfISO(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  const todayDay = findActivityDay(months, today);
  const day = activityDate === today ? todayDay : findActivityDay(months, activityDate);
  const todayMenuDay = findMenuDay(weeks, today);
  const tomorrowMenuDay = findMenuDay(weeks, addDaysISO(today, 1));
  const menuDay = mealDate === today ? todayMenuDay : tomorrowMenuDay;
  const weekEnd = addDaysISO(weekStart, 6);
  const weekRange = monthOfISO(weekStart) === monthOfISO(weekEnd)
    ? `${monthDayOfISO(weekStart)} – ${Number(weekEnd.slice(8))}`
    : `${monthDayOfISO(weekStart)} – ${monthDayOfISO(weekEnd)}`;

  const weekSpecialCount = weekDates.reduce(
    (n, d) => n + (findActivityDay(months, d)?.events.filter((e) => !e.routine).length ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <section aria-label="Today at a glance">
        <Masthead
          eyebrow={now ? greetingFor(now) : "Today"}
          main={`${dayNameOfISO(today)}, ${monthDayOfISO(today)}`}
          year={today.slice(0, 4)}
          accent={todayDay?.theme ?? null}
        />

      </section>

      <div
        role="tablist"
        aria-label="Home sections"
        aria-orientation="horizontal"
        className="mt-8 grid grid-cols-2 border-b-2 border-hairline sm:mt-10"
      >
        {HOME_SECTIONS.map((item, index) => {
          const selected = section === item.key;
          return (
            <button
              key={item.key}
              id={`home-tab-${item.key}`}
              type="button"
              role="tab"
              aria-label={item.label}
              aria-selected={selected}
              aria-controls={`home-panel-${item.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectSection(item.key)}
              onKeyDown={(event) => {
                let nextIndex: number | null = null;
                if (event.key === "ArrowRight") nextIndex = (index + 1) % HOME_SECTIONS.length;
                if (event.key === "ArrowLeft") nextIndex = (index - 1 + HOME_SECTIONS.length) % HOME_SECTIONS.length;
                if (event.key === "Home") nextIndex = 0;
                if (event.key === "End") nextIndex = HOME_SECTIONS.length - 1;
                if (nextIndex === null) return;
                event.preventDefault();
                const next = HOME_SECTIONS[nextIndex];
                selectSection(next.key);
                document.getElementById(`home-tab-${next.key}`)?.focus();
              }}
              className={`group relative min-h-20 px-3 py-3 text-left transition-colors sm:px-5 ${
                index === 1 ? "border-l border-hairline" : ""
              } ${selected ? "bg-card/55 text-ink" : "text-moss hover:bg-sand/60 hover:text-ink"}`}
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors ${
                    selected
                      ? "bg-sand text-copper ring-1 ring-inset ring-copper/30"
                      : "bg-sand text-moss group-hover:text-ink"
                  }`}
                >
                  <HomeSectionIcon section={item.key} />
                </span>
                <span className="min-w-0">
                  <span className={`block font-display text-xl font-semibold ${selected ? "text-copper" : ""}`}>
                    {item.label}
                  </span>
                  <span className="mt-0.5 block leading-snug">{item.description}</span>
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full bg-copper transition-opacity sm:inset-x-5 ${
                  selected ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0">
          <div
            id="home-panel-activities"
            role="tabpanel"
            aria-labelledby="home-tab-activities"
            hidden={section !== "activities"}
            className={section === "activities" ? "pt-6" : "hidden"}
          >
            <section className="min-w-0 lg:max-w-xl">
              {activityPick === "week" ? (
                <DetailMasthead
                  title="This Week"
                  date={`${weekRange}, ${weekEnd.slice(0, 4)}`}
                  accent={weekSpecialCount > 0
                    ? `${weekSpecialCount} special ${weekSpecialCount === 1 ? "activity" : "activities"}`
                    : null}
                />
              ) : (
                <DetailMasthead
                  title={activityPick === "tomorrow" ? "Tomorrow’s activities" : "Today’s activities"}
                  date={`${dayNameOfISO(activityDate)}, ${monthDayOfISO(activityDate)}, ${activityDate.slice(0, 4)}`}
                  accent={day?.theme ?? null}
                />
              )}

              <DateTabs
                label="Activity dates"
                picks={ACTIVITY_PICKS}
                selected={activityPick}
                onSelect={selectActivityPick}
              />

              {activityPick !== "week" && <RentReminder date={activityDate} />}
              <MedicationRefillReminder date={today} />

              {activityPick === "week" ? (
                <WeekActivities months={months} dates={weekDates} today={today} />
              ) : (
                day
                  ? <Timeline events={day.events} now={activityPick === "today" ? now : null} />
                  : <EmptyState message={`${monthNameOfISO(activityDate)}'s calendar hasn't been added yet.`} />
              )}

              <Link href="/calendar"
                className="mt-4 inline-block font-semibold text-copper underline-offset-4 hover:underline">
                View all activities
              </Link>
            </section>
          </div>

          <section
            id="home-panel-meals"
            role="tabpanel"
            aria-labelledby="home-tab-meals"
            hidden={section !== "meals"}
            className={section === "meals" ? "pt-6" : "hidden"}
          >
            <div className="max-w-xl">
              <DetailMasthead
                title={mealPick === "tomorrow" ? "Tomorrow’s meals" : "Today’s meals"}
                date={`${dayNameOfISO(mealDate)}, ${monthDayOfISO(mealDate)}, ${mealDate.slice(0, 4)}`}
                accent="Breakfast, lunch & dinner"
                flourish={false}
              />

              <DateTabs
                label="Meal dates"
                picks={MEAL_PICKS}
                selected={mealPick}
                onSelect={selectMealPick}
              />
            </div>

            <RentReminder date={mealDate} />

            <MedicationRefillReminder date={today} />

            <MealCards
              day={menuDay}
              now={mealPick === "today" ? now : null}
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
            />

            <Link href="/menu"
              className="mt-4 inline-block font-semibold text-copper underline-offset-4 hover:underline">
              View the full menu
            </Link>
          </section>
        </div>

        <aside className="pt-6 lg:sticky lg:top-24">
          <HelpfulToday today={today} faqs={featuredFaqs} contacts={contacts} />
        </aside>
      </div>
    </div>
  );
}

function DateTabs<T extends string>({
  label,
  picks,
  selected,
  onSelect,
}: {
  label: string;
  picks: readonly { key: T; label: string }[];
  selected: T;
  onSelect: (pick: T) => void;
}) {
  return (
    <div className="my-4 flex items-center gap-2 sm:gap-3">
      <div
        role="group"
        aria-label={label}
        className={`grid w-full rounded-full bg-hairline/60 p-1 lg:w-fit ${
          picks.length === 2 ? "grid-cols-2 lg:grid" : "grid-cols-3 lg:flex"
        }`}
      >
        {picks.map((pick) => (
          <button
            key={pick.key}
            type="button"
            aria-pressed={selected === pick.key}
            onClick={() => onSelect(pick.key)}
            className={`whitespace-nowrap rounded-full px-3 py-2 text-center font-semibold transition-colors sm:px-4 ${
              selected === pick.key ? "bg-copper text-petal" : "text-moss hover:bg-card/70 hover:text-ink"
            }`}
          >
            {pick.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Shared masthead skeleton: orientation, date heading, and accent line. Every line
 * renders in every view (the accent
 * line reserves its height when empty) so the pills below never shift when
 * switching tabs.
 */
function Masthead({
  eyebrow,
  main,
  year,
  accent,
  flourish = true,
}: {
  eyebrow: string;
  main: string;
  year: string;
  accent: string | null;
  flourish?: boolean;
}) {
  return (
    <>
      <p className="text-moss">{eyebrow}</p>
      <h1 className="text-balance font-display text-title font-semibold leading-tight">
        {main}
        <span className="hidden md:inline">, {year}</span>
      </h1>
      <p className="mt-1.5 flex items-center gap-2 font-display text-xl italic text-copper">
        {accent ? (
          <>
            {flourish && <MagnoliaFlourish className="h-5 w-5 shrink-0" />}
            {accent}
          </>
        ) : (
          " "
        )}
      </p>
    </>
  );
}

function DetailMasthead({
  title,
  date,
  accent,
  flourish = true,
}: {
  title: string;
  date: string;
  accent: string | null;
  flourish?: boolean;
}) {
  return (
    <>
      <h3 className="text-balance font-display text-3xl font-semibold leading-tight">{title}</h3>
      <p className="mt-1 text-moss">{date}</p>
      <p className="mt-1.5 flex items-center gap-2 font-display text-xl italic text-copper">
        {accent ? (
          <>
            {flourish && <MagnoliaFlourish className="h-5 w-5 shrink-0" />}
            {accent}
          </>
        ) : (
          " "
        )}
      </p>
    </>
  );
}

function HomeSectionIcon({ section }: { section: HomeSection }) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (section === "meals") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M4 13.5h16M6 13.5a6 6 0 0 1 12 0M3.5 17h17" {...stroke} />
        <path d="M12 6V4.5" {...stroke} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <circle cx="12" cy="12" r="3.5" {...stroke} />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" {...stroke} />
    </svg>
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
            className={`rounded-xl border border-hairline px-4 py-3 shadow-sm ${
              isToday ? "bg-copper/10" : "bg-card"
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
                <p className="ml-[5.75rem] text-moss">+ {routineCount} daily routine items</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
