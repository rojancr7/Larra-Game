import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateAIPartition } from "../../ai/computerAI";
import { dealCards } from "../../engine/deal";
import { createDeck, shuffle } from "../../engine/deck";
import {
  settleGame,
  startNewGame,
  submitPlayerPartition,
} from "../../engine/gameController";
import { HandPartition, validatePartition } from "../../engine/partition";

// In-memory mock for AsyncStorage
const memoryStore = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => memoryStore.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      memoryStore.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      memoryStore.delete(key);
    }),
    clear: vi.fn(async () => {
      memoryStore.clear();
    }),
  },
}));

import {
  clearHistory,
  DEFAULT_SETTINGS,
  GameSettings,
  loadHistory,
  loadProfile,
  loadSettings,
  MatchHistoryItem,
  MAX_HISTORY_ITEMS,
  PlayerProfile,
  resetSettings,
  saveMatchToHistory,
  saveProfile,
  saveSettings,
  updateProfileStats
} from "../storage";

describe("Storage, Settings & Profile Service Tests", () => {
  beforeEach(() => {
    memoryStore.clear();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Settings Persistence
  // -------------------------------------------------------------------------
  describe("Settings Persistence", () => {
    it("returns default settings when storage is empty", async () => {
      const settings = await loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(settings.boardColor).toBe("board1");
      expect(settings.cardBack).toBe("card1");
      expect(settings.soundEffects).toBe(true);
      expect(settings.vibration).toBe(true);
      expect(settings.spreadSpeed).toBe("medium");
    });

    it("persists and retrieves updated settings", async () => {
      const customSettings: GameSettings = {
        boardColor: "board2" as any,
        cardBack: "card3" as any,
        cardFace: "modern",
        playerName: "LarraChampion",
        soundEffects: false,
        musicEnabled: false,
        musicTrack: "none",
        vibration: false,
        animations: true,
        themeId: "regal" as GameSettings["themeId"],
        difficulty: "hard",
        spreadSpeed: "fast",
        spreadSound: false,
        cardMoveSound: false,
      };

      await saveSettings(customSettings);
      const retrieved = await loadSettings();

      expect(retrieved.boardColor).toBe("board2");
      expect(retrieved.cardBack).toBe("card3");
      expect(retrieved.playerName).toBe("LarraChampion");
      expect(retrieved.soundEffects).toBe(false);
      expect(retrieved.vibration).toBe(false);
      expect(retrieved.spreadSpeed).toBe("fast");
      expect(retrieved.themeId).toBe("regal");
    });

    it("resets settings back to default", async () => {
      await saveSettings({
        ...DEFAULT_SETTINGS,
        boardColor: "regal" as GameSettings["boardColor"],
        playerName: "CustomUser",
      });

      const reset = await resetSettings();
      expect(reset).toEqual(DEFAULT_SETTINGS);

      const reloaded = await loadSettings();
      expect(reloaded).toEqual(DEFAULT_SETTINGS);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Profile Persistence & Statistics
  // -------------------------------------------------------------------------
  describe("Profile Persistence & Statistics", () => {
    it("generates a valid local player ID and default profile on first launch", async () => {
      const profile = await loadProfile();
      expect(profile.playerId).toMatch(/^LARRA-[A-Z0-9]{6}$/);
      expect(profile.name).toBe("Player 1");
      expect(profile.matchesPlayed).toBe(0);
      expect(profile.matchesWon).toBe(0);
      expect(profile.totalPoints).toBe(0);
    });

    it("persists updated profile avatar and name", async () => {
      const p = await loadProfile();
      const updated: PlayerProfile = {
        ...p,
        name: "TigerMaster",
        avatar: "tiger",
      };

      await saveProfile(updated);
      const reloaded = await loadProfile();

      expect(reloaded.name).toBe("TigerMaster");
      expect(reloaded.avatar).toBe("tiger");
      expect(reloaded.playerId).toBe(p.playerId); // ID remains consistent
    });

    it("accurately updates career stats after match wins & clean sweeps", async () => {
      await loadProfile(); // initialize

      await updateProfileStats({
        isWin: true,
        pointsScored: 21,
        hadCleanSweep: true,
        hadInstantVictory: false,
      });

      let current = await loadProfile();
      expect(current.matchesPlayed).toBe(1);
      expect(current.matchesWon).toBe(1);
      expect(current.totalPoints).toBe(21);
      expect(current.cleanSweeps).toBe(1);
      expect(current.instantVictories).toBe(0);

      // Record a loss with instant victory
      await updateProfileStats({
        isWin: false,
        pointsScored: 8,
        hadCleanSweep: false,
        hadInstantVictory: true,
      });

      current = await loadProfile();
      expect(current.matchesPlayed).toBe(2);
      expect(current.matchesWon).toBe(1);
      expect(current.totalPoints).toBe(29);
      expect(current.cleanSweeps).toBe(1);
      expect(current.instantVictories).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Match History Persistence & FIFO 20-Match Limit
  // -------------------------------------------------------------------------
  describe("Match History (Strict 20-Match FIFO Limit)", () => {
    function createMockMatch(num: number): MatchHistoryItem {
      return {
        id: `match_${num}`,
        date: `2026-11-02 12:${num.toString().padStart(2, "0")}`,
        timestamp: 1700000000 + num * 1000,
        durationSeconds: 120,
        playerNames: ["Player 1", "Player 2", "Player 3", "Player 4"],
        finalScores: [
          { playerId: "p1", name: "Player 1", points: 20 },
          { playerId: "p2", name: "Player 2", points: 10 },
          { playerId: "p3", name: "Player 3", points: 8 },
          { playerId: "p4", name: "Player 4", points: 6 },
        ],
        winnerIndex: 0,
        winnerName: "Player 1",
        isHumanWinner: true,
        cleanSweepWinner: null,
        instantVictoryWinner: null,
        rounds: [
          {
            round: 1,
            winnerIndex: 0,
            winnerName: "Player 1",
            outcome: "WIN",
            points: 1,
          },
          {
            round: 2,
            winnerIndex: 0,
            winnerName: "Player 1",
            outcome: "WIN",
            points: 1,
          },
          {
            round: 3,
            winnerIndex: 1,
            winnerName: "Player 2",
            outcome: "WIN",
            points: 1,
          },
          {
            round: 4,
            winnerIndex: 0,
            winnerName: "Player 1",
            outcome: "WIN",
            points: 1,
          },
        ],
        bonuses: [],
      };
    }

    it("saves a match and retrieves it from history", async () => {
      const match1 = createMockMatch(1);
      await saveMatchToHistory(match1);

      const history = await loadHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe("match_1");
    });

    it("enforces strict MAX_HISTORY_ITEMS (20) FIFO limit when saving 25 matches", async () => {
      // Add 25 matches sequentially: match_1 to match_25
      for (let i = 1; i <= 25; i++) {
        await saveMatchToHistory(createMockMatch(i));
      }

      const history = await loadHistory();

      // Total count must be exactly 20 (not 25)
      expect(history).toHaveLength(MAX_HISTORY_ITEMS);
      expect(history).toHaveLength(20);

      // The newest match (match_25) must be at index 0
      expect(history[0].id).toBe("match_25");

      // The oldest match in the list must be match_6
      expect(history[19].id).toBe("match_6");

      // Matches 1 through 5 must have been automatically dropped (FIFO)
      const ids = history.map((m) => m.id);
      expect(ids).not.toContain("match_1");
      expect(ids).not.toContain("match_2");
      expect(ids).not.toContain("match_3");
      expect(ids).not.toContain("match_4");
      expect(ids).not.toContain("match_5");

      // Never delete the newest match
      expect(ids).toContain("match_25");
    });

    it("clears history properly", async () => {
      await saveMatchToHistory(createMockMatch(1));
      await saveMatchToHistory(createMockMatch(2));

      let history = await loadHistory();
      expect(history).toHaveLength(2);

      await clearHistory();
      history = await loadHistory();
      expect(history).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Partition Validation & Movable Cards Logic
  // -------------------------------------------------------------------------
  describe("Partition Validation & Movable Cards Logic", () => {
    it("validates interactive card rearrangement into [3, 3, 3, 4]", () => {
      const deck = shuffle(createDeck());
      const [hand] = dealCards(deck, 4, 13);

      // Simulate a user moving cards into 4 groups:
      const userPartition: HandPartition = [
        [hand[0], hand[1], hand[2]],
        [hand[3], hand[4], hand[5]],
        [hand[6], hand[7], hand[8]],
        [hand[9], hand[10], hand[11], hand[12]],
      ];

      expect(validatePartition(hand, userPartition)).toBe(true);

      // Moving a card: Swap hand[0] and hand[9] between Group 1 and Group 4
      const swappedPartition: HandPartition = [
        [hand[9], hand[1], hand[2]],
        [hand[3], hand[4], hand[5]],
        [hand[6], hand[7], hand[8]],
        [hand[0], hand[10], hand[11], hand[12]],
      ];

      expect(validatePartition(hand, swappedPartition)).toBe(true);

      // Rejecting invalid group size (4, 2, 3, 4)
      const invalidPartition = [
        [hand[0], hand[1], hand[2], hand[3]],
        [hand[4], hand[5]],
        [hand[6], hand[7], hand[8]],
        [hand[9], hand[10], hand[11], hand[12]],
      ] as unknown as HandPartition;

      expect(validatePartition(hand, invalidPartition)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Match Lifecycle: Starting, Settling, and Resetting
  // -------------------------------------------------------------------------
  describe("Match Lifecycle: Starting, Settling & Resetting", () => {
    it("initializes match, submits all 4 partitions, and settles cleanly", () => {
      const game = startNewGame();
      expect(game.isGameOver).toBe(false);
      expect(game.isSettled).toBe(false);

      // Player 1 arranges cards manually
      const p1Partition: HandPartition = [
        game.players[0].cards.slice(0, 3),
        game.players[0].cards.slice(3, 6),
        game.players[0].cards.slice(6, 9),
        game.players[0].cards.slice(9, 13),
      ];

      let updated = submitPlayerPartition(game, 0, p1Partition);

      // Players 2-4 use AI
      for (let i = 1; i < 4; i++) {
        const aiPart = generateAIPartition(updated.players[i].cards);
        updated = submitPlayerPartition(updated, i, aiPart);
      }

      const settled = settleGame(updated);
      expect(settled.isSettled).toBe(true);

      // Starting fresh match resets deal and settlement state
      const freshGame = startNewGame();
      expect(freshGame.isSettled).toBe(false);
      expect(freshGame.isGameOver).toBe(false);
      expect(freshGame.players[0].partition).toBeNull();
    });
  });
});
