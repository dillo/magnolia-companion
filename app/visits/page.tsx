import { loadContacts, loadVisitDays } from "@/lib/content";
import { FEATURED_FAQS } from "@/lib/faqs";
import VisitsClient from "@/components/VisitsClient";

export default function VisitsPage() {
  return (
    <VisitsClient
      visitDays={loadVisitDays()}
      featuredFaqs={FEATURED_FAQS}
      contacts={loadContacts().contacts}
    />
  );
}
