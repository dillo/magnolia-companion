import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import ContactDetails from "@/components/ContactDetails";
import EmptyState from "@/components/EmptyState";
import { loadContacts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Staff Directory | Magnolia Companion",
  description: "Staff contacts for Magnolia Place of Roswell.",
};

export default function ContactsPage() {
  const { contacts } = loadContacts();

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs />
      <div className="max-w-2xl">
        <p className="font-semibold uppercase tracking-wide text-copper">Get in touch</p>
        <h1 className="mt-1 font-display text-title font-semibold">Staff Directory</h1>
        <p className="mt-3 text-moss">
          Contacts for Magnolia Place of Roswell staff and local services.
        </p>
      </div>

      {contacts.length === 0 ? (
        <div className="mt-6">
          <EmptyState message="Staff directory is coming soon." />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className="rounded-xl border border-hairline bg-card px-5 py-5 shadow-sm"
            >
              <h2 className="font-display text-xl font-semibold leading-snug text-ink">
                {contact.name}
              </h2>
              <p className="mt-1 text-moss">{contact.role}</p>
              <ContactDetails contact={contact} className="mt-3" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
