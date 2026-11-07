import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ImageSourcePropType } from "react-native";
import { DEFAULT_THEME_ID, ThemeId } from "../constants/themeManifest";

// ---------------------------------------------------------------------------
// 1. SETTINGS TYPES & DEFAULTS
// ---------------------------------------------------------------------------

export type GameTheme = "casino" | "minimal" | "regal";
// Legacy aliases for old code – board and card back now share a theme ID
export type BoardColor = ThemeId;
export type CardBackColor = ThemeId;
export type AIDifficulty = "easy" | "med" | "hard";
export type SpreadSpeed = "slow" | "medium" | "fast" | "instant";
export type MusicTrackId = "none" | "sound1" | "sound2";

export interface GameSettings {
  themeId: ThemeId;
  cardFace: "classic" | "modern";
  playerName: string;
  soundEffects: boolean;
  musicEnabled: boolean;
  musicTrack: MusicTrackId;
  vibration: boolean;
  animations: boolean;
  boardColor?: ThemeId;
  cardBack?: ThemeId;
  difficulty?: AIDifficulty;
  spreadSpeed: SpreadSpeed;
  spreadSound: boolean;
  cardMoveSound: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  themeId: DEFAULT_THEME_ID,
  cardFace: "classic",
  playerName: "Player 1",
  soundEffects: true,
  musicEnabled: true,
  musicTrack: "sound1",
  vibration: true,
  animations: true,
  difficulty: "easy",
  spreadSpeed: "medium",
  spreadSound: true,
  cardMoveSound: true,
};

// ---------------------------------------------------------------------------
// 2. PLAYER PROFILE TYPES & DEFAULTS
// ---------------------------------------------------------------------------

export interface PlayerProfile {
  playerId: string;
  name: string;
  /** Preset id (e.g. 'king'). Used when no custom photo is set. */
  avatar: string;
  /**
   * File NAME (not full path) of a custom photo stored on this device,
   * e.g. 'avatar_1718000000000.jpg'. Full path is rebuilt at render time
   * (see utils/avatarStorage.ts) because iOS changes the app container
   * path between updates.
   */
  avatarFile?: string;
  matchesPlayed: number;
  matchesWon: number;
  totalPoints: number;
  cleanSweeps: number;
  instantVictories: number;
  createdAt: number;
}

export interface AvatarPreset {
  id: string;
  label: string; // plain text, no emoji
  color: string; // ring / glow color
  image: ImageSourcePropType;
}

// require() needs static paths in React Native, so each one is explicit.
export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  {
    id: "king",
    label: "King",
    color: "#fbbf24",
    image: require("../../assets/avatar/king.jpg"),
  },
  {
    id: "queen",
    label: "Queen",
    color: "#f472b6",
    image: require("../../assets/avatar/queen.jpg"),
  },
  {
    id: "ace",
    label: "Ace",
    color: "#60a5fa",
    image: require("../../assets/avatar/ace.jpg"),
  },
  {
    id: "tiger",
    label: "Tiger",
    color: "#fb923c",
    image: require("../../assets/avatar/tiger.jpg"),
  },
  {
    id: "lion",
    label: "Lion",
    color: "#facc15",
    image: require("../../assets/avatar/lion.jpg"),
  },
  {
    id: "eagle",
    label: "Eagle",
    color: "#a78bfa",
    image: require("../../assets/avatar/edgle.jpg"), // filename has typo on disk
  },
  {
    id: "wolf",
    label: "Wolf",
    color: "#94a3b8",
    image: require("../../assets/avatar/wolf.jpg"),
  },
  {
    id: "dragon",
    label: "Dragon",
    color: "#ef4444",
    image: require("../../assets/avatar/dragon.jpg"),
  },
];

export function getAvatarPreset(id: string): AvatarPreset {
  return AVATAR_PRESETS.find((a) => a.id === id) ?? AVATAR_PRESETS[0];
}

