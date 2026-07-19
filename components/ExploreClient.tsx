"use client";

import { useMemo, useState } from "react";
import type { NearbyPlace, NearbyPlaceCategory, NearbyPlacesDirectory } from "@/lib/schema";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";

const CATEGORY_META: Record<NearbyPlaceCategory, { label: string; pin: string; className: string }> = {
  hair_salon: { label: "Hair Salons", pin: "H", className: "bg-[#8B3E66] text-white" },
  restaurant: { label: "Restaurants", pin: "R", className: "bg-copper text-petal" },
  shop: { label: "Shops", pin: "S", className: "bg-[#556B3F] text-petal" },
  medical: { label: "Medical", pin: "M", className: "bg-[#246A73] text-white" },
  park: { label: "Parks", pin: "P", className: "bg-[#3D7D52] text-white" },
  activity: { label: "Activities", pin: "A", className: "bg-ink text-petal" },
};

const CATEGORY_ORDER: NearbyPlaceCategory[] = ["hair_salon", "restaurant", "shop", "medical", "park", "activity"];
const RADIUS_OPTIONS = [1, 2, 3, 5];

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function positionForPlace(place: NearbyPlace, bounds: Bounds) {
  const x = ((place.longitude - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - place.latitude) / (bounds.north - bounds.south)) * 100;
  return {
    left: `${Math.min(94, Math.max(6, x))}%`,
    top: `${Math.min(92, Math.max(8, y))}%`,
  };
}

type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

function mapBounds(directory: NearbyPlacesDirectory): Bounds {
  const latitudes = [directory.center.latitude, ...directory.places.map((place) => place.latitude)];
  const longitudes = [directory.center.longitude, ...directory.places.map((place) => place.longitude)];
  return {
    north: Math.max(...latitudes) + 0.008,
    south: Math.min(...latitudes) - 0.008,
    east: Math.max(...longitudes) + 0.01,
    west: Math.min(...longitudes) - 0.01,
  };
}

