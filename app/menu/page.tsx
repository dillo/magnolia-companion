import { loadContacts, loadMenuWeeks } from "@/lib/content";
import { FEATURED_FAQS } from "@/lib/faqs";
import MenuClient from "@/components/MenuClient";

export default function MenuPage() {
  return (
    <MenuClient
      weeks={loadMenuWeeks()}
      featuredFaqs={FEATURED_FAQS}
      contacts={loadContacts().contacts}
    />
  );
}
