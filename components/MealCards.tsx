import { formatTime } from "@/lib/dates";
import type { MenuDay } from "@/lib/schema";

/** Serving hours are placeholders until the real printed menu is photographed (spec open item). */
export const MEALS = [
  { key: "breakfast", label: "Breakfast", start: "07:30", end: "09:00" },
  { key: "lunch", label: "Lunch", start: "11:30", end: "13:00" },
  { key: "dinner", label: "Dinner", start: "17:00", end: "18:30" },
] as const;

export function mealHours({ start, end }: { start: string; end: string }): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function PlaceholderItems() {
  return (
    <ul className="space-y-1.5" aria-label="Menu pending">
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i} className="flex gap-2 leading-relaxed text-moss">
          <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-copper/50" />
          <span className="tracking-widest">...</span>
        </li>
      ))}
    </ul>
  );
}

export default function MealCards({ day }: { day: MenuDay | null }) {
  return (
    <div className="divide-y divide-hairline border-y border-hairline">
      {MEALS.map(({ key, label, start, end }) => {
        const meal = day?.[key] ?? null;
        return (
          <section key={key} className="py-4">
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold">{label}</h2>
              <span className="shrink-0 tabular-nums text-moss">{mealHours({ start, end })}</span>
            </div>
            {!meal ? (
              <PlaceholderItems />
            ) : meal.items.length === 0 ? (
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
