"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Activities" },
  { href: "/menu", label: "Menu" },
  { href: "/calendar", label: "Calendar" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="mt-3 inline-grid grid-cols-3 rounded-full bg-hairline/60 p-1 sm:mt-0 sm:flex sm:w-auto sm:justify-end sm:gap-2 sm:bg-transparent sm:p-0">
      {NAV.map((n) => {
        const active = pathname === n.href;
        return (
          <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
            className={`rounded-full px-2 py-2 text-center font-semibold sm:px-4 ${
              active ? "bg-ink text-petal" : "text-moss hover:bg-hairline hover:text-ink"
            }`}>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
