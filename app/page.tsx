import { loadActivityMonths, loadMenuWeeks, loadVisitDays } from "@/lib/content";
import HomeClient from "@/components/HomeClient";

export default function HomePage() {
  return <HomeClient months={loadActivityMonths()} weeks={loadMenuWeeks()} visitDays={loadVisitDays()} />;
}
