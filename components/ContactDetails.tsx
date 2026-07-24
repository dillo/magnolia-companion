import { Fragment } from "react";
import type { Contact } from "@/lib/schema";

export default function ContactDetails({
  contact,
  className = "",
}: {
  contact: Contact;
  className?: string;
}) {
  const phoneNumbers = [
    { label: "Cell", value: contact.cell, callable: true },
    { label: "Main", value: contact.main, callable: true },
    { label: "Fax", value: contact.fax, callable: false },
  ] as const;

  if (!phoneNumbers.some(({ value }) => value) && !contact.email) return null;

  return (
    <dl
      className={`grid grid-cols-[max-content_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 text-[15px] leading-snug ${className}`}
    >
      {phoneNumbers.map(({ label, value, callable }) =>
        value ? (
          <Fragment key={label}>
            <dt className="text-moss">{label}:</dt>
            <dd className="min-w-0">
              {callable ? (
                <a
                  href={`tel:${value}`}
                  aria-label={`Call ${contact.name} on ${label.toLowerCase()} at ${value}`}
                  className="font-medium tabular-nums text-ink underline decoration-hairline underline-offset-4 hover:text-copper"
                >
                  {value}
                </a>
              ) : (
                <span className="font-medium tabular-nums text-ink">{value}</span>
              )}
            </dd>
          </Fragment>
        ) : null,
      )}
      {contact.email && (
        <>
          <dt className="text-moss">Email:</dt>
          <dd className="min-w-0">
            <a
              href={`mailto:${contact.email}`}
              aria-label={`Email ${contact.name} at ${contact.email}`}
              className="font-medium text-ink underline decoration-hairline underline-offset-4 [overflow-wrap:anywhere] hover:text-copper"
            >
              {contact.email}
            </a>
          </dd>
        </>
      )}
    </dl>
  );
}
