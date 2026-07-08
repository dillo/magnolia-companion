"use client";

import { useEffect, useState } from "react";

const SIZES = [
  { key: "", label: "A", name: "Standard text" },
  { key: "lg", label: "A+", name: "Large text" },
  { key: "xl", label: "A++", name: "Extra large text" },
] as const;

export default function TextSizeControl() {
  const [size, setSize] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- saved size lives in localStorage, readable only after mount
    try { setSize(localStorage.getItem("mc-textsize") ?? ""); } catch {}
  }, []);
  function apply(key: string) {
    setSize(key);
    // eslint-disable-next-line react-hooks/immutability -- root data attribute drives the CSS font-size tokens
    document.documentElement.dataset.textsize = key;
    try { localStorage.setItem("mc-textsize", key); } catch {}
  }
  return (
    <div role="group" aria-label="Text size" className="flex rounded-full border border-hairline">
      {SIZES.map((s) => (
        <button key={s.key} aria-label={s.name} aria-pressed={size === s.key} onClick={() => apply(s.key)}
          className={`px-3 py-1.5 font-semibold first:rounded-l-full last:rounded-r-full ${
            size === s.key ? "bg-ink text-petal" : "text-moss"
          }`}>
          {s.label}
        </button>
      ))}
    </div>
  );
}
