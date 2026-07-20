import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import AccessibilityControl from "@/components/AccessibilityControl";
import BottomNav from "@/components/BottomNav";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { loadVisitDays } from "@/lib/content";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Magnolia Companion",
  description:
    "An independent, unofficial companion for residents and families at Magnolia Place of Roswell.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const visitDays = loadVisitDays();

  return (
    <html lang="en" suppressHydrationWarning className={fraunces.variable}>
      <body className="min-h-screen bg-petal text-ink antialiased">
        <script
          // Restore saved display settings before first paint.
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement,s=localStorage.getItem("mc-textsize"),c=localStorage.getItem("mc-contrast"),m=localStorage.getItem("mc-reduced-motion");if(s)d.dataset.textsize=s;if(c)d.dataset.contrast=c;if(m)d.dataset.reducedMotion=m}catch(e){}`,
          }}
        />
        <SiteHeader visitDays={visitDays} />
        <main className="mx-auto max-w-6xl px-4 py-6 pb-12 lg:pb-16">
          {children}
        </main>
        <SiteFooter />
        <BottomNav />
        <AccessibilityControl />
      </body>
    </html>
  );
}
