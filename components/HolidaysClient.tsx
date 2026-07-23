"use client";

import { useMemo, useState } from "react";
import type { FeaturedFaq } from "@/lib/faqs";
import type { Contact, Holiday, HolidayType } from "@/lib/schema";
import { upcomingHolidays } from "@/lib/lookup";
import Breadcrumbs from "@/components/Breadcrumbs";
import HelpfulToday from "@/components/HelpfulToday";
import { useToday } from "@/components/useToday";
import { HolidayCard } from "@/components/Holidays";
import EmptyState from "@/components/EmptyState";

const FILTERS: { key: HolidayType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "family", label: "Family" },
  { key: "federal", label: "Federal" },
];

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
  const [filter, setFilter] = useState<HolidayType | "all">("all");

  const filtered = useMemo(() => {
    const upcoming = today ? upcomingHolidays(holidays, today) : holidays;
    return filter === "all" ? upcoming : upcoming.filter((holiday) => holiday.type === filter);
  }, [filter, holidays, today]);

  if (!today) return null;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
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
