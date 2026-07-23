"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Holiday } from "@/lib/schema";
import MagnoliaLogo from "@/components/MagnoliaLogo";
import HolidayNotifications from "@/components/HolidayNotifications";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Full menu" },
  { href: "/calendar", label: "Calendar" },
  { href: "/explore", label: "Explore" },
  { href: "/holidays", label: "Holidays" },
  { href: "/faq", label: "FAQ" },
  { href: "/contacts", label: "Directory" },
];

/** Sticky site header: wordmark + desktop nav + holiday bell. Mobile navigation lives in BottomNav. */
export default function SiteHeader({ holidays }: { holidays: Holiday[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b border-hairline bg-sand/90 backdrop-blur ${
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
            <HolidayNotifications holidays={holidays} />
          </div>

          <div className="lg:hidden">
            <HolidayNotifications holidays={holidays} />
          </div>
        </div>
      </div>
    </header>
  );
}
