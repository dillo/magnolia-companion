import Link from "next/link";
import MagnoliaFlourish from "@/components/MagnoliaFlourish";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-hairline bg-card px-5 py-8 text-center sm:px-8">
      <MagnoliaFlourish className="mx-auto h-8 w-8 text-copper" />
      <h1 className="mt-3 text-balance font-display text-3xl font-semibold">That page isn&apos;t in the daybook</h1>
      <p className="mx-auto mt-2 max-w-prose text-moss">
        The address may be out of date. Return home to see today&apos;s activities and meals.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex min-h-12 items-center rounded-full bg-copper px-5 font-semibold text-petal hover:bg-copper/90"
      >
        Return home
      </Link>
    </section>
  );
}
