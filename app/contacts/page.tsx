import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import { loadContacts } from "@/lib/content";
import type { Contact } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Staff Directory | Magnolia Companion",
  description: "Staff contacts for Magnolia Place of Roswell.",
};

type ContactGroup = { department: string; contacts: Contact[] };

function groupByDepartment(contacts: Contact[]): ContactGroup[] {
  const groups: ContactGroup[] = [];
  const indexByDepartment = new Map<string, number>();
  for (const contact of contacts) {
    const existingIndex = indexByDepartment.get(contact.department);
    if (existingIndex === undefined) {
      indexByDepartment.set(contact.department, groups.length);
      groups.push({ department: contact.department, contacts: [contact] });
    } else {
      groups[existingIndex].contacts.push(contact);
    }
  }
  return groups;
}

export default function ContactsPage() {
  const { contacts } = loadContacts();
  const groups = groupByDepartment(contacts);

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs />
      <div className="max-w-2xl">
        <p className="font-semibold uppercase tracking-wide text-copper">Get in touch</p>
        <h1 className="mt-1 font-display text-title font-semibold">Staff Directory</h1>
        <p className="mt-3 text-moss">
          Contacts for Magnolia Place of Roswell staff, by department.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState message="Staff directory is coming soon." />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {groups.map((group) => (
            <section
              key={group.department}
              className="rounded-xl border border-hairline bg-card px-5 py-5 shadow-sm"
            >
              <h2 className="font-display text-2xl font-semibold">{group.department}</h2>
              <ul className="mt-3 space-y-4">
                {group.contacts.map((contact) => (
                  <li key={contact.id}>
                    <p className="font-semibold text-ink">{contact.name}</p>
                    <p className="text-moss">{contact.role}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-copper underline-offset-4 hover:underline"
                        >
                          {contact.phone}
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-copper underline-offset-4 hover:underline"
                        >
                          {contact.email}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
