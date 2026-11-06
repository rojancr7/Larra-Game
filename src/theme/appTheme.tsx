/**
 * appTheme.ts
 * Single source of truth for all colours, typography, shared styles, and
 * light/dark-mode context for the Larra app.
 *
 * Exports
 * -------
 *  C             – static dark-palette colour constants (used by TopBar,
 *                  HomeScreen, HistoryScreen, StoreScreen – files that do NOT
 *                  react to theme changes at runtime)
 *  serif         – cross-platform serif font family string
 *  shared        – StyleSheet helpers reused by every screen
 *  Palette       – TypeScript type for the dynamic colour object `c`
 *  ThemeMode     – "system" | "light" | "dark"
 *  ThemeProvider – wrap the root of the app with this
 *  useTheme      – returns { c, shared, isWide, mode, setMode, scheme }
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform, StyleSheet, useColorScheme, useWindowDimensions } from "react-native";

// ---------------------------------------------------------------------------
// 1.  Static colour palette  (dark-first, matches the original Palette 8)
// ---------------------------------------------------------------------------

/** Global static colours – use these in stylesheets defined at module scope. */
export const C = {
  // Base surfaces
  bg: "#1A1A1F",
  surface: "#2D2B55",
  surfaceAlt: "rgba(45, 43, 85, 0.65)",

  // Borders
  border: "#3F3C75",
  borderSoft: "rgba(240, 217, 181, 0.1)",

  // Text
  text: "#F0D9B5",
  white: "#F0D9B5",
  muted: "#B9A9CF",
  dim: "#8A7FA8",

  // Amber (friends / cta)
  amber: "#F4A62A",
  amberLight: "#F0D9B5",
  amberSoft: "rgba(244, 166, 42, 0.15)",
  amberLine: "rgba(244, 166, 42, 0.4)",

  // Emerald / orchid (offline mode)
  emerald: "#A678B9",
  emeraldLight: "#D9B8E6",
  emeraldSoft: "rgba(166, 120, 185, 0.22)",

  // Indigo (quick-match)
  indigo: "#6A5ACD",
  indigoLight: "#C3B9F0",
  indigoSoft: "rgba(106, 90, 205, 0.25)",

  // Rose / danger
  rose: "#E5646E",
  roseSoft: "rgba(229, 100, 110, 0.18)",

  // Purple
  purple: "#A678B9",
  purpleSoft: "rgba(166, 120, 185, 0.18)",

  // UI helpers
  banner: "#4A3F99",
  stone: "rgba(26, 26, 31, 0.8)",
  backdrop: "rgba(26, 26, 31, 0.9)",
  activeBorder: "rgba(166, 120, 185, 0.7)",
};

// ---------------------------------------------------------------------------
// 2.  Typography
// ---------------------------------------------------------------------------

/** Cross-platform serif font for headings. */
export const serif = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
}) as string;

// ---------------------------------------------------------------------------
// 3.  Palette type  (the dynamic `c` object returned by useTheme)
// ---------------------------------------------------------------------------

/** Full dynamic colour palette – typed for use in makeStyles factories. */
export type Palette = {
  // Surfaces & backgrounds
  bg: string;
  surface: string;
  surfaceAlt: string;
  inset: string;

  // Borders
  border: string;
  borderSoft: string;

  // Text
  text: string;
  textMuted: string;
  textDim: string;

  // Accent (primary interactive colour)
  accent: string;
  accentText: string;
  accentSoft: string;

  // Success
  success: string;
  successSoft: string;
  successText: string;

  // Danger
  danger: string;
  dangerSoft: string;
  dangerText: string;

  // On-accent (text drawn on top of the accent colour)
  onAccent: string;

  // Info (neutral-blue informational)
  info: string;

  // Purple (instant wins / declarations)
  purple: string;
  purpleSoft: string;
};

// ---------------------------------------------------------------------------
// 4.  Concrete dark & light palettes
// ---------------------------------------------------------------------------

