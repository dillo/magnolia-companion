import { loadMenuWeeks } from "@/lib/content";
import MenuClient from "@/components/MenuClient";

export default function MenuPage() {
  return <MenuClient weeks={loadMenuWeeks()} />;
}
