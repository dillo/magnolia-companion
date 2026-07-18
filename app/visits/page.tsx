import { loadActivityMonths, loadVisitDays } from "@/lib/content";
import VisitsClient from "@/components/VisitsClient";

export default function VisitsPage() {
  return <VisitsClient months={loadActivityMonths()} visitDays={loadVisitDays()} />;
}
