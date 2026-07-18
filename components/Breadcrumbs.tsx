"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Activities",
  "/menu": "Menu",
  "/calendar": "Calendar",
  "/visits": "Holidays",
  "/faq": "FAQ",
};

const ROUTE_WIDTHS: Record<string, string> = {
  "/": "max-w-5xl",
  "/menu": "max-w-5xl",
  "/calendar": "max-w-6xl",
  "/visits": "max-w-4xl",
  "/faq": "max-w-5xl",
};

type Crumb = {
  href: string;
  label: string;
};

function titleFromSegment(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function crumbsForPath(pathname: string): Crumb[] {
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  if (normalizedPath === "/") return [{ href: "/", label: ROUTE_LABELS["/"] }];

  const segments = normalizedPath.split("/").filter(Boolean);
  return [
    { href: "/", label: ROUTE_LABELS["/"] },
    ...segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        href,
        label: ROUTE_LABELS[href] ?? titleFromSegment(decodeURIComponent(segment)),
      };
    }),
  ];
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = crumbsForPath(pathname);
  const widthClass = ROUTE_WIDTHS[pathname] ?? "max-w-5xl";

  return (
    <nav aria-label="Breadcrumb" className={`mx-auto mb-4 hidden ${widthClass} sm:block`}>
      <ol className="flex items-center gap-2 text-sm font-semibold text-moss">
        {crumbs.map((crumb, index) => {
          const isCurrent = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex min-w-0 items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-copper">
                  ›
                </span>
              )}
              {isCurrent ? (
                <span aria-current="page" className="truncate text-ink">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="truncate underline-offset-4 hover:text-ink hover:underline">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
