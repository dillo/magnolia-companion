"use client";

import { useMemo, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ContactDetails from "@/components/ContactDetails";
import EmptyState from "@/components/EmptyState";
import type { Contact, ContactCategory } from "@/lib/schema";

type ContactFilter = ContactCategory | "all";

const FILTERS: {
  key: ContactFilter;
  label: string;
  dotClass?: string;
}[] = [
  { key: "all", label: "All" },
  { key: "magnolia", label: "Magnolia", dotClass: "bg-moss" },
  { key: "emergency", label: "Emergency", dotClass: "bg-copper" },
  { key: "doctors", label: "Doctors", dotClass: "bg-ink" },
  { key: "pharmacy", label: "Pharmacy", dotClass: "bg-moss/60" },
];

export default function ContactsClient({ contacts }: { contacts: Contact[] }) {
  const [filter, setFilter] = useState<ContactFilter>("all");
  const filtered = useMemo(
    () => contacts.filter((contact) => filter === "all" || contact.category === filter),
    [contacts, filter],
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs />
      <header className="max-w-2xl">
        <h1 className="font-display text-title font-semibold">Directory</h1>
        <p className="mt-2 max-w-xl text-moss">
          Contacts for Magnolia Place of Roswell staff, emergency services, doctors, and pharmacies.
        </p>
      </header>

      <div className="mt-6 border-t border-hairline pt-4">
        <p className="mb-2 font-semibold text-moss">Show contacts</p>
        <div
          role="group"
          aria-label="Filter directory"
          className="flex max-w-full flex-wrap items-center gap-2"
        >
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={`inline-flex min-h-11 max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 font-semibold transition-colors ${
                filter === item.key
                  ? "bg-copper text-petal"
                  : "bg-card text-moss ring-1 ring-inset ring-hairline hover:ring-copper/40 hover:text-ink"
              }`}
            >
              {item.dotClass && (
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`} />
              )}
              {item.label}
              <span className={`text-[13px] font-bold tabular-nums ${filter === item.key ? "text-petal" : "text-moss"}`}>
                {countFor(contacts, item.key)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {filtered.map((contact) => (
            <li
              key={contact.id}
              className="rounded-xl border border-hairline bg-card px-5 py-5 shadow-sm"
            >
              <h2 className="font-display text-xl font-semibold leading-snug text-ink">
                {contact.name}
              </h2>
              <p className="mt-1 text-copper">{contact.role}</p>
              <ContactDetails contact={contact} className="mt-3" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6">
          <EmptyState message={emptyMessage(filter, contacts.length)} />
        </div>
      )}
    </div>
  );
}

function countFor(contacts: Contact[], filter: ContactFilter): number {
  return contacts.filter((contact) => filter === "all" || contact.category === filter).length;
}

function emptyMessage(filter: ContactFilter, contactCount: number): string {
  if (contactCount === 0) return "Directory contacts will appear here when they are available.";
  if (filter === "doctors") return "No doctors have been added yet.";
  if (filter === "pharmacy") return "No pharmacies have been added yet.";
  return "No directory contacts match this filter.";
}
