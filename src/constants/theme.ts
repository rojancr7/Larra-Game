import { useWindowDimensions } from "react-native";
import type { BoardColor } from "../services/storage";

export const colors = {
  gold: "#eab308",
  goldLight: "#fde047",
  goldMid: "#fbbf24",
  goldDark: "#ca8a04",
  cream: "#fff3c4",
  woodDeep: "#2a1608",
  woodMid: "#5a3719",
  woodLight: "#7a4d27",
  panelDark: "rgba(14, 26, 18, 0.92)",
  green: "#16a34a",
  greenLight: "#4ade80",
  red: "#ef4444",
  blue: "#2563eb",
  blueLight: "#38bdf8",
};

/** Felt colors for each Settings > Table Felt option (center is lighter, edge is darker). */
export const feltPalette: Record<BoardColor, { center: string; edge: string }> =
  {
    "classic-green": { center: "#1c6e3b", edge: "#0a3a1d" },
    emerald: { center: "#0f7a58", edge: "#053b2c" },
    "royal-blue": { center: "#2f56b8", edge: "#12275c" },
    "velvet-burgundy": { center: "#7a1632", edge: "#330713" },
    "midnight-slate": { center: "#2b3a55", edge: "#0b1220" },
  };

/** Scale factor for a landscape layout designed at 844 x 390. Works even if width/height are swapped. */
export function useTableScale() {
  const { width, height } = useWindowDimensions();
  const W = Math.max(width, height);
  const H = Math.min(width, height);
  const s = Math.max(0.7, Math.min(W / 844, H / 390, 1.4));
  return { W, H, s };
}