export default function ExploreClient({ directory }: { directory: NearbyPlacesDirectory }) {
  const [category, setCategory] = useState<NearbyPlaceCategory | "all">("all");
  const [radius, setRadius] = useState(5);
  const [seniorOnly, setSeniorOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(directory.places[0]?.id ?? null);

  const bounds = useMemo(() => mapBounds(directory), [directory]);
  const filteredPlaces = useMemo(() => {
    return directory.places.filter((place) => (
      (category === "all" || place.category === category)
      && place.distanceMiles <= radius
      && (!seniorOnly || place.seniorFriendly)
    ));
  }, [category, directory.places, radius, seniorOnly]);

  const selected = directory.places.find((place) => place.id === selectedId) ?? null;

  function selectPlace(place: NearbyPlace) {
    setSelectedId(place.id);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumbs />
      <div className="mb-5 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold">Explore Nearby</h1>
        <p className="mt-2 text-moss">
          Restaurants, salons, shops, medical stops, parks, and easy outings around Magnolia Place of Roswell.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-5 lg:sticky lg:top-6">
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

          <section>
            <h2 className="mb-2 font-semibold">Radius</h2>
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
              {RADIUS_OPTIONS.map((miles) => (
                <button
                  key={miles}
                  type="button"
                  aria-pressed={radius === miles}
                  onClick={() => setRadius(miles)}
                  className={`rounded-lg border px-3 py-2 font-semibold ${
                    radius === miles
                      ? "border-copper bg-copper text-petal"
                      : "border-hairline bg-card text-moss"
                  }`}
                >
                  {miles} mi
                </button>
              ))}
            </div>
          </section>

          <label className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-hairline bg-card px-3 py-2">
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
            Distances and notes are a curated planning aid. Confirm current hours, access, and seating before leaving.
          </p>
        </aside>

        <section className="min-w-0">
          <div className="overflow-hidden rounded-lg border border-hairline bg-card">
            <div className="relative aspect-[4/3] min-h-[26rem] bg-petal sm:aspect-[16/10]">
              <MapTexture />
              <div className="absolute inset-8 rounded-full border border-copper/25" />
              <div className="absolute inset-16 rounded-full border border-copper/15" />
              <button
                type="button"
                className="absolute z-20 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-petal bg-copper font-bold text-petal shadow-lg"
                style={{
                  left: positionForCenter(directory, bounds).left,
                  top: positionForCenter(directory, bounds).top,
                }}
                aria-label={directory.center.name}
              >
                M
              </button>
              {filteredPlaces.map((place) => {
                const pos = positionForPlace(place, bounds);
                const meta = CATEGORY_META[place.category];
                const active = selectedId === place.id;
                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => selectPlace(place)}
                    aria-label={place.name}
                    className={`absolute z-10 grid h-10 w-10 -translate-x-1/2 -translate-y-full place-items-center rounded-full border-2 border-petal text-sm font-bold shadow-md transition hover:scale-110 ${meta.className} ${
                      active ? "ring-4 ring-copper/30" : ""
                    }`}
                    style={pos}
                  >
                    {meta.pin}
                    <span aria-hidden="true" className="absolute -bottom-1 h-3 w-3 rotate-45 bg-inherit" />
                  </button>
                );
              })}
              <div className="absolute left-4 top-4 rounded-lg border border-hairline bg-card/95 px-3 py-2 shadow-sm">
                <div className="font-semibold text-ink">{directory.center.name}</div>
                <div className="text-sm text-moss">Map center</div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {filteredPlaces.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => selectPlace(place)}
                className={`rounded-lg border bg-card p-4 text-left shadow-sm ${
                  selectedId === place.id ? "border-copper ring-2 ring-copper/20" : "border-hairline"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold">{place.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-copper">
                      {CATEGORY_META[place.category].label} · {place.distanceMiles.toFixed(1)} mi
                    </p>
                  </div>
                  {place.seniorFriendly && (
                    <span className="shrink-0 rounded-full bg-copper/10 px-2 py-1 text-[13px] font-semibold text-copper">
                      Easy outing
                    </span>
                  )}
                </div>
                <p className="mt-2 leading-snug text-moss">{place.summary}</p>
              </button>
            ))}
          </div>

          {filteredPlaces.length === 0 && (
            <EmptyState message="No nearby places match these filters." />
          )}
        </section>
      </div>

      {selected && <PlaceModal place={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function positionForCenter(directory: NearbyPlacesDirectory, bounds: Bounds) {
  return positionForPlace({
    id: "center",
    name: directory.center.name,
    category: "activity",
    address: directory.center.address,
    phone: null,
    website: null,
    latitude: directory.center.latitude,
    longitude: directory.center.longitude,
    distanceMiles: 0,
    summary: "",
    seniorFriendly: true,
    notes: [""],
    tags: [],
  }, bounds);
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

function MapTexture() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(160,80,31,0.12),transparent_18rem),linear-gradient(135deg,rgba(227,220,203,0.7)_0_1px,transparent_1px_44px),linear-gradient(45deg,rgba(227,220,203,0.5)_0_1px,transparent_1px_52px)]" />
      <div className="absolute left-[10%] top-[42%] h-4 w-[85%] rotate-[-12deg] rounded-full bg-hairline/80" />
      <div className="absolute left-[2%] top-[58%] h-3 w-[90%] rotate-[9deg] rounded-full bg-hairline/70" />
      <div className="absolute left-[47%] top-[-10%] h-[115%] w-3 rotate-[14deg] rounded-full bg-hairline/70" />
      <div className="absolute left-[68%] top-[8%] h-[95%] w-2 rotate-[-28deg] rounded-full bg-hairline/60" />
      <div className="absolute bottom-3 right-4 rounded-full bg-card/85 px-3 py-1 text-xs font-semibold text-moss">
        Curated local area map
      </div>
    </div>
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
        className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-lg bg-card p-5 shadow-xl"
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
