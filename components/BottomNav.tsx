"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TABS = [
  { href: "/", label: "Home", icon: SunIcon },
  { href: "/menu", label: "Full menu", icon: MealIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/contacts", label: "Directory", icon: DirectoryIcon },
];

const MORE = [
  { href: "/explore", label: "Explore", icon: CompassIcon },
  { href: "/faq", label: "FAQ", icon: QuestionIcon },
  { href: "/holidays", label: "Holidays", icon: FlagIcon },
  { href: "/disclaimer", label: "About & Disclaimer", icon: InfoIcon },
];

const MORE_DISCOVERED_KEY = "mc-more-discovered";

function hasDiscoveredMore() {
  try {
    return localStorage.getItem(MORE_DISCOVERED_KEY) === "true";
  } catch {
    return false;
  }
}

function saveMoreDiscovered() {
  try {
    localStorage.setItem(MORE_DISCOVERED_KEY, "true");
  } catch {}
}

/** Fixed, always-visible mobile tab bar; hidden on desktop where the header nav takes over. */
export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [showMoreHint, setShowMoreHint] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const moreActive = MORE.some((m) => m.href === pathname);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- discovery state lives in localStorage, readable only after mount
    setShowMoreHint(!hasDiscoveredMore());
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setMoreOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  function markMoreDiscovered() {
    setShowMoreHint(false);
    saveMoreDiscovered();
  }

  function openMore() {
    markMoreDiscovered();
    setMoreOpen(true);
  }

  return (
    <>
      {moreOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMoreOpen(false)}
          className="fixed inset-0 z-[35] bg-ink/55 lg:hidden"
        />
      )}
      <nav
        ref={rootRef}
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-sand/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {moreOpen && (
          <div
            id="bottom-more-menu"
            className="absolute inset-x-0 bottom-full border-t border-hairline bg-card shadow-[0_-16px_32px_rgba(42,46,34,0.16)]"
          >
            {MORE.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center justify-between border-b border-hairline px-6 py-4 text-lg font-semibold last:border-b-0 ${
                    active ? "bg-copper text-petal" : "text-ink hover:bg-hairline/60"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span aria-hidden="true" className={active ? "text-petal" : "text-copper"}>
                      <Icon />
                    </span>
                    <span>{label}</span>
                  </span>
                  <span aria-hidden="true" className={active ? "text-petal" : "text-copper"}>
                    ›
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {showMoreHint && !moreOpen && (
          <div className="absolute right-20 bottom-[calc(100%+0.75rem)] w-[min(calc(100vw-6rem),18rem)] rounded-xl border border-hairline bg-card text-ink shadow-[0_12px_32px_rgba(42,46,34,0.2)]">
            <button
              type="button"
              onClick={openMore}
              className="block min-h-20 w-full rounded-xl px-4 py-3 text-left"
            >
              <span className="block pr-10 text-sm font-bold text-copper">
                Tap More for more pages
              </span>
              <span className="mt-0.5 block text-[15px] leading-snug text-moss">
                Explore, holidays, FAQ &amp; About
              </span>
            </button>
            <button
              type="button"
              aria-label="Dismiss More pages tip"
              onClick={markMoreDiscovered}
              className="absolute top-1.5 right-1.5 grid min-h-11 min-w-11 place-items-center rounded-full text-2xl leading-none text-copper hover:bg-hairline/60"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-5">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
                className={`flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-[13px] ${
                  active ? "font-bold text-copper" : "font-semibold text-moss"
                }`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-controls="bottom-more-menu"
            onClick={() => {
              if (!moreOpen) markMoreDiscovered();
              setMoreOpen((value) => !value);
            }}
            className={`flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-[13px] ${
              moreActive || moreOpen ? "font-bold text-copper" : "font-semibold text-moss"
            }`}
          >
            <MoreIcon />
            More
          </button>
        </div>
      </nav>
    </>
  );
}

const ICON = "h-6 w-6";
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={ICON}>
      <circle cx="12" cy="12" r="4" {...STROKE} />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" {...STROKE} />
    </svg>
  );
}

function MealIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={ICON}>
      <path d="M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3" {...STROKE} />
      <path d="M17 3c-1.7 1.5-2.5 3.5-2.5 6 0 2 1 3 2.5 3v9" {...STROKE} />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={ICON}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" {...STROKE} />
      <path d="M3.5 10h17M8 2.5V6M16 2.5V6" {...STROKE} />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={ICON}>
      <path d="M5.5 21V4" {...STROKE} />
      <path d="M5.5 5c4-2.2 7 1.8 12 0v9c-5 1.8-8-2.2-12 0" {...STROKE} />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={ICON}>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={ICON}>
      <circle cx="12" cy="12" r="9" {...STROKE} />
      <path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" {...STROKE} />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={ICON}>
      <path d="M20 11.5a8 8 0 0 1-8.5 8H6l-3 2v-5A8.5 8.5 0 1 1 20 11.5Z" {...STROKE} />
      <path d="M9.7 9a2.4 2.4 0 1 1 3.2 2.3c-.9.4-1.4 1-1.4 1.9M11.5 16h.01" {...STROKE} />
    </svg>
  );
}

function DirectoryIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={ICON}>
      <circle cx="9" cy="8" r="3" {...STROKE} />
      <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8V20" {...STROKE} />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={ICON}>
      <circle cx="12" cy="12" r="9" {...STROKE} />
      <path d="M12 11v6M12 7h.01" {...STROKE} />
    </svg>
  );
}
