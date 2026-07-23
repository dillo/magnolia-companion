"use client";

import { useEffect, useMemo, useState } from "react";
import MagnoliaFlourish from "@/components/MagnoliaFlourish";
import { faqSectionId, type FaqSection } from "@/lib/faqs";

export default function FaqClient({ sections }: { sections: FaqSection[] }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const visible = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: searching
            ? section.items.filter((item) =>
                `${item.question} ${item.answer}`.toLowerCase().includes(q))
            : section.items,
        }))
        .filter((section) => section.items.length > 0),
    [sections, q, searching],
  );

  const countOf = useMemo(() => {
    const map = new Map(visible.map((section) => [section.title, section.items.length]));
    return (section: FaqSection) => map.get(section.title) ?? 0;
  }, [visible]);

  const matchCount = visible.reduce((n, section) => n + section.items.length, 0);

  // Scroll-spy: highlight the topic currently in view (idle browsing only).
  useEffect(() => {
    if (searching) return;
    const headings = sections
      .map((section) => document.getElementById(faqSectionId(section.title)))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActiveId(hit.target.id);
      },
      { rootMargin: "-96px 0px -60% 0px" },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [sections, searching]);

  return (
    <>
      <div className="relative mt-5 max-w-md">
        <svg aria-hidden="true" viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-moss">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m16.5 16.5 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search the handbook"
          placeholder="Search the handbook…"
          className="w-full rounded-full border border-hairline bg-card py-3 pl-12 pr-5 font-semibold text-ink shadow-sm placeholder:font-normal placeholder:text-moss focus:border-copper/50"
        />
      </div>
      {searching && (
        <p className="mt-2 text-moss" role="status">
          {matchCount === 1 ? "1 answer matches" : `${matchCount} answers match`} &ldquo;{query.trim()}&rdquo;
        </p>
      )}

      {!searching && (
        <nav aria-label="FAQ topics" className="mt-5 flex flex-wrap gap-2 lg:hidden">
          {sections.map((section) => {
            const id = faqSectionId(section.title);
            const active = activeId === id;
            return (
              <a key={id} href={`#${id}`}
                className={`rounded-full border px-3 py-1.5 text-[15px] font-semibold ${
                  active ? "border-copper bg-copper text-petal" : "border-hairline bg-card text-copper"
                }`}>
                {section.title}
              </a>
            );
          })}
        </nav>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <h2 className="font-display text-2xl font-semibold">Topics</h2>
          <nav aria-label="FAQ topics" className="mt-3 space-y-1">
            {sections.map((section) => {
              const id = faqSectionId(section.title);
              const count = searching ? countOf(section) : section.items.length;
              const active = !searching && activeId === id;
              const empty = searching && count === 0;
              return (
                <a key={id} href={`#${id}`} aria-current={active ? "true" : undefined}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 font-semibold ${
                    active
                      ? "bg-sand text-ink"
                      : empty
                        ? "pointer-events-none text-moss/60"
                        : "text-copper hover:bg-hairline/40 hover:text-ink"
                  }`}>
                  <span>{section.title}</span>
                  <span className="text-[13px] font-bold tabular-nums text-moss">{count}</span>
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          {visible.map((section) => (
            <section key={section.title} id={faqSectionId(section.title)} className="scroll-mt-24">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold">{section.title}</h2>
                <span className="text-[15px] text-moss">
                  {section.items.length} {section.items.length === 1 ? "question" : "questions"}
                </span>
              </div>
              <div className="mt-3 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-card shadow-sm">
                {section.items.map((item) => (
                  <details key={item.question} className="group" open={searching || undefined}>
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 font-semibold text-ink marker:hidden hover:bg-hairline/20">
                      <span>{item.question}</span>
                      <svg aria-hidden="true" viewBox="0 0 24 24"
                        className="mt-0.5 h-5 w-5 shrink-0 text-copper transition-transform group-open:rotate-90">
                        <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                      </svg>
                    </summary>
                    <p className="faq-answer px-5 pb-4 leading-relaxed text-moss">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          {searching && visible.length === 0 && (
            <div className="rounded-xl border border-hairline bg-card px-6 py-10 text-center">
              <p className="text-xl text-moss">No answers match &ldquo;{query.trim()}&rdquo;.</p>
              <p className="mt-2 text-moss">Try a different word, or ask the Executive Director.</p>
            </div>
          )}

          <section className="rounded-xl border border-hairline bg-sand px-5 py-4">
            <div className="flex items-center gap-2">
              <MagnoliaFlourish className="h-5 w-5 shrink-0 text-copper" />
              <h2 className="font-display text-xl font-semibold">Still have questions?</h2>
            </div>
            <p className="mt-1.5 leading-snug text-moss">
              The Executive Director is the right first stop for anything this page doesn&apos;t cover —
              and the Health &amp; Wellness Director for anything health-related, like medications,
              treatments, or doctor appointments.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
