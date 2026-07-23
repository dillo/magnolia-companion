import { loadContacts, loadHolidays } from "@/lib/content";
import { FEATURED_FAQS } from "@/lib/faqs";
import HolidaysClient from "@/components/HolidaysClient";

export default function HolidaysPage() {
  return (
    <HolidaysClient
      holidays={loadHolidays()}
      featuredFaqs={FEATURED_FAQS}
      contacts={loadContacts().contacts}
    />
  );
}
