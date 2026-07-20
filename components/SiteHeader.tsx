"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { VisitDay } from "@/lib/schema";
import MagnoliaLogo from "@/components/MagnoliaLogo";
import VisitNotifications from "@/components/VisitNotifications";

const NAV = [
  { href: "/", label: "Activities" },
  { href: "/menu", label: "Meals" },
  { href: "/calendar", label: "Calendar" },
  { href: "/explore", label: "Explore" },
  { href: "/visits", label: "Holidays" },
  { href: "/faq", label: "FAQ" },
];

export default function SiteHeader({ visitDays }: { visitDays: VisitDay[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  return (
    <header
      ref={rootRef}
      className={`sticky top-0 z-30 border-b border-hairline bg-petal/90 backdrop-blur ${
        scrolled ? "shadow-[0_10px_24px_rgba(42,46,34,0.08)]" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <MagnoliaLogo />

          <div className="hidden items-center gap-4 lg:flex">
            <nav aria-label="Main" className="flex items-center gap-2">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={pathname === n.href ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-center font-semibold ${
                    pathname === n.href
                      ? "bg-copper text-petal"
                      : "text-moss hover:bg-hairline hover:text-ink"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <VisitNotifications visitDays={visitDays} />
          </div>

          <div className="flex items-center gap-1.5 lg:hidden">
            <VisitNotifications visitDays={visitDays} />
            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-main-nav"
              onClick={() => setOpen((value) => !value)}
              className="flex h-10 shrink-0 items-center gap-1 rounded-full bg-hairline/60 pl-2 pr-2.5 font-semibold text-ink hover:bg-hairline"
            >
              <span aria-hidden="true" className="grid gap-1">
                <span className="block h-0.5 w-4.5 rounded-full bg-current" />
                <span className="block h-0.5 w-4.5 rounded-full bg-current" />
                <span className="block h-0.5 w-4.5 rounded-full bg-current" />
              </span>
              Menu
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-main-nav"
          aria-label="Main"
          className="absolute inset-x-0 top-full border-b border-hairline bg-card shadow-[0_16px_32px_rgba(42,46,34,0.16)] lg:hidden"
        >
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between border-b border-hairline px-6 py-4 text-lg font-semibold last:border-b-0 ${
                  active ? "bg-copper text-petal" : "text-ink hover:bg-hairline/60"
                }`}
              >
                <span>{n.label}</span>
                <span aria-hidden="true" className={active ? "text-petal" : "text-copper"}>
                  ›
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
