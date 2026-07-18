"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { VisitDay } from "@/lib/schema";
import { upcomingVisitDays } from "@/lib/lookup";
import { useToday } from "@/components/useToday";

function daysUntil(from: string, to: string): number {
  const fromMs = new Date(`${from}T12:00:00Z`).getTime();
  const toMs = new Date(`${to}T12:00:00Z`).getTime();
  return Math.ceil((toMs - fromMs) / 86_400_000);
}

function relativeLabel(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function shortMonth(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" })
    .format(new Date(`${iso}T12:00:00Z`));
}

function startDateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric",
  }).format(new Date(`${iso}T12:00:00Z`));
}

export default function VisitNotifications({ visitDays }: { visitDays: VisitDay[] }) {
  const today = useToday();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const upcoming = today ? upcomingVisitDays(visitDays, today, 4) : [];
  const next = upcoming[0] ?? null;
  const nextInDays = today && next ? daysUntil(today, next.startDate) : null;
  const prominent = nextInDays !== null && nextInDays <= 30;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!today || !next) return null;

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-label="Show holiday notifications" aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
          prominent
            ? "border-copper bg-copper text-petal hover:bg-copper/90"
            : "border-hairline text-moss hover:bg-hairline hover:text-copper"
        }`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
          <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M9.5 20a2.5 2.5 0 0 0 5 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
        <span aria-hidden="true" className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ${
          prominent ? "bg-petal" : "bg-copper"
        }`} />
      </button>

      {open && (
        <section className="absolute -right-12 z-40 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-hairline bg-petal text-left shadow-[0_12px_24px_rgba(42,46,34,0.14)] sm:right-0">
          <div className="border-b border-hairline px-4 py-3">
            <h2 className="font-display text-2xl font-semibold leading-tight text-ink">Holiday Reminders</h2>
          </div>

          <div className="divide-y divide-hairline">
            {upcoming.map((day) => {
              const inDays = daysUntil(today, day.startDate);
              const soon = inDays <= 30;
              return (
                <article key={`${day.startDate}-${day.title}`}
                  className={`grid grid-cols-[4.25rem_minmax(0,1fr)] gap-3 px-4 py-3 ${
                    soon ? "bg-copper/10" : ""
                  }`}>
                  <div className={`flex h-16 flex-col items-center justify-center rounded-lg border text-center ${
                    soon ? "border-copper bg-card text-copper" : "border-hairline bg-card text-moss"
                  }`}>
                    <span className="text-[12px] font-bold uppercase leading-none">{shortMonth(day.startDate)}</span>
                    <span className="mt-1 text-2xl font-semibold leading-none tabular-nums">{Number(day.startDate.slice(8))}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 font-semibold leading-tight text-ink">{day.title}</h3>
                      <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[13px] font-bold ${
                        soon ? "bg-copper text-petal" : "bg-hairline text-moss"
                      }`}>
                      {relativeLabel(inDays)}
                      </span>
                    </div>
                    <p className="mt-1 leading-snug text-moss">{startDateLabel(day.startDate)}</p>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="border-t border-hairline px-4 py-3">
            <Link href="/visits" onClick={() => setOpen(false)}
              className="flex items-center justify-between font-semibold text-copper hover:text-ink">
              <span>All holidays</span>
              <span aria-hidden="true" className="text-xl leading-none">›</span>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
