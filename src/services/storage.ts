import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// 1. SETTINGS TYPES & DEFAULTS
// ---------------------------------------------------------------------------

export type BoardColor =
  | 'classic-green'
  | 'emerald'
  | 'royal-blue'
  | 'velvet-burgundy'
  | 'midnight-slate';

export type CardBackColor =
  | 'classic-blue'
  | 'royal-red'
  | 'gold-luxury'
  | 'emerald-leaf';

export type GameTheme = 'casino' | 'minimal' | 'regal';
export type AIDifficulty = 'easy' | 'med' | 'hard';

export interface GameSettings {
  boardColor: BoardColor;
  cardBack: CardBackColor;
  cardFace: 'classic' | 'modern';
  playerName: string;
  soundEffects: boolean;
  vibration: boolean;
  animations: boolean;
  theme: GameTheme;
  difficulty?: AIDifficulty;
}

export const DEFAULT_SETTINGS: GameSettings = {
  boardColor: 'classic-green',
  cardBack: 'gold-luxury',
  cardFace: 'classic',
  playerName: 'Player 1',
  soundEffects: true,
  vibration: true,
  animations: true,
  theme: 'casino',
  difficulty: 'easy',
};

// ---------------------------------------------------------------------------
// 2. PLAYER PROFILE TYPES & DEFAULTS
// ---------------------------------------------------------------------------

export interface PlayerProfile {
  playerId: string;
  name: string;
  avatar: string; // Avatar icon/preset id (e.g. 'king', 'queen', 'ace', 'tiger', 'lion', 'eagle')
  matchesPlayed: number;
  matchesWon: number;
  totalPoints: number;
  cleanSweeps: number;
  instantVictories: number;
  createdAt: number;
}

export const AVATAR_PRESETS = [
  { id: 'king', label: '👑 King', color: '#fbbf24' },
  { id: 'queen', label: '👸 Queen', color: '#f472b6' },
  { id: 'ace', label: '🃏 Ace', color: '#60a5fa' },
  { id: 'tiger', label: '🐯 Tiger', color: '#fb923c' },
  { id: 'lion', label: '🦁 Lion', color: '#facc15' },
  { id: 'eagle', label: '🦅 Eagle', color: '#a78bfa' },
  { id: 'wolf', label: '🐺 Wolf', color: '#94a3b8' },
  { id: 'dragon', label: '🐉 Dragon', color: '#ef4444' },
] as const;

export function generatePlayerId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'LARRA-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const DEFAULT_PROFILE: PlayerProfile = {
  playerId: 'LARRA-USER01',
  name: 'Player 1',
  avatar: 'king',
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
  outcome: 'WIN' | 'FIRE';
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
  SETTINGS: '@larra_game_settings_v1',
  PROFILE: '@larra_game_profile_v1',
  HISTORY: '@larra_game_history_v1',
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
    console.warn('Failed to load settings from storage:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings to storage:', err);
  }
}

export async function resetSettings(): Promise<GameSettings> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
  } catch (err) {
    console.warn('Failed to reset settings in storage:', err);
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
    console.warn('Failed to load profile from storage:', err);
    return DEFAULT_PROFILE;
  }
}

export async function saveProfile(profile: PlayerProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to save profile to storage:', err);
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
    instantVictories: current.instantVictories + (stats.hadInstantVictory ? 1 : 0),
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
    console.warn('Failed to load history from storage:', err);
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
    // Prepend newest match to head
    const updated = [match, ...current];
    // Keep only the newest 20 matches (FIFO)
    const trimmed = updated.slice(0, MAX_HISTORY_ITEMS);
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
    return trimmed;
  } catch (err) {
    console.warn('Failed to save match to history:', err);
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (err) {
    console.warn('Failed to clear history in storage:', err);
  }
}

