import type { Metadata } from "next";
import "./globals.css";
import AccessibilityControl from "@/components/AccessibilityControl";
import MagnoliaLogo from "@/components/MagnoliaLogo";
import NavLinks from "@/components/NavLinks";
import VisitNotifications from "@/components/VisitNotifications";
import { loadVisitDays } from "@/lib/content";

export const metadata: Metadata = {
  title: "Magnolia Companion",
  description: "Today's activities and meals at Magnolia Place of Roswell.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const visitDays = loadVisitDays();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-petal text-ink antialiased">
        <script
          // Restore saved display settings before first paint.
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement,s=localStorage.getItem("mc-textsize"),c=localStorage.getItem("mc-contrast"),m=localStorage.getItem("mc-reduced-motion");if(s)d.dataset.textsize=s;if(c)d.dataset.contrast=c;if(m)d.dataset.reducedMotion=m}catch(e){}`,
          }}
        />
        <header className="border-b border-hairline">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <MagnoliaLogo />
              <div className="hidden items-center gap-4 lg:flex">
                <NavLinks />
                <VisitNotifications visitDays={visitDays} />
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <VisitNotifications visitDays={visitDays} />
                <NavLinks />
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-16">
          {children}
        </main>
        <AccessibilityControl />
      </body>
    </html>
  );
}
