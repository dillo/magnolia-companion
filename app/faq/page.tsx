import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import FaqClient from "@/components/FaqClient";
import { FAQ_SECTIONS } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "Resident FAQ | Magnolia Companion",
  description: "Common resident handbook questions for Magnolia Place of Roswell.",
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Breadcrumbs />
      <div className="max-w-3xl">
        <p className="font-semibold uppercase tracking-wide text-copper">Resident handbook</p>
        <h1 className="mt-1 font-display text-title font-semibold">Frequently Asked Questions</h1>
        <p className="mt-3 text-moss">
          Quick answers from the Pegasus Senior Living Resident Handbook for Magnolia Place of Roswell.
        </p>
      </div>
      <FaqClient sections={FAQ_SECTIONS} />
    </div>
  );
}
