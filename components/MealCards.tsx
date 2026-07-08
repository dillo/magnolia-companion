import type { MenuDay } from "@/lib/schema";
import EmptyState from "@/components/EmptyState";

/** Serving hours are placeholders until the real printed menu is photographed (spec open item). */
export const MEAL_HOURS = [
  ["breakfast", "Breakfast", "7:30 – 9:00"],
  ["lunch", "Lunch", "11:30 – 1:00"],
  ["dinner", "Dinner", "5:00 – 6:30"],
] as const;

export default function MealCards({ day }: { day: MenuDay | null }) {
  if (!day) return <EmptyState message="This week's menu hasn't been added yet." />;
  return (
    <div>
      {MEAL_HOURS.map(([key, label, hours]) => {
        const meal = day[key];
        return (
          <div key={key} className="mb-2.5 rounded-xl border border-hairline bg-card px-3.5 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold">{label}</span>
              <span className="tabular-nums text-moss">{hours}</span>
            </div>
            <p className="mt-1 leading-relaxed">
              {meal.items.length === 0 ? (
                <span className="text-moss">Not listed</span>
              ) : (
                meal.items.map((it, i) => (
                  <span key={i}>
                    <span className={it.kind === "dessert" ? "text-copper" : ""}>{it.name}</span>
                    {i < meal.items.length - 1 && " · "}
                  </span>
                ))
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
