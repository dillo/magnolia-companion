"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Holiday } from "@/lib/schema";
import {
  dayNameOfISO,
  daysUntil,
  longDateOfISO,
  relativeDayLabel,
  shortMonthOfISO,
} from "@/lib/dates";
import { upcomingHolidays } from "@/lib/lookup";
import {
  medicationRefillReminderFor,
  rentDueStatusLabel,
} from "@/lib/reminders";
import { useToday } from "@/components/useToday";
import { useRentReminder } from "@/components/useRentReminder";

function startDateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric",
  }).format(new Date(`${iso}T12:00:00Z`));
}

export default function Notifications({ holidays }: { holidays: Holiday[] }) {
  const panelId = useId();
  const titleId = useId();
  const today = useToday();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const nextHoliday = today ? upcomingHolidays(holidays, today, 1)[0] ?? null : null;
  const { reminder: rentReminder } = useRentReminder(today ?? "");
  const medicationRefillReminder = today ? medicationRefillReminderFor(today) : null;
  const holidayInDays = today && nextHoliday ? daysUntil(today, nextHoliday.startDate) : null;
  const holidaySoon = holidayInDays !== null && holidayInDays <= 30;
  const prominent = medicationRefillReminder !== null || rentReminder !== null || holidaySoon;
  const notificationCount = Number(medicationRefillReminder !== null) + Number(rentReminder !== null) + Number(nextHoliday !== null);

  const closeNotifications = useCallback((restoreFocus = true) => {
    setOpen(false);
    setAnchor(null);
    if (restoreFocus) window.requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    function updateAnchor() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setAnchor({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
    }
    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    return () => window.removeEventListener("resize", updateAnchor);
  }, [closeNotifications, open]);

  useEffect(() => {
    if (open && anchor) closeButtonRef.current?.focus();
  }, [anchor, open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closeNotifications(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeNotifications();
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeNotifications, open]);

  if (!today || (!nextHoliday && !rentReminder && !medicationRefillReminder)) return null;

  function trapDialogFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <div ref={rootRef} className="relative">
        <button ref={buttonRef} type="button"
          aria-label={`${open ? "Hide" : "Show"} notifications, ${notificationCount} ${notificationCount === 1 ? "item" : "items"}`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => open ? closeNotifications(false) : setOpen(true)}
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${prominent
              ? "bg-copper text-petal hover:bg-copper/90"
              : "bg-hairline/60 text-ink hover:bg-hairline hover:text-copper"
            }`}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d="M9.5 20a2.5 2.5 0 0 0 5 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          </svg>
          <span aria-hidden="true" className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ${prominent ? "bg-petal" : "bg-copper"
            }`} />
        </button>
      </div>

      {open &&
        anchor &&
        createPortal(
          <>
            <div
              aria-hidden="true"
              onClick={() => closeNotifications()}
              className="fixed inset-0 z-[41] bg-ink/55"
            />
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onKeyDown={trapDialogFocus}
              style={{
                top: anchor.top,
                right: anchor.right,
                maxHeight: `calc(100dvh - ${anchor.top + 16}px)`,
              }}
              className="fixed z-[42] w-[min(24rem,calc(100vw-2rem))]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 right-3 z-10 h-4 w-4 rotate-45 border-l border-t border-hairline bg-sand"
              />
              <section className="relative max-h-[inherit] overflow-y-auto rounded-xl border border-hairline bg-card text-left shadow-[0_12px_24px_rgba(42,46,34,0.14)]">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-hairline bg-sand px-4 py-2.5">
                  <h2 id={titleId} className="font-display text-2xl font-semibold leading-tight text-ink">Notifications</h2>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => closeNotifications()}
                    className="grid min-h-11 min-w-11 place-items-center rounded-full border border-hairline bg-card text-2xl leading-none text-copper hover:bg-petal"
                  >
                    ×
                  </button>
                </div>

                <div className="divide-y divide-hairline">
                  {medicationRefillReminder && (
                    <article className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 bg-copper/10 px-4 py-2">
                      <div
                        aria-hidden="true"
                        className="grid h-11 place-items-center rounded-lg bg-copper text-petal"
                      >
                        <MedicationRefillIcon />
                      </div>
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <h3 className="min-w-0 font-semibold leading-tight text-ink">
                          Refill pill box
                        </h3>
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-copper px-2 py-0.5 text-[13px] font-bold text-petal">
                          Weekend task
                        </span>
                      </div>
                    </article>
                  )}

                  {rentReminder && (
                    <article className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-3 bg-copper/10 px-4 py-3">
                      <div className="flex h-16 flex-col items-center justify-center rounded-lg bg-copper text-center text-petal">
                        <span className="text-[13px] font-bold uppercase leading-none">
                          {shortMonthOfISO(rentReminder.dueDate)}
                        </span>
                        <span className="mt-1 text-2xl font-semibold leading-none tabular-nums">1</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="min-w-0 font-semibold leading-tight text-ink">Rent payment</h3>
                          <span className="shrink-0 whitespace-nowrap rounded-full bg-copper px-2 py-0.5 text-[13px] font-bold text-petal">
                            {rentDueStatusLabel(rentReminder.daysUntilDue)}
                          </span>
                        </div>
                        <p className="mt-1 leading-snug text-moss">
                          {rentReminder.daysUntilDue >= 0 ? "Due" : "Was due"}{" "}
                          {dayNameOfISO(rentReminder.dueDate)}, {longDateOfISO(rentReminder.dueDate)}
                        </p>
                      </div>
                    </article>
                  )}

                  {nextHoliday && holidayInDays !== null && (
                    <article
                      className={`grid grid-cols-[4.25rem_minmax(0,1fr)] gap-3 px-4 py-3 ${holidaySoon ? "bg-copper/10" : ""
                        }`}
                    >
                      <div className={`flex h-16 flex-col items-center justify-center rounded-lg text-center ${holidaySoon ? "bg-copper text-petal" : "border border-hairline bg-sand text-moss"
                        }`}>
                        <span className="text-[13px] font-bold uppercase leading-none">
                          {shortMonthOfISO(nextHoliday.startDate)}
                        </span>
                        <span className="mt-1 text-2xl font-semibold leading-none tabular-nums">
                          {Number(nextHoliday.startDate.slice(8))}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="min-w-0 font-semibold leading-tight text-ink">{nextHoliday.title}</h3>
                          <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[13px] font-bold ${holidaySoon ? "bg-copper text-petal" : "bg-hairline/60 text-moss"
                            }`}>
                            {relativeDayLabel(holidayInDays)}
                          </span>
                        </div>
                        <p className="mt-1 leading-snug text-moss">{startDateLabel(nextHoliday.startDate)}</p>
                      </div>
                    </article>
                  )}
                </div>
                {nextHoliday && (
                  <div className="divide-y divide-hairline border-t border-hairline">
                    <Link href="/holidays" onClick={() => setOpen(false)}
                      className="flex items-center justify-between px-4 py-3 font-semibold text-copper hover:text-ink">
                      <span>All holidays</span>
                      <span aria-hidden="true" className="text-xl leading-none">›</span>
                    </Link>
                  </div>
                )}
              </section>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function MedicationRefillIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <rect
        x="3"
        y="5"
        width="18"
        height="15"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M3 10h18M9 10v10M15 10v10" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="7.5" r="1" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
      <circle cx="18" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}
