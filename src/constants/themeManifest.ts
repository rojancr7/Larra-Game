import { ImageSourcePropType } from "react-native";

export type ThemeId =
  | "emerald_mahogany"
  | "midnight_walnut"
  | "royal_plum"
  | "burgundy_rosewood"
  | "stone_brass";

export interface ThemeUIColors {
  accent: string;
  panel: string;
  text: string;
  bg: string;
  wood: string;
  accentLight: string;
}

export interface ThemeDef {
  id: ThemeId;
  name: string;
  boardSource: ImageSourcePropType;
  cardBackSource: ImageSourcePropType;
  previewSheetSource: ImageSourcePropType;
  ui: ThemeUIColors;
}

export const PREVIEW_SHEET = require("../../assets/themes/larra_all_5_sets.png");

export const THEMES: ThemeDef[] = [
  {
    id: "emerald_mahogany",
    name: "Emerald Mahogany",
    boardSource: require("../../assets/themes/set1_board.png"),
    cardBackSource: require("../../assets/themes/set1_card_back.png"),
    previewSheetSource: PREVIEW_SHEET,
    ui: {
      accent: "#d4a64a",
      panel: "#133c2a",
      text: "#f3e7c9",
      bg: "#1f5a3f",
      wood: "#3b190d",
      accentLight: "#ecdca8",
    },
  },
  {
    id: "midnight_walnut",
    name: "Midnight Walnut",
    boardSource: require("../../assets/themes/set2_board.png"),
    cardBackSource: require("../../assets/themes/set2_card_back.png"),
    previewSheetSource: PREVIEW_SHEET,
    ui: {
      accent: "#d9b15a",
      panel: "#0c1b40",
      text: "#efe6d0",
      bg: "#17306a",
      wood: "#26160c",
      accentLight: "#cf8a5c",
    },
  },
  {
    id: "royal_plum",
    name: "Royal Plum",
    boardSource: require("../../assets/themes/set3_board.png"),
    cardBackSource: require("../../assets/themes/set3_card_back.png"),
    previewSheetSource: PREVIEW_SHEET,
    ui: {
      accent: "#cf8a5c",
      panel: "#27133a",
      text: "#efe3dc",
      bg: "#43235a",
      wood: "#251410",
      accentLight: "#d5d9e2",
    },
  },
  {
    id: "burgundy_rosewood",
    name: "Burgundy Rosewood",
    boardSource: require("../../assets/themes/set4_board.png"),
    cardBackSource: require("../../assets/themes/set4_card_back.png"),
    previewSheetSource: PREVIEW_SHEET,
    ui: {
      accent: "#d8935f",
      panel: "#3f0f1e",
      text: "#f1e2d4",
      bg: "#6a1c32",
      wood: "#2a0c14",
      accentLight: "#cdbb6e",
    },
  },
  {
    id: "stone_brass",
    name: "Stone Brass",
    boardSource: require("../../assets/themes/set5_board.png"),
    cardBackSource: require("../../assets/themes/set5_card_back.png"),
    previewSheetSource: PREVIEW_SHEET,
    ui: {
      accent: "#c9a24d",
      panel: "#252e2e",
      text: "#ece6d6",
      bg: "#3f4a4a",
      wood: "#202525",
      accentLight: "#e6dcc0",
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = "emerald_mahogany";

export function getThemeById(id?: string | null): ThemeDef {
  if (!id) return THEMES[0];
  const found = THEMES.find((t) => t.id === id);
  return found || THEMES[0];
}
  