const darkPalette: Palette = {
  bg: "#1A1A1F",
  surface: "#2D2B55",
  surfaceAlt: "rgba(45, 43, 85, 0.65)",
  inset: "rgba(0, 0, 0, 0.3)",

  border: "#3F3C75",
  borderSoft: "rgba(240, 217, 181, 0.1)",

  text: "#F0D9B5",
  textMuted: "#B9A9CF",
  textDim: "#8A7FA8",

  accent: "#A678B9",
  accentText: "#D9B8E6",
  accentSoft: "rgba(166, 120, 185, 0.22)",

  success: "#4ade80",
  successSoft: "rgba(74, 222, 128, 0.15)",
  successText: "#4ade80",

  danger: "#E5646E",
  dangerSoft: "rgba(229, 100, 110, 0.18)",
  dangerText: "#fda4af",

  onAccent: "#1A1A1F",

  info: "#38bdf8",
  purple: "#A678B9",
  purpleSoft: "rgba(166, 120, 185, 0.22)",
};

const lightPalette: Palette = {
  bg: "#F7F5FF",
  surface: "#FFFFFF",
  surfaceAlt: "rgba(255, 255, 255, 0.85)",
  inset: "rgba(0, 0, 0, 0.06)",

  border: "#C4B8E8",
  borderSoft: "rgba(100, 80, 180, 0.1)",

  text: "#1A1A2F",
  textMuted: "#5A4F7A",
  textDim: "#8A7FA8",

  accent: "#6A5ACD",
  accentText: "#4B39A8",
  accentSoft: "rgba(106, 90, 205, 0.12)",

  success: "#16a34a",
  successSoft: "rgba(22, 163, 74, 0.12)",
  successText: "#166534",

  danger: "#E5646E",
  dangerSoft: "rgba(229, 100, 110, 0.12)",
  dangerText: "#9f1239",

  onAccent: "#FFFFFF",

  info: "#0ea5e9",
  purple: "#6A5ACD",
  purpleSoft: "rgba(106, 90, 205, 0.12)",
};

// ---------------------------------------------------------------------------
// 5.  Shared StyleSheet helpers
// ---------------------------------------------------------------------------

/** Shared layout styles used by every tab screen. These are dark-palette
 *  values and are intentionally static – dynamic colours live inside `c`. */
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

// ---------------------------------------------------------------------------
// 6.  ThemeMode type
// ---------------------------------------------------------------------------

export type ThemeMode = "system" | "light" | "dark";

const THEME_MODE_KEY = "@larra_theme_mode";

// ---------------------------------------------------------------------------
// 7.  Context
// ---------------------------------------------------------------------------

type ThemeContextValue = {
  c: Palette;
  shared: typeof shared;
  isWide: boolean;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  /** The actual resolved scheme in use ("light" or "dark"). */
  scheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue>({
  c: darkPalette,
  shared,
  isWide: false,
  mode: "system",
  setMode: () => undefined,
  scheme: "dark",
});

// ---------------------------------------------------------------------------
// 8.  ThemeProvider
// ---------------------------------------------------------------------------

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const systemScheme = useColorScheme(); // "light" | "dark" | null
  const [mode, setModeState] = useState<ThemeMode>("system");

  // Load persisted mode from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_MODE_KEY)
      .then((val) => {
        if (val === "light" || val === "dark" || val === "system") {
          setModeState(val);
        }
      })
      .catch(() => {
        // ignore – fall back to system
      });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(THEME_MODE_KEY, m).catch(() => undefined);
  }, []);

  const scheme: "light" | "dark" =
    mode === "system" ? (systemScheme === "light" ? "light" : "dark") : mode;

  const c: Palette = scheme === "light" ? lightPalette : darkPalette;
  const isWide = width >= 768;

  const value = useMemo<ThemeContextValue>(
    () => ({ c, shared, isWide, mode, setMode, scheme }),
    [c, isWide, mode, setMode, scheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// 9.  Hook
// ---------------------------------------------------------------------------

/** Returns { c, shared, isWide, mode, setMode, scheme }. */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
