import { loadActivityMonths } from "@/lib/content";
import CalendarClient from "@/components/CalendarClient";

export default function CalendarPage() {
  return <CalendarClient months={loadActivityMonths()} />;
}
