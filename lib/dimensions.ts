import type { Dimension } from "./schema";

/** Soft tint (bg), AA-contrast text (fg), and calendar dot color per dimension. */
export const DIMENSION_META: Record<Dimension, { label: string; bg: string; fg: string; dot: string }> = {
  physical:      { label: "Physical",      bg: "#D9E5F1", fg: "#2B4E75", dot: "#4A7FB5" },
  emotional:     { label: "Emotional",     bg: "#F4DBD8", fg: "#8A3128", dot: "#C25B50" },
  spiritual:     { label: "Spiritual",     bg: "#E0E5EF", fg: "#37476B", dot: "#6C7FB5" },
  move:          { label: "Move",          bg: "#DCE8D2", fg: "#2F4A24", dot: "#5C8A47" },
  learn:         { label: "Learn",         bg: "#F4E3CE", fg: "#7A4A16", dot: "#C8823B" },
  social:        { label: "Social",        bg: "#F2DEE8", fg: "#813458", dot: "#C06A97" },
  intellectual:  { label: "Intellectual",  bg: "#E2E1F4", fg: "#3F3A75", dot: "#7A74C4" },
  entertainment: { label: "Entertainment", bg: "#EADDF0", fg: "#5D3372", dot: "#9B62B8" },
  nutritional:   { label: "Nutritional",   bg: "#F1E9C6", fg: "#6A5A14", dot: "#BFA93C" },
  connect:       { label: "Connect",       bg: "#D7E9E3", fg: "#1F5D4A", dot: "#3E8A6E" },
};
