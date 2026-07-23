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

function MealHeadingIcon({ meal }: { meal: MealInfo["key"] }) {
  const iconClass = "h-5 w-5 shrink-0 -translate-y-[3px] text-copper";
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (meal === "breakfast") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 22" className={iconClass}>
        <path d="M4 20h16M6.5 20a5.5 5.5 0 0 1 11 0M12 7v3M5.2 12.2l2.1 2.1M18.8 12.2l-2.1 2.1" {...stroke} />
      </svg>
    );
  }

  if (meal === "lunch") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 22" className={iconClass}>
        <path d="M5 12h14c-.5 4.1-3.1 6.5-7 6.5S5.5 16.1 5 12ZM8 20h8M9 9c-1-1.2 1-2.1 0-3.3M13 9c-1-1.2 1-2.1 0-3.3" {...stroke} />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 22" className={iconClass}>
      <path d="M4 20h16M6 17.5a6 6 0 0 1 12 0H6ZM12 11.5V9M10.5 9h3" {...stroke} />
    </svg>
  );
}

/**
 * One meal as a card — the shared surface used by the home sidebar and /menu.
 * `items` null renders the pending-menu skeleton; `now` non-null enables the
 * serving-now highlight (pass it only when the card shows today's menu).
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
  const isServing = servingNow(meal, now);

  return (
    <section
      aria-label={`${meal.label}${isServing ? ", serving now" : ""}`}
      className={`rounded-xl border px-4 py-3 ${
        isServing
          ? "border-copper bg-copper/10 shadow-md ring-1 ring-copper/20"
          : "border-hairline bg-card shadow-sm"
      }`}
    >
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="flex items-end gap-2 text-[15px] font-bold uppercase leading-5 tracking-wider text-ink">
          {meal.label}
          <MealHeadingIcon meal={meal.key} />
        </h3>
        <span className={`tabular-nums ${isServing ? "font-semibold text-copper" : "text-moss"}`}>
          {mealHours(meal)}
        </span>
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

export default function MealCards({
  day,
  now = null,
  className = "space-y-3",
}: {
  day: MenuDay | null;
  now?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      {MEALS.map((meal) => (
        <MealCard key={meal.key} meal={meal} items={day?.[meal.key].items ?? null} now={now} />
      ))}
    </div>
  );
}
