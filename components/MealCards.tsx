import type { MenuDay } from "@/lib/schema";
import EmptyState from "@/components/EmptyState";

/** Serving hours are placeholders until the real printed menu is photographed (spec open item). */
export const MEAL_HOURS = [
  ["breakfast", "Breakfast", "7:30 AM – 9:00 AM"],
  ["lunch", "Lunch", "11:30 AM – 1:00 PM"],
  ["dinner", "Dinner", "5:00 PM – 6:30 PM"],
] as const;

export default function MealCards({ day }: { day: MenuDay | null }) {
  if (!day) return <EmptyState message="This week's menu hasn't been added yet." />;
  return (
    <div className="divide-y divide-hairline border-y border-hairline">
      {MEAL_HOURS.map(([key, label, hours]) => {
        const meal = day[key];
        return (
          <section key={key} className="py-4">
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold">{label}</h2>
              <span className="shrink-0 tabular-nums text-moss">{hours}</span>
            </div>
            {meal.items.length === 0 ? (
              <p className="text-moss">Not listed</p>
            ) : (
              <ul className="space-y-1.5">
                {meal.items.map((it, i) => (
                  <li key={i} className="flex gap-2 leading-relaxed">
                    <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                    <span className={it.kind === "dessert" ? "text-copper" : ""}>{it.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
