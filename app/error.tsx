"use client";

import Link from "next/link";
import { useEffect } from "react";
import MagnoliaFlourish from "@/components/MagnoliaFlourish";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section role="alert" className="mx-auto max-w-2xl rounded-xl border border-hairline bg-card px-5 py-8 text-center sm:px-8">
      <MagnoliaFlourish className="mx-auto h-8 w-8 text-copper" />
      <h1 className="mt-3 text-balance font-display text-3xl font-semibold">This page needs another moment</h1>
      <p className="mx-auto mt-2 max-w-prose text-moss">
        The daybook could not finish loading. Your saved display settings and reminder choices are still safe.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="min-h-12 rounded-full bg-copper px-5 font-semibold text-petal hover:bg-copper/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-full border border-copper px-5 font-semibold text-copper hover:bg-petal"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
