import { formatTime } from "@/lib/dates";
import type { MealItem, MenuDay } from "@/lib/schema";
import { servingNow } from "@/lib/now";

/** Serving hours are placeholders until the real printed menu is photographed (spec open item). */
export const MEALS = [
  { key: "breakfast", label: "Breakfast", start: "07:30", end: "09:00" },
  { key: "lunch", label: "Lunch", start: "11:30", end: "13:00" },
  { key: "dinner", label: "Dinner", start: "17:00", end: "18:30" },
] as const;

export type MealInfo = (typeof MEALS)[number];

export function mealHours({ start, end }: { start: string; end: string }): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/**
 * One meal as a card — the shared surface used by the home sidebar and /menu.
 * `items` null renders the pending-menu skeleton; `now` non-null enables the
 * "Serving now" badge (pass it only when the card shows today's menu).
 */
export function MealCard({
  meal,
  items,
  now = null,
}: {
  meal: MealInfo;
  items: MealItem[] | null;
  now?: string | null;
}) {
  return (
    <section className="rounded-xl border border-hairline bg-card px-4 py-3 shadow-sm">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="text-[15px] font-bold uppercase tracking-wider text-ink">{meal.label}</h3>
        {servingNow(meal, now) ? (
          <span className="rounded-full bg-copper px-2.5 py-0.5 text-[13px] font-bold text-petal">
            Serving now
          </span>
        ) : (
          <span className="tabular-nums text-moss">{mealHours(meal)}</span>
        )}
      </div>
      {items === null ? (
        <ul className="space-y-1" aria-label="Menu pending">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="flex gap-2 leading-snug text-moss">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper/50" />
              <span className="tracking-widest">...</span>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="text-moss">Not listed</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, index) => (
            <li key={index} className="flex gap-2 leading-snug">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
              <span className={item.kind === "dessert" ? "text-copper" : ""}>
                {item.kind === "dessert" && (
                  <span aria-hidden="true" className="mr-1 text-[13px] align-middle">◆</span>
                )}
                {item.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function MealCards({ day, now = null }: { day: MenuDay | null; now?: string | null }) {
  return (
    <div className="space-y-3">
      {MEALS.map((meal) => (
        <MealCard key={meal.key} meal={meal} items={day?.[meal.key].items ?? null} now={now} />
      ))}
    </div>
  );
}
