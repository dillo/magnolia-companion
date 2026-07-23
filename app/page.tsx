import { loadActivityMonths, loadContacts, loadMenuWeeks } from "@/lib/content";
import { FEATURED_FAQS } from "@/lib/faqs";
import HomeClient from "@/components/HomeClient";

export default function HomePage() {
  return (
    <HomeClient
      months={loadActivityMonths()}
      weeks={loadMenuWeeks()}
      featuredFaqs={FEATURED_FAQS}
      contacts={loadContacts().contacts}
    />
  );
}
