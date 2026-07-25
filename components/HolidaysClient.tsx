"use client";

import { useMemo, useState } from "react";
import type { FeaturedFaq } from "@/lib/faqs";
import type { Contact, Holiday } from "@/lib/schema";
import { upcomingHolidays } from "@/lib/lookup";
import Breadcrumbs from "@/components/Breadcrumbs";
import HelpfulToday from "@/components/HelpfulToday";
import { useToday } from "@/components/useToday";
import { HolidayCard } from "@/components/Holidays";
import EmptyState from "@/components/EmptyState";

type HolidayFilter = "all" | "family" | "federal" | "religious";

const FILTERS: { key: HolidayFilter; label: string; dotClass?: string }[] = [
  { key: "all", label: "All" },
  { key: "family", label: "Family", dotClass: "bg-ink" },
  { key: "federal", label: "Federal", dotClass: "bg-copper" },
  { key: "religious", label: "Religious", dotClass: "bg-moss" },
];

function matchesFilter(holiday: Holiday, filter: HolidayFilter): boolean {
  if (filter === "all") return true;
  if (filter === "religious") {
    return holiday.categories.some((category) => category === "jewish" || category === "christian");
  }
  return holiday.categories.includes(filter);
}

export default function HolidaysClient({
  holidays,
  featuredFaqs,
  contacts,
}: {
  holidays: Holiday[];
  featuredFaqs: FeaturedFaq[];
  contacts: Contact[];
}) {
  const today = useToday();
  const [filter, setFilter] = useState<HolidayFilter>("all");

  const upcoming = useMemo(
    () => today ? upcomingHolidays(holidays, today) : holidays,
    [holidays, today],
  );
  const filtered = useMemo(
    () => upcoming.filter((holiday) => matchesFilter(holiday, filter)),
    [filter, upcoming],
  );

  if (!today) return null;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <section className="min-w-0">
        <Breadcrumbs />
        <div className="md:flex md:items-end md:justify-between md:gap-6">
          <div>
            <h1 className="font-display text-title font-semibold">Holidays</h1>
          </div>
          <div role="group" aria-label="Filter holidays" className="mt-4 flex flex-wrap items-center gap-2 md:mt-0">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={filter === item.key}
                onClick={() => setFilter(item.key)}
                className={`flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold transition-colors ${
                  filter === item.key
                    ? "bg-copper text-petal"
                    : "bg-card text-moss ring-1 ring-inset ring-hairline hover:ring-copper/40 hover:text-ink"
                }`}
              >
                {item.dotClass && (
                  <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`} />
                )}
                {item.label}
                <span className="text-[13px] font-bold tabular-nums opacity-70">
                  {upcoming.filter((holiday) => matchesFilter(holiday, item.key)).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {filtered.map((holiday) => (
            <HolidayCard
              key={`${holiday.startDate}-${holiday.title}`}
              holiday={holiday}
              today={today}
            />
          ))}
        </div>

        {filtered.length === 0 && <EmptyState message="No upcoming holidays match this filter." />}
      </section>

      <aside className="pt-1 lg:sticky lg:top-24">
        <HelpfulToday today={today} faqs={featuredFaqs} contacts={contacts} />
      </aside>
    </div>
  );
}
