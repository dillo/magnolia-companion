import type { Metadata } from "next";
import ContactsClient from "@/components/ContactsClient";
import { loadContacts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Directory | Magnolia Companion",
  description: "Contacts for Magnolia Place of Roswell staff, emergency services, doctors, and pharmacies.",
};

export default function ContactsPage() {
  const { contacts } = loadContacts();

  return <ContactsClient contacts={contacts} />;
}
