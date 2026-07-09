import type { Metadata } from "next";
import "./globals.css";
import TextSizeControl from "@/components/TextSizeControl";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "Magnolia Place of Roswell — Daily Companion",
  description: "Today's activities and meals at Magnolia Place of Roswell.",
};

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
          <div className="mx-auto max-w-6xl px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <div className="whitespace-nowrap text-center font-display text-[1.35rem] leading-tight">
                <span className="font-semibold">Magnolia Companion</span>
              </div>
              <TextSizeControl />
            </div>
            <NavLinks />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-16">{children}</main>
      </body>
    </html>
  );
}
