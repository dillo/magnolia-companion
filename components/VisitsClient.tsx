"use client";

import { useMemo, useState } from "react";
import type { ActivityMonth, VisitDay, VisitDayType } from "@/lib/schema";
import { findActivityDay, upcomingVisitDays } from "@/lib/lookup";
import Breadcrumbs from "@/components/Breadcrumbs";
import TodayActivitiesSummary from "@/components/TodayActivitiesSummary";
import { useToday } from "@/components/useToday";
import { VisitDayCard } from "@/components/VisitDays";
import EmptyState from "@/components/EmptyState";

const FILTERS: { key: VisitDayType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "family", label: "Family" },
  { key: "federal", label: "Federal" },
];

export default function VisitsClient({
  months,
  visitDays,
}: {
  months: ActivityMonth[];
  visitDays: VisitDay[];
}) {
  const today = useToday();
  const [filter, setFilter] = useState<VisitDayType | "all">("all");

  const filtered = useMemo(() => {
    const days = today ? upcomingVisitDays(visitDays, today) : visitDays;
    return filter === "all" ? days : days.filter((day) => day.type === filter);
  }, [filter, today, visitDays]);

  if (!today) return null;

  const todayActivities = findActivityDay(months, today);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <section className="min-w-0">
        <Breadcrumbs />
        <div className="md:flex md:items-end md:justify-between md:gap-6">
          <div>
            <h1 className="font-display text-title font-semibold">Holidays</h1>
          </div>
          <div role="tablist" aria-label="Holiday type" className="mt-4 inline-grid w-fit grid-cols-3 rounded-full bg-hairline/60 p-1 md:mt-0">
            {FILTERS.map((item) => (
              <button key={item.key} role="tab" aria-selected={filter === item.key} onClick={() => setFilter(item.key)}
                className={`whitespace-nowrap rounded-full px-2 py-2 text-center text-[15px] font-semibold sm:px-3 ${
                  filter === item.key ? "bg-copper text-petal" : "text-moss"
                }`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {filtered.map((day) => <VisitDayCard key={`${day.startDate}-${day.title}`} day={day} today={today} />)}
        </div>

        {filtered.length === 0 && <EmptyState message="No upcoming holidays match this filter." />}
      </section>

      <TodayActivitiesSummary day={todayActivities} today={today} />
    </div>
  );
}
