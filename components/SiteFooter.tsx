import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-sand/60 print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-5 lg:py-5">
        <Link
          href="/disclaimer"
          className="font-semibold text-copper underline-offset-4 hover:text-ink hover:underline"
        >
          About &amp; Disclaimer
        </Link>
      </div>
    </footer>
  );
}
