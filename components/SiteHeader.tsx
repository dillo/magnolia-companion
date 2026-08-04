"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Holiday } from "@/lib/schema";
import MagnoliaLogo from "@/components/MagnoliaLogo";
import Notifications from "@/components/Notifications";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Full menu" },
  { href: "/medications", label: "Medications" },
  { href: "/contacts", label: "Directory" },
  { href: "/calendar", label: "Calendar" },
  { href: "/explore", label: "Explore" },
  { href: "/holidays", label: "Holidays" },
  { href: "/faq", label: "FAQ" },
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
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 sm:gap-x-4">
          <MagnoliaLogo />

          <div className="hidden items-center gap-3 lg:flex lg:flex-wrap lg:justify-end">
            <nav aria-label="Main" className="flex flex-wrap items-center justify-end gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-label={n.href === "/medications" ? n.label : undefined}
                  aria-current={pathname === n.href ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-center font-semibold xl:px-4 ${
                    pathname === n.href
                      ? "bg-copper text-petal"
                      : "text-moss hover:bg-hairline hover:text-ink"
                  }`}
                >
                  {n.href === "/medications" ? (
                    <>
                      <span className="xl:hidden">Meds</span>
                      <span className="hidden xl:inline">Medications</span>
                    </>
                  ) : n.label}
                </Link>
              ))}
            </nav>
            <Notifications holidays={holidays} />
          </div>

          <div className="lg:hidden">
            <Notifications holidays={holidays} />
          </div>
        </div>
      </div>
    </header>
  );
}
