"use client";

import Link from "next/link";
import type { FeaturedFaq } from "@/lib/faqs";
import type { ActivityDay, ActivityEvent, ActivityMonth, Contact, MenuDay, MenuWeek } from "@/lib/schema";
import {
  addDaysISO, mondayOfISO,
  dayNameOfISO, monthDayOfISO, monthNameOfISO, monthOfISO, formatTime,
} from "@/lib/dates";
import { findActivityDay, findMenuDay } from "@/lib/lookup";
import Timeline from "@/components/Timeline";
import DimensionChip from "@/components/DimensionChip";
import EmptyState from "@/components/EmptyState";
import { useToday } from "@/components/useToday";
import MealCards, { MEALS, mealHours } from "@/components/MealCards";
import HelpfulToday from "@/components/HelpfulToday";
import {
  greetingFor,
  heroStateFor,
  mealMomentFor,
  tomorrowPreview,
  type HeroState,
  type MealMoment,
} from "@/lib/now";
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
  const tomorrowDay = findActivityDay(months, addDaysISO(today, 1));
  const todayMenuDay = findMenuDay(weeks, today);
  const tomorrowMenuDay = findMenuDay(weeks, addDaysISO(today, 1));
  const menuDay = mealDate === today ? todayMenuDay : tomorrowMenuDay;
  const activityMoment = now && todayDay ? heroStateFor(todayDay.events, now) : null;
  const mealMoment = now ? mealMomentFor(MEALS, now) : null;
  const summaryMenuDate = mealMoment?.dayOffset === 1 ? addDaysISO(today, 1) : today;
  const summaryMenuDay = summaryMenuDate === today ? todayMenuDay : tomorrowMenuDay;
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

        <div className="mt-3 overflow-hidden rounded-2xl border border-hairline bg-summary shadow-sm sm:mt-4 md:hidden">
          <TodayActivitySummary
            day={todayDay}
            state={activityMoment}
            tomorrow={tomorrowPreview(tomorrowDay)}
            tomorrowMissing={tomorrowDay === null}
            loading={now === null}
          />
          <TodayMealSummary
            day={summaryMenuDay}
            moment={mealMoment}
            loading={now === null}
          />
        </div>
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

function SummaryHeader({
  section,
  title,
  status,
  emphasized = false,
  pillOnLightGround = false,
}: {
  section: HomeSection;
  title: string;
  status: string | null;
  emphasized?: boolean;
  pillOnLightGround?: boolean;
}) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-5">
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-moss">
        <span aria-hidden="true" className="shrink-0 text-copper">
          <HomeSectionIcon section={section} />
        </span>
        {title}
      </h2>
      {status && (
        <span
          className={`rounded-full border px-3 py-1 font-semibold leading-tight ${
            emphasized
              ? "border-copper bg-copper text-petal"
              : `border-summary-accent/30 text-summary-accent ${
                  pillOnLightGround ? "bg-summary" : "bg-card"
                }`
          }`}
        >
          {status}
        </span>
      )}
    </div>
  );
}

function TodayActivitySummary({
  day,
  state,
  tomorrow,
  tomorrowMissing,
  loading,
}: {
  day: ActivityDay | null;
  state: HeroState | null;
  tomorrow: ActivityEvent | null;
  tomorrowMissing: boolean;
  loading: boolean;
}) {
  const status = !loading && state
    ? state.kind === "now"
      ? "Happening now"
      : state.kind === "done"
        ? tomorrow?.start
          ? "Tomorrow"
          : "Finished today"
        : state.first
          ? "First up today"
          : "Up next"
    : null;

  return (
    <section aria-label="Activity summary" className="min-w-0 bg-summary">
      <SummaryHeader
        section="activities"
        title="Activities"
        status={status}
        emphasized={state?.kind === "now"}
      />
      <div className="px-4 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-2">
        {loading ? (
          <p className="mt-3 text-moss">Checking today&apos;s schedule…</p>
        ) : !day ? (
          <>
            <h3 className="mt-3 break-words text-base font-semibold leading-snug text-moss">Calendar not available</h3>
            <p className="mt-1.5 text-moss">Today&apos;s activities haven&apos;t been added yet.</p>
          </>
        ) : !state ? (
          <>
            <h3 className="mt-3 break-words font-display text-2xl font-semibold leading-snug">No timed activities today</h3>
            {day.theme && <p className="mt-1.5 text-moss">Today&apos;s theme is {day.theme}.</p>}
          </>
        ) : state.kind === "done" ? (
          <>
            {tomorrow?.start ? (
              <>
                <h3 className="mt-2 break-words font-display text-xl font-semibold leading-snug sm:mt-3 sm:text-2xl">
                  {tomorrow.title}
                </h3>
                <p className="mt-1.5 font-semibold tabular-nums text-summary-accent">
                  {formatTime(tomorrow.start)}
                </p>
              </>
            ) : tomorrowMissing ? (
              <>
                <h3 className="mt-2 break-words font-display text-xl font-semibold leading-snug sm:mt-3 sm:text-2xl">
                  That&apos;s all for today
                </h3>
                <p className="mt-1.5 text-moss">Tomorrow&apos;s calendar hasn&apos;t been added yet.</p>
              </>
            ) : (
              <h3 className="mt-2 break-words font-display text-xl font-semibold leading-snug sm:mt-3 sm:text-2xl">
                That&apos;s all for today
              </h3>
            )}
          </>
        ) : (
          <ActivityMoment state={state} />
        )}
      </div>
    </section>
  );
}

