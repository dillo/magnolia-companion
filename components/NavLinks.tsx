"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/menu", label: "Menu" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex w-full justify-around gap-1 sm:w-auto sm:justify-end sm:gap-2">
      {NAV.map((n) => {
        const active = pathname === n.href;
        return (
          <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 font-semibold ${
              active ? "bg-ink text-petal" : "text-moss hover:bg-hairline hover:text-ink"
            }`}>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
