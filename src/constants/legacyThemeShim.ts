// Compatibility shim for legacy BOARD_THEMES / CARD_BACK_THEMES imports
// The new theme system lives in themeManifest.ts.  This file provides the
// same API the old code expects so that components like ThreeDotMenuModal
// continue to work while we migrate to the new ThemeManager.

import { ThemeDef, ThemeId, THEMES, getThemeById } from "./themeManifest";

export const BOARD_THEMES: ThemeDef[] = THEMES;
export const CARD_BACK_THEMES: ThemeDef[] = THEMES;


export const getBoardTheme = (id: string) => {
  const theme = getThemeById(id as ThemeId);
  return {
    id: theme.id,
    name: theme.name,
    source: theme.boardSource,
    accentColor: theme.ui.accent,
    description: `${theme.name} board`,
  } as any; // keep shape compatible with legacy code
};

export const getCardBackTheme = (id: string) => {
  const theme = getThemeById(id as ThemeId);
  return {
    id: theme.id,
    name: theme.name,
    source: theme.cardBackSource,
    borderColor: theme.ui.accent,
    description: `${theme.name} card back`,
  } as any;
};