function ActivityMoment({ state }: { state: Exclude<HeroState, { kind: "done" }> }) {
  const event = state.event;
  const time = state.kind === "now"
    ? activityTimeRange(event)
    : startsIn(state.minutesUntil, event.start!);

  return (
    <>
      <h3 className="mt-2 break-words font-display text-xl font-semibold leading-snug sm:mt-3 sm:text-2xl">{event.title}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-moss">
        <span className="font-semibold tabular-nums text-summary-accent">{time}</span>
        {event.location && <span>{event.location}</span>}
        {event.dimension && <DimensionChip dimension={event.dimension} />}
      </div>
      {state.kind === "now" && state.next?.start && (
        <p className="mt-3 border-t border-hairline/70 pt-2 text-moss">
          Up next: {state.next.title} at {formatTime(state.next.start)}
        </p>
      )}
    </>
  );
}

function TodayMealSummary({
  day,
  moment,
  loading,
}: {
  day: MenuDay | null;
  moment: MealMoment | null;
  loading: boolean;
}) {
  const meal = moment ? MEALS[moment.index] : null;
  const items = day && meal ? day[meal.key].items : null;
  const preview = items ? mealPreview(items) : [];
  const status = !loading && moment
    ? moment.kind === "serving"
      ? "Serving now"
      : moment.kind === "tomorrow"
        ? "Tomorrow"
        : "Next meal"
    : null;

  return (
    <section aria-label="Meal summary" className="min-w-0 border-t border-hairline bg-card">
      <SummaryHeader
        section="meals"
        title="Meals"
        status={status}
        emphasized={moment?.kind === "serving"}
        pillOnLightGround
      />
      <div className="px-4 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-2">
        {loading ? (
          <p className="mt-3 text-moss">Checking today&apos;s menu…</p>
        ) : !moment || !meal ? (
          <p className="mt-3 text-moss">Meal times aren&apos;t available.</p>
        ) : !day ? (
          <>
            <h3 className="mt-3 break-words text-base font-semibold leading-snug text-moss">Menu not available</h3>
            <p className="mt-1.5 text-moss">
              The {moment.dayOffset === 1 ? "tomorrow" : "today"} menu hasn&apos;t been added yet.
            </p>
          </>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 sm:mt-3">
              <h3 className="break-words font-display text-xl font-semibold leading-snug sm:text-2xl">{meal.label}</h3>
              <p className="font-semibold tabular-nums text-summary-accent">{mealHours(meal)}</p>
            </div>
            {preview.length > 0 && (
              <p className="mt-2 break-words leading-snug text-moss sm:mt-3">
                {preview[0]}
                {preview.slice(1).map((item) => (
                  <span key={item} className="hidden sm:inline"> · {item}</span>
                ))}
                {items && items.length > 1 && (
                  <span className="sm:hidden"> · +{items.length - 1} more</span>
                )}
                {items && items.length > preview.length && (
                  <span className="hidden sm:inline"> · +{items.length - preview.length} more</span>
                )}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function startsIn(minutesUntil: number, start: string): string {
  if (minutesUntil >= 60) return `At ${formatTime(start)}`;
  return minutesUntil === 1 ? "Starts in 1 minute" : `Starts in ${minutesUntil} minutes`;
}

function activityTimeRange(event: ActivityEvent): string {
  if (!event.start) return "All day";
  return event.end ? `${formatTime(event.start)} – ${formatTime(event.end)}` : formatTime(event.start);
}

function mealPreview(items: MenuDay["breakfast"]["items"]): string[] {
  const mains = items.filter((item) => item.kind === "main");
  const supporting = items.filter((item) => item.kind !== "main" && item.kind !== "dessert");
  const choices = mains.length > 0 ? [...mains, ...supporting] : items;
  return choices.slice(0, 3).map((item) => item.name);
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
