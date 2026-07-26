"use client";

import { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import MagnoliaFlourish from "@/components/MagnoliaFlourish";
import {
  MEDICATION_DAYS,
  MEDICATION_PERIODS,
  type Medication,
  type MedicationDay,
  type MedicationDose,
  type MedicationPeriod,
  type MedicationsDirectory,
} from "@/lib/schema";

const PERIOD_META: Record<MedicationPeriod, { label: string; description: string }> = {
  morning: { label: "Morning", description: "Start the day" },
  evening: { label: "Evening", description: "End-of-day routine" },
};

const DAY_LABELS: Record<MedicationDay, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const WEEKDAYS: MedicationDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const WEEKEND: MedicationDay[] = ["saturday", "sunday"];
const MONDAY_WEDNESDAY_FRIDAY: MedicationDay[] = ["monday", "wednesday", "friday"];

function hasSameDays(days: MedicationDay[], expected: MedicationDay[]) {
  return days.length === expected.length && expected.every((day) => days.includes(day));
}

function scheduleLabel(days: MedicationDay[]) {
  if (hasSameDays(days, [...MEDICATION_DAYS])) return "Every day";
  if (hasSameDays(days, WEEKDAYS)) return "Monday–Friday";
  if (hasSameDays(days, WEEKEND)) return "Saturday & Sunday";
  if (hasSameDays(days, MONDAY_WEDNESDAY_FRIDAY)) return "Monday, Wednesday & Friday only";

  const labels = MEDICATION_DAYS
    .filter((day) => days.includes(day))
    .map((day) => DAY_LABELS[day]);
  if (labels.length === 1) return `${labels[0]} only`;
  return `${labels.slice(0, -1).join(", ")} & ${labels.at(-1)} only`;
}

function isDaily(dose: MedicationDose) {
  return hasSameDays(dose.days, [...MEDICATION_DAYS]);
}

function dosesFor(medication: Medication, period: MedicationPeriod) {
  return medication.doses.filter((dose) => dose.period === period);
}

export default function MedicationsClient({ directory }: { directory: MedicationsDirectory }) {
  const [period, setPeriod] = useState<MedicationPeriod>("morning");
  const medications = directory.medications;
  const scheduled = medications.filter((medication) => dosesFor(medication, period).length > 0);

  return (
    <div className="mx-auto max-w-5xl">
      <Breadcrumbs />

      <div
        role="tablist"
        aria-label="Medication routines"
        aria-orientation="horizontal"
        className="grid grid-cols-2 border-b-2 border-hairline"
      >
        {MEDICATION_PERIODS.map((item, index) => {
          const selected = period === item;
          const meta = PERIOD_META[item];
          return (
            <button
              key={item}
              id={`medication-tab-${item}`}
              type="button"
              role="tab"
              aria-label={meta.label}
              aria-selected={selected}
              aria-controls={`medication-panel-${item}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setPeriod(item)}
              onKeyDown={(event) => {
                let nextIndex: number | null = null;
                if (event.key === "ArrowRight") nextIndex = (index + 1) % MEDICATION_PERIODS.length;
                if (event.key === "ArrowLeft") {
                  nextIndex = (index - 1 + MEDICATION_PERIODS.length) % MEDICATION_PERIODS.length;
                }
                if (event.key === "Home") nextIndex = 0;
                if (event.key === "End") nextIndex = MEDICATION_PERIODS.length - 1;
                if (nextIndex === null) return;
                event.preventDefault();
                const next = MEDICATION_PERIODS[nextIndex];
                setPeriod(next);
                document.getElementById(`medication-tab-${next}`)?.focus();
              }}
              className={`group relative min-h-20 px-3 py-3 text-left transition-colors sm:px-5 ${
                index === 1 ? "border-l border-hairline" : ""
              } ${selected ? "bg-card/55 text-ink" : "text-moss hover:bg-sand/60 hover:text-ink"}`}
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors ${
                    selected ? "bg-copper text-petal" : "bg-sand text-moss group-hover:text-ink"
                  }`}
                >
                  <PeriodIcon period={item} />
                </span>
                <span className="min-w-0">
                  <span className={`block font-display text-xl font-semibold ${selected ? "text-copper" : ""}`}>
                    {meta.label}
                  </span>
                  <span className="mt-0.5 block text-[14px] leading-snug">{meta.description}</span>
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

      {MEDICATION_PERIODS.map((item) => {
        const selected = item === period;
        if (!selected) {
          return (
            <div
              key={item}
              id={`medication-panel-${item}`}
              role="tabpanel"
              aria-labelledby={`medication-tab-${item}`}
              hidden
            />
          );
        }

        return (
          <section
            key={item}
            id={`medication-panel-${item}`}
            role="tabpanel"
            aria-labelledby={`medication-tab-${item}`}
            className="pt-6"
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
              <div className="min-w-0">
                <p className="text-moss">Daily medication routine</p>
                <h1 className="font-display text-title font-semibold">
                  {PERIOD_META[item].label} medications
                </h1>
                <p className="mt-1.5 flex items-center gap-2 font-display text-xl italic text-copper">
                  <MagnoliaFlourish className="h-5 w-5 shrink-0" />
                  {scheduled.length} {scheduled.length === 1 ? "medication" : "medications"} scheduled
                </p>

                {scheduled.length === 0 ? (
                  <div className="mt-5">
                    <EmptyState message={`No ${item} medications have been added.`} />
                  </div>
                ) : (
                  <ol className="mt-5 space-y-3">
                    {scheduled.map((medication, index) => (
                      <RoutineMedication
                        key={medication.id}
                        medication={medication}
                        period={item}
                        index={index + 1}
                      />
                    ))}
                  </ol>
                )}
              </div>

              <aside className="lg:sticky lg:top-24">
                <RoutineNote />
              </aside>
            </div>
          </section>
        );
      })}

      <section id="all-medications" aria-labelledby="all-medications-title" className="mt-12 border-t border-hairline pt-8">
        <div className="max-w-2xl">
          <p className="font-semibold uppercase tracking-wide text-copper">Complete reference</p>
          <h2 id="all-medications-title" className="mt-1 font-display text-3xl font-semibold">
            All medications
          </h2>
          <p className="mt-2 text-moss">
            Every medication in the current routine, with its dose, timing, and purpose.
          </p>
        </div>

        {medications.length === 0 ? (
          <div className="mt-6">
            <EmptyState message="No medications have been added yet." />
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {medications.map((medication) => (
              <MedicationDirectoryCard key={medication.id} medication={medication} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RoutineMedication({
  medication,
  period,
  index,
}: {
  medication: Medication;
  period: MedicationPeriod;
  index: number;
}) {
  const doses = dosesFor(medication, period);
  const hasSpecialSchedule = doses.some((dose) => !isDaily(dose));

  return (
    <li className="medication-label relative overflow-hidden rounded-xl border border-hairline bg-card shadow-sm">
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-copper" />
      {hasSpecialSchedule && (
        <span className="absolute right-0 top-0 rounded-bl-lg bg-copper px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-petal">
          Special schedule
        </span>
      )}
      <div className={`flex gap-4 px-5 py-5 ${hasSpecialSchedule ? "pt-10 sm:pt-5 sm:pr-36" : ""}`}>
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sand font-display text-xl font-semibold text-copper"
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-semibold leading-tight">{medication.name}</h2>
          <p className="mt-1 text-moss">{medication.purpose}</p>
          <div className="mt-3 space-y-2">
            {doses.map((dose) => (
              <DoseLine key={`${dose.amount}-${dose.days.join("-")}`} dose={dose} />
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

function DoseLine({ dose }: { dose: MedicationDose }) {
  const daily = isDaily(dose);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-lg font-bold tabular-nums text-ink">{dose.amount}</span>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-bold ${
          daily ? "bg-sand text-moss" : "bg-copper text-petal"
        }`}
      >
        {!daily && <CalendarMiniIcon />}
        {scheduleLabel(dose.days)}
      </span>
    </div>
  );
}

function MedicationDirectoryCard({ medication }: { medication: Medication }) {
  return (
    <li className="rounded-xl border border-hairline bg-card px-5 py-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand text-copper">
          <PillIcon />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold leading-snug">{medication.name}</h3>
          <p className="mt-0.5 text-copper">{medication.purpose}</p>
        </div>
      </div>
      <dl className="mt-4 space-y-3 border-t border-hairline pt-3">
        {medication.doses.map((dose) => (
          <div key={`${dose.period}-${dose.amount}-${dose.days.join("-")}`} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
            <dt className="flex items-center gap-1.5 font-semibold capitalize text-moss">
              <PeriodIcon period={dose.period} className="h-4 w-4" />
              {dose.period}
            </dt>
            <dd>
              <span className="font-bold tabular-nums text-ink">{dose.amount}</span>
              <span className={`ml-2 text-[14px] ${isDaily(dose) ? "text-moss" : "font-bold text-copper"}`}>
                {scheduleLabel(dose.days)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

function RoutineNote() {
  return (
    <div role="note" className="rounded-xl border border-copper/30 bg-copper/5 px-5 py-5">
      <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-copper text-petal">
        <PillIcon />
      </span>
      <h2 className="mt-3 font-display text-xl font-semibold">Use the current instructions</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-moss">
        This page is a routine reference. If it differs from the medication label or care team’s instructions,
        pause and ask the care team before taking anything.
      </p>
      <a
        href="#all-medications"
        className="mt-4 inline-block font-semibold text-copper underline-offset-4 hover:underline"
      >
        See the complete list
      </a>
    </div>
  );
}

function PeriodIcon({
  period,
  className = "h-5 w-5",
}: {
  period: MedicationPeriod;
  className?: string;
}) {
  if (period === "evening") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
        <path
          d="M20 15.2A8 8 0 0 1 8.8 4a8.1 8.1 0 1 0 11.2 11.2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PillIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="m8.2 17.6 9.4-9.4a3.5 3.5 0 0 0-5-5l-9.4 9.4a3.5 3.5 0 0 0 5 5ZM8 8l8 8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CalendarMiniIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
      <rect x="2" y="3.5" width="12" height="10.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7h12M5 2v3M11 2v3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}
