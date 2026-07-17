"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV = [
  { href: "/", label: "Activities" },
  { href: "/menu", label: "Menu" },
  { href: "/calendar", label: "Calendar" },
  { href: "/visits", label: "Visits" },
  { href: "/faq", label: "FAQ" },
];

export default function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
    <nav aria-label="Main" className="relative sm:mt-0">
      <div ref={rootRef} className="sm:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-main-nav"
          aria-label="Open main menu"
          onClick={() => setOpen((value) => !value)}
          className="grid h-10 w-10 place-items-center rounded-full bg-hairline/60 text-ink hover:bg-hairline"
        >
          <span aria-hidden="true" className="grid gap-1">
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
          </span>
        </button>
        {open && (
          <div
            id="mobile-main-nav"
            className="absolute right-0 z-20 mt-3 w-56 overflow-hidden rounded-lg border border-hairline bg-petal shadow-[0_12px_24px_rgba(42,46,34,0.14)]"
          >
            {NAV.map((n) => (
              <NavLink
                key={n.href}
                href={n.href}
                label={n.label}
                active={pathname === n.href}
                mobile
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="hidden items-center justify-end gap-2 sm:flex">
        {NAV.map((n) => (
          <NavLink key={n.href} href={n.href} label={n.label} active={pathname === n.href} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  active,
  mobile = false,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`whitespace-nowrap font-semibold ${
        mobile
          ? `flex items-center justify-between border-b border-hairline px-4 py-3 last:border-b-0 ${
              active ? "bg-ink text-petal" : "text-moss hover:bg-hairline/60 hover:text-ink"
            }`
          : `rounded-full px-4 py-2 text-center ${
              active ? "bg-ink text-petal" : "text-moss hover:bg-hairline hover:text-ink"
            }`
      }`}
    >
      <span>{label}</span>
      {mobile && (
        <span aria-hidden="true" className={active ? "text-petal" : "text-copper"}>
          ›
        </span>
      )}
    </Link>
  );
}
