"use client";

import { useMemo, useState } from "react";
import type { NearbyPlace, NearbyPlaceCategory, NearbyPlacesDirectory } from "@/lib/schema";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function ScissorsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <circle cx="6" cy="6" r="2.5" {...STROKE} />
      <circle cx="6" cy="18" r="2.5" {...STROKE} />
      <path d="M8.2 7.6 20 19M8.2 16.4 20 5" {...STROKE} />
    </svg>
  );
}

function ForkKnifeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3" {...STROKE} />
      <path d="M17 3c-1.7 1.5-2.5 3.5-2.5 6 0 2 1 3 2.5 3v9" {...STROKE} />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M5 8h14l-1 13H6L5 8Z" {...STROKE} />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" {...STROKE} />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5V4Z" {...STROKE} />
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M12 3 6.5 11h3L5 17h14l-4.5-6h3L12 3Z" {...STROKE} />
      <path d="M12 17v4" {...STROKE} />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9l-5.3 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" {...STROKE} />
    </svg>
  );
}

const CATEGORY_META: Record<
  NearbyPlaceCategory,
  { label: string; className: string; Icon: () => React.ReactElement }
> = {
  hair_salon: { label: "Hair Salons", className: "bg-[#8B3E66] text-white", Icon: ScissorsIcon },
  restaurant: { label: "Restaurants", className: "bg-copper text-petal", Icon: ForkKnifeIcon },
  shop: { label: "Shops", className: "bg-[#556B3F] text-petal", Icon: BagIcon },
  medical: { label: "Medical", className: "bg-[#246A73] text-white", Icon: CrossIcon },
  park: { label: "Parks", className: "bg-[#3D7D52] text-white", Icon: TreeIcon },
  activity: { label: "Activities", className: "bg-ink text-petal", Icon: StarIcon },
};

const CATEGORY_ORDER: NearbyPlaceCategory[] = [
  "restaurant", "park", "activity", "shop", "medical", "hair_salon",
];

/** Drive bands at relaxed suburban speeds — the question families actually ask. */
const BANDS = [
  { label: "Under 5 minutes", max: 1.5 },
  { label: "5–10 minutes", max: 3 },
  { label: "10–15 minutes", max: Infinity },
];

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function ExploreClient({ directory }: { directory: NearbyPlacesDirectory }) {
  const [category, setCategory] = useState<NearbyPlaceCategory | "all">("all");
  const [seniorOnly, setSeniorOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const bands = useMemo(() => {
    const filtered = directory.places
      .filter((place) =>
        (category === "all" || place.category === category)
        && (!seniorOnly || place.seniorFriendly))
      .sort((a, b) => a.distanceMiles - b.distanceMiles);
    const buckets = BANDS.map((band) => ({ ...band, places: [] as NearbyPlace[] }));
    for (const place of filtered) {
      buckets[BANDS.findIndex((band) => place.distanceMiles <= band.max)].places.push(place);
    }
    return buckets.filter((band) => band.places.length > 0);
  }, [category, directory.places, seniorOnly]);

  const total = bands.reduce((n, band) => n + band.places.length, 0);
  const selected = directory.places.find((place) => place.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumbs />
      <div className="mb-5 max-w-3xl">
        <h1 className="font-display text-title font-semibold">Explore Nearby</h1>
        <p className="mt-2 text-moss">
          Restaurants, parks, shops, and easy outings around Magnolia Place of Roswell, grouped by
          how long the drive takes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-5 lg:sticky lg:top-24">
          <section>
            <h2 className="mb-2 font-semibold">Categories</h2>
            <div className="flex flex-wrap gap-2 lg:block lg:space-y-2">
              <FilterButton active={category === "all"} onClick={() => setCategory("all")}>
                All
              </FilterButton>
              {CATEGORY_ORDER.map((key) => (
                <FilterButton key={key} active={category === key} onClick={() => setCategory(key)}>
                  {CATEGORY_META[key].label}
                </FilterButton>
              ))}
            </div>
          </section>

          <label className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-hairline bg-card px-3 py-2">
            <span>
              <span className="block font-semibold">Senior-friendly</span>
              <span className="block text-sm text-moss">Show places with comfort notes.</span>
            </span>
            <input
              type="checkbox"
              checked={seniorOnly}
              onChange={(event) => setSeniorOnly(event.target.checked)}
              className="h-6 w-6 accent-copper"
            />
          </label>

          <p className="text-sm text-moss">
            Drive times are estimates at relaxed suburban speeds. Confirm current hours, access, and
            seating before leaving.
          </p>
        </aside>

        <section className="min-w-0 space-y-6">
          {bands.map((band) => (
            <section key={band.label}>
              <div className="flex items-baseline justify-between gap-3 rounded-lg bg-sand px-4 py-2">
                <h2 className="font-display text-xl font-semibold">{band.label}</h2>
                <span className="text-[15px] text-moss">
                  {band.places.length} {band.places.length === 1 ? "place" : "places"}
                </span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {band.places.map((place) => {
                  const meta = CATEGORY_META[place.category];
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setSelectedId(place.id)}
                      className={`rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-copper/40 ${
                        selectedId === place.id ? "border-copper ring-2 ring-copper/20" : "border-hairline"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${meta.className}`}>
                          <meta.Icon />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-display text-xl font-semibold leading-snug">{place.name}</h3>
                            {place.seniorFriendly && (
                              <span className="mt-0.5 shrink-0 rounded-full bg-copper/10 px-2 py-1 text-[13px] font-semibold text-copper">
                                Easy outing
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm font-semibold text-copper">
                            {meta.label} · {place.distanceMiles.toFixed(1)} mi
                          </p>
                          <p className="mt-1.5 leading-snug text-moss">{place.summary}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {total === 0 && <EmptyState message="No nearby places match these filters." />}
        </section>
      </div>

      {selected && <PlaceModal place={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3 py-2 font-semibold lg:w-full lg:text-left ${
        active ? "bg-copper text-petal" : "bg-card text-moss ring-1 ring-inset ring-hairline"
      }`}
    >
      {children}
    </button>
  );
}

function PlaceModal({ place, onClose }: { place: NearbyPlace; onClose: () => void }) {
  const meta = CATEGORY_META[place.category];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nearby-place-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 md:p-6"
      onClick={onClose}
    >
      <section
        className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-xl bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-copper">{meta.label} · {place.distanceMiles.toFixed(1)} miles</p>
            <h2 id="nearby-place-title" className="mt-1 font-display text-3xl font-semibold">{place.name}</h2>
            <p className="mt-2 text-moss">{place.address}</p>
          </div>
          <button
            type="button"
            aria-label="Close place details"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-hairline bg-petal text-2xl text-copper"
          >
            ×
          </button>
        </div>

        <p className="leading-relaxed text-moss">{place.summary}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {place.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-copper/10 px-2 py-1 text-sm font-semibold text-copper">
              {tag}
            </span>
          ))}
        </div>

        <section className="mt-5">
          <h3 className="mb-2 font-semibold">Planning Notes</h3>
          <ul className="space-y-2">
            {place.notes.map((note) => (
              <li key={note} className="flex gap-2 leading-snug text-moss">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={mapsUrl(place.address)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-copper px-4 py-2 font-semibold text-petal"
          >
            Open in Google Maps
          </a>
          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-copper px-4 py-2 font-semibold text-copper"
            >
              Website
            </a>
          )}
          {place.phone && (
            <a href={`tel:${place.phone}`} className="rounded-full border border-hairline px-4 py-2 font-semibold text-moss">
              {place.phone}
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
