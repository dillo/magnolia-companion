import type { Dimension } from "@/lib/schema";
import { DIMENSION_META } from "@/lib/dimensions";

export default function DimensionChip({ dimension }: { dimension: Dimension }) {
  const m = DIMENSION_META[dimension];
  return (
    <span className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-bold"
      style={{ background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}
