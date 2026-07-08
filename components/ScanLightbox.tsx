"use client";

import { useState } from "react";

export default function ScanLightbox({ scans, label }: { scans: string[]; label: string }) {
  const [open, setOpen] = useState(false);
  if (scans.length === 0) return null;
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="mx-auto mt-6 block font-semibold text-copper underline underline-offset-4">
        {label}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Printed pages"
          className="fixed inset-0 z-50 overflow-auto bg-black/80 p-4"
          onClick={() => setOpen(false)}>
          <button className="mb-3 rounded-lg bg-card px-4 py-2 font-semibold" onClick={() => setOpen(false)}>
            Close
          </button>
          {scans.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element -- full-size scan, no optimization wanted
            <img key={s} src={`/${s}`} alt="Printed page from Magnolia Place"
              className="mx-auto mb-4 max-w-full rounded-lg" />
          ))}
        </div>
      )}
    </>
  );
}
