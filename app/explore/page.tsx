import type { Metadata } from "next";
import { loadNearbyPlaces } from "@/lib/content";
import ExploreClient from "@/components/ExploreClient";

export const metadata: Metadata = {
  title: "Explore Nearby | Magnolia Companion",
  description: "Nearby restaurants, salons, shops, medical stops, parks, and activities around Magnolia Place of Roswell.",
};

export default function ExplorePage() {
  return <ExploreClient directory={loadNearbyPlaces()} />;
}
