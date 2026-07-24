import Link from "next/link";
import ContactDetails from "@/components/ContactDetails";
import MagnoliaFlourish from "@/components/MagnoliaFlourish";
import { faqSectionId, type FeaturedFaq } from "@/lib/faqs";
import type { Contact } from "@/lib/schema";

function dailyIndex(date: string, length: number, salt: string): number {
  if (length === 0) return -1;

  let hash = 2166136261;
  for (const character of `${date}:${salt}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function HelpfulToday({
  today,
  faqs,
  contacts,
}: {
  today: string;
  faqs: FeaturedFaq[];
  contacts: Contact[];
}) {
  const faq = faqs[dailyIndex(today, faqs.length, "faq")] ?? null;
  const contact = contacts[dailyIndex(today, contacts.length, "contact")] ?? null;

  return (
    <section className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-sm">
      <div className="bg-sand px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MagnoliaFlourish className="h-5 w-5 shrink-0 text-copper" />
            <h2 className="font-display text-2xl font-semibold text-ink">Helpful today</h2>
          </div>
          <span className="rounded-full bg-card px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide text-copper">
            Daily
          </span>
        </div>
        <p className="mt-1.5 leading-snug text-moss">A quick answer and a directory contact.</p>
      </div>

      <div className="divide-y divide-hairline">
        <article className="px-5 py-5">
          <p className="text-[13px] font-bold uppercase tracking-wider text-copper">Good to know</p>
          {faq ? (
            <>
              <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug text-ink">
                {faq.question}
              </h3>
              <p className="mt-2 leading-relaxed text-moss">{faq.answer}</p>
              <Link
                href={`/faq#${faqSectionId(faq.section)}`}
                className="mt-3 inline-flex min-h-11 items-center font-semibold text-copper underline-offset-4 hover:underline"
              >
                More resident questions
                <span aria-hidden="true" className="ml-1.5 text-xl leading-none">›</span>
              </Link>
            </>
          ) : (
            <p className="mt-2 text-moss">Resident answers will appear here when they are available.</p>
          )}
        </article>

        <article className="px-5 py-5">
          <p className="text-[13px] font-bold uppercase tracking-wider text-copper">From the directory</p>
          {contact ? (
            <>
              <div className="mt-3 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sand font-display text-lg font-semibold text-copper"
                >
                  {initials(contact.name)}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-semibold leading-snug text-ink">{contact.name}</h3>
                  <p className="leading-snug text-moss">{contact.role}</p>
                </div>
              </div>

              <ContactDetails contact={contact} className="mt-2" />
              <Link
                href="/contacts"
                className="mt-2 inline-flex items-center py-1.5 font-semibold text-copper underline-offset-4 hover:underline"
              >
                Open the directory
                <span aria-hidden="true" className="ml-1.5 text-xl leading-none">›</span>
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-moss">Directory contacts will appear here when they are available.</p>
              <Link
                href="/contacts"
                className="mt-3 inline-flex min-h-11 items-center font-semibold text-copper underline-offset-4 hover:underline"
              >
                Open the directory
                <span aria-hidden="true" className="ml-1.5 text-xl leading-none">›</span>
              </Link>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
