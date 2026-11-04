import {
  DEFAULT_THEME_ID,
  getThemeById,
  ThemeDef,
  ThemeId,
  THEMES,
} from "./themeManifest";

export * from "./themeManifest";

/**
 * Audio assets from assets/Card Spread sounds/ and assets/Sounds/
 */
export const AUDIO_ASSETS = {
  cardSpread: require("../../assets/Card Spread sounds/zapsplat_pack_playing_cards_mp3/zapsplat_leisure_playing_cards_deck_spread_out_on_table_001_20500.mp3"),
  cardSpread2: require("../../assets/Card Spread sounds/zapsplat_pack_playing_cards_mp3/zapsplat_leisure_playing_cards_deck_spread_out_on_table_002_20501.mp3"),
  cardPlace: require("../../assets/Card Spread sounds/zapsplat_pack_playing_cards_mp3/zapsplat_leisure_playing_card_single_place_down_on_table_001_20464.mp3"),
  cardDealSingle: require("../../assets/Card Spread sounds/zapsplat_pack_playing_cards_mp3/zapsplat_leisure_playing_card_dealing_table_single_001_20443.mp3"),
  cardSlide: require("../../assets/Card Spread sounds/zapsplat_pack_playing_cards_mp3/zapsplat_leisure_playing_card_single_slide_pass_on_table_20471.mp3"),
  cardShuffle: require("../../assets/Card Spread sounds/zapsplat_pack_playing_cards_mp3/zapsplat_leisure_playing_cards_shuffle_fast_20525.mp3"),
  musicTrack1: require("../../assets/Sounds/sound1.mp3"),
  musicTrack2: require("../../assets/Sounds/sound2.mp3"),
};

export interface MusicTrackInfo {
  id: "none" | "sound1" | "sound2";
  name: string;
  description: string;
}

export const MUSIC_TRACKS: MusicTrackInfo[] = [
  {
    id: "sound1",
    name: "Casino Lounge",
    description: "Relaxing atmospheric casino lounge soundtrack",
  },
  {
    id: "sound2",
    name: "Night Arena",
    description: "Atmospheric pulse & tournament night melody",
  },
  {
    id: "none",
    name: "Music Off",
    description: "Mute background music and focus on card sounds",
  },
];

/**
 * Helper to get active theme
 */
export function getActiveTheme(themeId?: string): ThemeDef {
  return getThemeById(themeId || DEFAULT_THEME_ID);
}
