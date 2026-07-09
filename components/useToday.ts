"use client";

import { useEffect, useState } from "react";
import { APP_TIME_ZONE, msUntilNextLocalDate, todayISO } from "@/lib/dates";

export function useToday(timeZone = APP_TIME_ZONE): string | null {
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    function refreshToday() {
      setToday((current) => {
        const next = todayISO(new Date(), timeZone);
        return current === next ? current : next;
      });
    }

    function scheduleNextRefresh() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        refreshToday();
        scheduleNextRefresh();
      }, msUntilNextLocalDate(new Date(), timeZone) + 1_000);
    }

    function refreshAndReschedule() {
      refreshToday();
      scheduleNextRefresh();
    }

    function refreshWhenVisible() {
      if (!document.hidden) refreshAndReschedule();
    }

    refreshAndReschedule();
    window.addEventListener("focus", refreshAndReschedule);
    window.addEventListener("pageshow", refreshAndReschedule);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refreshAndReschedule);
      window.removeEventListener("pageshow", refreshAndReschedule);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [timeZone]);

  return today;
}
