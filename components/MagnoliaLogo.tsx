import Link from "next/link";

export default function MagnoliaLogo() {
  return (
    <Link
      href="/"
      aria-label="Magnolia Companion home"
      className="group flex items-center justify-start gap-3 text-left"
    >
      <span className="relative grid h-9 w-9 shrink-0 place-items-center text-petal">
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-9 w-9 drop-shadow-sm">
          <g fill="currentColor" stroke="var(--color-ink)" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M24 5.5c3.7 4.1 5.3 8.1 4.9 12.1-.3 3-2 5.3-4.9 6.9-2.9-1.6-4.6-3.9-4.9-6.9-.4-4 1.2-8 4.9-12.1Z" />
            <path d="M10.2 13.2c5.4.7 9.2 2.8 11.3 6.2 1.6 2.6 1.8 5.4.5 8.4-3.2.4-5.9-.4-8.1-2.4-3-2.7-4.2-6.7-3.7-12.2Z" />
            <path d="M37.8 13.2c.5 5.5-.7 9.5-3.7 12.2-2.2 2-4.9 2.8-8.1 2.4-1.3-3-1.1-5.8.5-8.4 2.1-3.4 5.9-5.5 11.3-6.2Z" />
            <path d="M13.9 35.6c1.8-5.2 4.5-8.4 8.2-9.7 2.9-1 5.6-.5 8.1 1.6-.4 3.2-1.9 5.6-4.5 7.1-3.5 2-7.4 2.3-11.8 1Z" />
          </g>
          <circle cx="24" cy="25.5" r="5.2" fill="var(--color-copper)" />
          <circle cx="24" cy="25.5" r="2.2" fill="var(--color-petal)" />
        </svg>
      </span>
      <span className="font-display text-[1.35rem] font-semibold leading-tight group-hover:text-copper">
        Magnolia Companion
      </span>
    </Link>
  );
}
