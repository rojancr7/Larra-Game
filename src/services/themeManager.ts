import { useEffect, useState } from "react";
import {
  DEFAULT_THEME_ID,
  getThemeById,
  ThemeDef,
  ThemeId,
  THEMES,
} from "../constants/themeManifest";
import { loadSettings, saveSettings } from "./storage";

type ThemeListener = (theme: ThemeDef) => void;

class ThemeManagerClass {
  private _currentTheme: ThemeDef = getThemeById(DEFAULT_THEME_ID);
  private _listeners: Set<ThemeListener> = new Set();
  private _isInitialized = false;

  get currentTheme(): ThemeDef {
    return this._currentTheme;
  }

  get currentThemeId(): ThemeId {
    return this._currentTheme.id;
  }

  /**
   * Initializes theme manager from storage
   */
  async init(): Promise<ThemeDef> {
    if (this._isInitialized) return this._currentTheme;
    try {
      const settings = await loadSettings();
      const savedId = (settings as any).themeId;
      const validTheme = getThemeById(savedId);
      this._currentTheme = validTheme;
      this._isInitialized = true;
      this.notify();
    } catch {
      this._currentTheme = getThemeById(DEFAULT_THEME_ID);
      this._isInitialized = true;
    }
    return this._currentTheme;
  }

  /**
   * Set the active theme. Updates board and card back simultaneously.
   * If invalid id is passed, falls back to default.
   */
  async setTheme(id: string): Promise<ThemeDef> {
    const isValid = THEMES.some((t) => t.id === id);
    const targetId: ThemeId = isValid ? (id as ThemeId) : DEFAULT_THEME_ID;
    const newTheme = getThemeById(targetId);

    this._currentTheme = newTheme;

    // Persist to storage
    try {
      const settings = await loadSettings();
      await saveSettings({
        ...settings,
        themeId: targetId,
      } as any);
    } catch (err) {
      console.warn("Failed to persist theme setting:", err);
    }

    this.notify();
    return newTheme;
  }

  /**
   * Subscribe to theme changes
   */
  onThemeChanged(listener: ThemeListener): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this._listeners) {
      try {
        listener(this._currentTheme);
      } catch (err) {
        console.error("Theme listener error:", err);
      }
    }
  }
}

export const ThemeManager = new ThemeManagerClass();

/**
 * React hook to subscribe to ThemeManager changes
 */
export function useAppTheme(): ThemeDef {
  const [theme, setThemeState] = useState<ThemeDef>(ThemeManager.currentTheme);

  useEffect(() => {
    // Sync immediately in case initialized after render
    setThemeState(ThemeManager.currentTheme);

    const unsubscribe = ThemeManager.onThemeChanged((newTheme) => {
      setThemeState(newTheme);
    });

    // Ensure initialized
    ThemeManager.init().then((t) => setThemeState(t));

    return unsubscribe;
  }, []);

  return theme;
}

