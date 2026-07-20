import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import MagnoliaFlourish from "@/components/MagnoliaFlourish";

export const metadata: Metadata = {
  title: "Disclaimer | Magnolia Companion",
  description:
    "Information about Magnolia Companion's independent, unofficial relationship to Magnolia Place of Roswell and Pegasus Senior Living.",
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs />
      <div className="max-w-2xl">
        <p className="font-semibold uppercase tracking-wide text-copper">About this app</p>
        <h1 className="mt-1 font-display text-title font-semibold">Disclaimer</h1>
        <p className="mt-3 text-xl leading-relaxed text-moss">
          Magnolia Companion is an independently developed informational tool for residents and
          their families.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <section className="rounded-xl border border-hairline bg-card px-5 py-5 shadow-sm">
          <div className="flex items-center gap-2">
            <MagnoliaFlourish className="h-5 w-5 shrink-0 text-copper" />
            <h2 className="font-display text-2xl font-semibold">Independent and unofficial</h2>
          </div>
          <p className="mt-3 leading-relaxed text-moss">
            Magnolia Companion is not operated by, affiliated with, endorsed by, or sponsored by
            Magnolia Place of Roswell, Pegasus Senior Living, or their affiliates. It is not an
            official service or communication channel of those organizations.
          </p>
          <p className="mt-3 leading-relaxed text-moss">
            The names Magnolia Place of Roswell and Pegasus Senior Living are used only to identify
            the community this companion serves.
          </p>
        </section>

        <section className="rounded-xl border border-hairline bg-card px-5 py-5 shadow-sm">
          <h2 className="font-display text-2xl font-semibold">Information and assistance</h2>
          <p className="mt-3 leading-relaxed text-moss">
            Activities, menus, policies, amenities, and other information may change or may contain
            transcription errors. Confirm important or time-sensitive information with Magnolia
            Place staff.
          </p>
          <p className="mt-3 leading-relaxed text-moss">
            Do not rely on this application for emergencies, medical advice, care instructions, or
            official notices. Contact community staff or emergency services when appropriate.
          </p>
        </section>
      </div>
    </div>
  );
}
