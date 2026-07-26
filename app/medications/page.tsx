import type { Metadata } from "next";
import MedicationsClient from "@/components/MedicationsClient";
import { loadMedications } from "@/lib/content";

export const metadata: Metadata = {
  title: "Medications | Magnolia Companion",
  description: "Morning and evening medication routines and the complete medication list.",
};

export default function MedicationsPage() {
  return <MedicationsClient directory={loadMedications()} />;
}
