"use client";

import { useEffect, useState } from "react";
import { APP_TIME_ZONE } from "@/lib/dates";
import { clockHHMM } from "@/lib/now";

/** Current "HH:MM" in the app time zone at minute resolution; null until mounted. */
export function useNow(timeZone = APP_TIME_ZONE): string | null {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      setNow((current) => {
        const next = clockHHMM(new Date(), timeZone);
        return current === next ? current : next;
      });
    }

    refresh();
    const timer = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [timeZone]);

  return now;
}
