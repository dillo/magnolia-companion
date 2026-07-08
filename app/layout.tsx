import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import TextSizeControl from "@/components/TextSizeControl";

export const metadata: Metadata = {
  title: "Magnolia Place of Roswell — Daily Companion",
  description: "Today's activities and meals at Magnolia Place of Roswell.",
};

const NAV = [
  { href: "/", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/menu", label: "Menu" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-petal text-ink antialiased">
        <script
          // restore saved text size before first paint
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem("mc-textsize");if(s)document.documentElement.dataset.textsize=s}catch(e){}`,
          }}
        />
        <header className="border-b border-hairline">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="font-display">
              <span className="font-semibold">Magnolia Place</span>{" "}
              <span className="text-moss">of Roswell</span>
            </div>
            <TextSizeControl />
            <nav aria-label="Main" className="flex w-full justify-around gap-1 sm:w-auto sm:justify-end sm:gap-2">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}
                  className="rounded-full px-4 py-2 font-semibold text-moss hover:bg-hairline hover:text-ink">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6 pb-16">{children}</main>
      </body>
    </html>
  );
}