export function generatePlayerId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "LARRA-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const DEFAULT_PROFILE: PlayerProfile = {
  playerId: "LARRA-USER01",
  name: "Player 1",
  avatar: "king",
  avatarFile: undefined,
  matchesPlayed: 0,
  matchesWon: 0,
  totalPoints: 0,
  cleanSweeps: 0,
  instantVictories: 0,
  createdAt: Date.now(),
};

// ---------------------------------------------------------------------------
// 3. GAME HISTORY TYPES (LAST 20 MATCHES)
// ---------------------------------------------------------------------------

export interface HistoryRoundResult {
  round: number;
  winnerIndex: number | null;
  winnerName: string;
  outcome: "WIN" | "FIRE";
  points: number;
}

export interface HistoryBonusItem {
  playerIndex: number;
  playerName: string;
  bonusType: string;
  points: number;
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  timestamp: number;
  durationSeconds: number;
  playerNames: string[];
  finalScores: { playerId: string; name: string; points: number }[];
  winnerIndex: number;
  winnerName: string;
  isHumanWinner: boolean;
  cleanSweepWinner: number | null;
  instantVictoryWinner: number | null;
  rounds: HistoryRoundResult[];
  bonuses: HistoryBonusItem[];
}

export const MAX_HISTORY_ITEMS = 20;

// ---------------------------------------------------------------------------
// STORAGE KEYS
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  SETTINGS: "@larra_game_settings_v1",
  PROFILE: "@larra_game_profile_v1",
  HISTORY: "@larra_game_history_v1",
};

// ---------------------------------------------------------------------------
// 4. STORAGE OPERATIONS
// ---------------------------------------------------------------------------

// --- Settings Operations ---
export async function loadSettings(): Promise<GameSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.warn("Failed to load settings from storage:", err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn("Failed to save settings to storage:", err);
  }
}

export async function resetSettings(): Promise<GameSettings> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
  } catch (err) {
    console.warn("Failed to reset settings in storage:", err);
  }
  return DEFAULT_SETTINGS;
}

// --- Profile Operations ---
export async function loadProfile(): Promise<PlayerProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      const freshProfile: PlayerProfile = {
        ...DEFAULT_PROFILE,
        playerId: generatePlayerId(),
        createdAt: Date.now(),
      };
      await saveProfile(freshProfile);
      return freshProfile;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch (err) {
    console.warn("Failed to load profile from storage:", err);
    return DEFAULT_PROFILE;
  }
}

export async function saveProfile(profile: PlayerProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.warn("Failed to save profile to storage:", err);
  }
}

export async function updateProfileStats(stats: {
  isWin: boolean;
  pointsScored: number;
  hadCleanSweep?: boolean;
  hadInstantVictory?: boolean;
}): Promise<PlayerProfile> {
  const current = await loadProfile();
  const updated: PlayerProfile = {
    ...current,
    matchesPlayed: current.matchesPlayed + 1,
    matchesWon: current.matchesWon + (stats.isWin ? 1 : 0),
    totalPoints: current.totalPoints + stats.pointsScored,
    cleanSweeps: current.cleanSweeps + (stats.hadCleanSweep ? 1 : 0),
    instantVictories:
      current.instantVictories + (stats.hadInstantVictory ? 1 : 0),
  };
  await saveProfile(updated);
  return updated;
}

// --- History Operations (FIFO 20 Matches) ---
export async function loadHistory(): Promise<MatchHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list;
  } catch (err) {
    console.warn("Failed to load history from storage:", err);
    return [];
  }
}

/**
 * Saves a completed match to history.
 * Maintains a strict FIFO limit of MAX_HISTORY_ITEMS (20).
 * The newest match is placed at index 0. If the list exceeds 20,
 * the oldest match (at the tail) is automatically removed.
 */
export async function saveMatchToHistory(
  match: MatchHistoryItem,
): Promise<MatchHistoryItem[]> {
  try {
    const current = await loadHistory();
    const updated = [match, ...current];
    const trimmed = updated.slice(0, MAX_HISTORY_ITEMS);
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
    return trimmed;
  } catch (err) {
    console.warn("Failed to save match to history:", err);
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (err) {
    console.warn("Failed to clear history in storage:", err);
  }
}
