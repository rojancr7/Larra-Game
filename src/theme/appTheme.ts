import { Platform, StyleSheet } from "react-native";

// Palette 8: #1A1A1F · #2D2B55 · #6A5ACD · #A678B9 · #F0D9B5 · #F4A62A
export const C = {
  bg: "#1A1A1F", // near-black
  surface: "#2D2B55", // deep indigo
  surfaceAlt: "rgba(45, 43, 85, 0.65)",
  border: "#3F3C75", // surface lightened slightly for visible borders
  borderSoft: "rgba(240, 217, 181, 0.1)",
  text: "#F0D9B5", // cream
  white: "#F0D9B5", // primary text
  muted: "#B9A9CF", // orchid lightened for small-text contrast
  dim: "#8A7FA8",

  // Mode 2 accent (friends): amber
  amber: "#F4A62A",
  amberLight: "#F0D9B5",
  amberSoft: "rgba(244, 166, 42, 0.15)",
  amberLine: "rgba(244, 166, 42, 0.4)",

  // Mode 1 accent (offline): orchid
  emerald: "#A678B9",
  emeraldLight: "#D9B8E6",
  emeraldSoft: "rgba(166, 120, 185, 0.22)",

  // Mode 3 accent (quick match): slate blue
  indigo: "#6A5ACD",
  indigoLight: "#C3B9F0",
  indigoSoft: "rgba(106, 90, 205, 0.25)",

  rose: "#E5646E", // kept warm red so errors and losses still read
  roseSoft: "rgba(229, 100, 110, 0.18)",
  purple: "#A678B9",
  purpleSoft: "rgba(166, 120, 185, 0.18)",

  // New tokens used by HomeScreen
  banner: "#4A3F99", // #6A5ACD darkened so text on it stays readable
  stone: "rgba(26, 26, 31, 0.8)",
  backdrop: "rgba(26, 26, 31, 0.9)",
  activeBorder: "rgba(166, 120, 185, 0.7)",
};

export const serif = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
}) as string;

// Styles reused by every tab
export const shared = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  card: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.borderSoft,
    padding: 16,
  },
  pageTitle: { color: C.white, fontSize: 18, fontWeight: "800" },
  pageSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  sectionLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
});
