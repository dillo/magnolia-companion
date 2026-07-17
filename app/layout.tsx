import type { Metadata } from "next";
import "./globals.css";
import AccessibilityControl from "@/components/AccessibilityControl";
import MagnoliaLogo from "@/components/MagnoliaLogo";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "Magnolia Companion",
  description: "Today's activities and meals at Magnolia Place of Roswell.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <div className="mx-auto max-w-6xl px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <MagnoliaLogo />
            <NavLinks />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-16">{children}</main>
        <AccessibilityControl />
      </body>
    </html>
  );
}
