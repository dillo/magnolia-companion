"use client";

import { useEffect, useId, useRef, useState } from "react";

const TEXT_SIZES = [
  { key: "", label: "A", name: "Standard" },
  { key: "lg", label: "A+", name: "Large" },
  { key: "xl", label: "A++", name: "Extra large" },
] as const;

type TextSize = (typeof TEXT_SIZES)[number]["key"];

function readSetting(key: string) {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function saveSetting(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {}
}

function announceSettingsChange() {
  window.dispatchEvent(new Event("mc-accessibility-change"));
}

export default function AccessibilityControl() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [textSize, setTextSize] = useState<TextSize>("");
  const [contrast, setContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- saved settings live in localStorage, readable only after mount
    setTextSize(readSetting("mc-textsize") as TextSize);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- saved settings live in localStorage, readable only after mount
    setContrast(readSetting("mc-contrast") === "high");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- saved settings live in localStorage, readable only after mount
    setReducedMotion(readSetting("mc-reduced-motion") === "true");
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function applyTextSize(key: TextSize) {
    setTextSize(key);
    // eslint-disable-next-line react-hooks/immutability -- root data attributes drive global accessibility CSS tokens
    document.documentElement.dataset.textsize = key;
    saveSetting("mc-textsize", key);
    announceSettingsChange();
  }

  function applyContrast(enabled: boolean) {
    setContrast(enabled);
    // eslint-disable-next-line react-hooks/immutability -- root data attributes drive global accessibility CSS tokens
    document.documentElement.dataset.contrast = enabled ? "high" : "";
    saveSetting("mc-contrast", enabled ? "high" : "");
    announceSettingsChange();
  }

  function applyReducedMotion(enabled: boolean) {
    setReducedMotion(enabled);
    // eslint-disable-next-line react-hooks/immutability -- root data attributes drive global accessibility CSS tokens
    document.documentElement.dataset.reducedMotion = enabled ? "true" : "";
    saveSetting("mc-reduced-motion", enabled ? "true" : "");
    announceSettingsChange();
  }

  function resetSettings() {
    setTextSize("");
    setContrast(false);
    setReducedMotion(false);
    // eslint-disable-next-line react-hooks/immutability -- root data attributes drive global accessibility CSS tokens
    document.documentElement.dataset.textsize = "";
    // eslint-disable-next-line react-hooks/immutability -- root data attributes drive global accessibility CSS tokens
    document.documentElement.dataset.contrast = "";
    // eslint-disable-next-line react-hooks/immutability -- root data attributes drive global accessibility CSS tokens
    document.documentElement.dataset.reducedMotion = "";
    saveSetting("mc-textsize", "");
    saveSetting("mc-contrast", "");
    saveSetting("mc-reduced-motion", "");
    announceSettingsChange();
  }

  return (
    <div ref={rootRef} className="fixed right-4 bottom-4 z-50 flex flex-col items-end print:hidden">
      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="relative mb-3 w-[min(calc(100vw-2rem),22rem)] rounded-lg border border-hairline bg-card p-4 text-ink shadow-2xl"
        >
          <span
            aria-hidden="true"
            className="absolute -bottom-2 right-4 h-4 w-4 rotate-45 border-b border-r border-hairline bg-card"
          />
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 id={titleId} className="font-display text-2xl font-semibold">
                Accessibility
              </h2>
              <p className="mt-1 text-sm text-moss">Display settings for easier reading.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close accessibility settings"
              className="grid min-h-11 min-w-11 place-items-center rounded-full border border-hairline text-2xl text-copper"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 font-semibold">Text size</legend>
              <div className="grid grid-cols-3 gap-2">
                {TEXT_SIZES.map((size) => (
                  <button
                    key={size.key}
                    type="button"
                    aria-label={`${size.name} text`}
                    aria-pressed={textSize === size.key}
                    onClick={() => applyTextSize(size.key)}
                    className={`min-h-12 rounded-lg border px-3 font-semibold ${
                      textSize === size.key
                        ? "border-ink bg-ink text-petal"
                        : "border-hairline bg-petal text-ink"
                    }`}
                  >
                    <span className={size.key === "xl" ? "text-xl" : size.key === "lg" ? "text-lg" : ""}>
                      {size.label}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-hairline bg-petal px-3 py-2">
              <span>
                <span className="block font-semibold">High contrast</span>
                <span className="block text-sm text-moss">Darker text and stronger borders.</span>
              </span>
              <input
                type="checkbox"
                checked={contrast}
                onChange={(event) => applyContrast(event.target.checked)}
                className="h-6 w-6 accent-copper"
              />
            </label>

            <label className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-hairline bg-petal px-3 py-2">
              <span>
                <span className="block font-semibold">Reduce motion</span>
                <span className="block text-sm text-moss">Minimize page transitions.</span>
              </span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(event) => applyReducedMotion(event.target.checked)}
                className="h-6 w-6 accent-copper"
              />
            </label>

            <button
              type="button"
              onClick={resetSettings}
              className="min-h-12 w-full rounded-lg border border-copper px-4 font-semibold text-copper"
            >
              Reset accessibility settings
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Accessibility settings"
        className="grid h-14 w-14 place-items-center rounded-full border-[3px] border-petal bg-copper text-petal shadow-xl ring-4 ring-copper/25"
      >
        <svg aria-hidden="true" viewBox="0 0 32 32" className="h-9 w-9" fill="none">
          <circle cx="16" cy="7" r="3.25" fill="currentColor" />
          <path
            d="M7.5 12.5c4.8 1.45 12.2 1.45 17 0M16 12.75v12.5M11.5 27l4.5-8 4.5 8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
