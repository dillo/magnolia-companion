"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export default function ScanLightbox({
  scans,
  label,
  triggerClassName = "mx-auto mt-6 block min-h-11 font-semibold text-copper underline underline-offset-4",
}: {
  scans: string[];
  label: string;
  triggerClassName?: string;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  function trapFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (scans.length === 0) return null;

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {label}
      </button>
      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onKeyDown={trapFocus}
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/85 p-4"
          onClick={close}
        >
          <section
            className="mx-auto max-w-5xl overflow-hidden rounded-xl bg-petal shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-hairline bg-sand px-4 py-2.5">
              <h2 id={titleId} className="font-display text-2xl font-semibold">Printed source pages</h2>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close printed source pages"
                className="grid min-h-11 min-w-11 place-items-center rounded-full border border-hairline bg-card text-2xl leading-none text-copper"
                onClick={close}
              >
                ×
              </button>
            </div>
            <div className="space-y-4 p-4">
              {scans.map((scan, index) => (
                // eslint-disable-next-line @next/next/no-img-element -- full-size source scan, no optimization wanted
                <img
                  key={scan}
                  src={`/${scan}`}
                  alt={`Printed source page ${index + 1} of ${scans.length}`}
                  loading="lazy"
                  className="mx-auto max-w-full rounded-lg"
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
