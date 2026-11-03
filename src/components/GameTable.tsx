import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { generateAIPartition } from "../ai/computerAI";
import { Card } from "../engine/deck";
import {
  detectEligibleDeclaration,
  EligibleDeclaration,
} from "../engine/declarationDetector";
import {
  GameState,
  settleGame,
  startNewGame,
  startNextDeal,
  submitPlayerPartition,
} from "../engine/gameController";
import {
  createInitialPartitionState,
  deselectCard,
  isPartitionReady,
  removeCardToHand,
  selectCard,
  swapCards,
  TablePartitionState,
  transferCard,
} from "../engine/tablePartitionManager";
import { triggerHaptic } from "../services/audioHaptics";
import {
  lockToLandscape,
  restorePortraitOrientation,
} from "../services/orientation";
import {
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  GameSettings,
  HistoryBonusItem,
  HistoryRoundResult,
  loadProfile,
  loadSettings,
  saveSettings,
  MatchHistoryItem,
  PlayerProfile,
  saveMatchToHistory,
  updateProfileStats,
  AIDifficulty,
} from "../services/storage";
import { ActiveBonusNotification } from "./BonusNotificationBanner";
import { GameTableUI } from "./GameTableUI";
import { TableScorecardModal } from "./TableScorecardModal";
import { ThreeDotMenuModal } from "./ThreeDotMenuModal";

export interface GameTableProps {
  initialDifficulty?: AIDifficulty;
}

export const GameTable: React.FC<GameTableProps> = ({ initialDifficulty }) => {
  const router = useRouter();

  const [difficulty, setDifficulty] = useState<AIDifficulty>(
    initialDifficulty || "easy",
  );
  const [game, setGame] = useState<GameState>(() => startNewGame());
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [notifications, setNotifications] = useState<ActiveBonusNotification[]>(
    [],
  );

  // On-table partition state for the human player
  const [partitionState, setPartitionState] = useState<TablePartitionState>(
    () => createInitialPartitionState(game.players[0]?.cards || []),
  );

  const matchStartTimeRef = useRef<number>(Date.now());
  const matchSavedRef = useRef<boolean>(false);

  // Lock orientation to landscape on mount, restore on unmount
  useEffect(() => {
    lockToLandscape();
    return () => {
      restorePortraitOrientation();
    };
  }, []);

  // Load settings and profile
  useEffect(() => {
    async function init() {
      const s = await loadSettings();
      const p = await loadProfile();
      setSettings(s);
      setProfile(p);
      if (initialDifficulty) {
        setDifficulty(initialDifficulty);
      } else if (s.difficulty) {
        setDifficulty(s.difficulty);
      }
    }
    init();
  }, [initialDifficulty]);

  const handleChangeDifficulty = (newDiff: AIDifficulty) => {
    setDifficulty(newDiff);
    saveSettings({ ...settings, difficulty: newDiff });
  };

  // Check initial deal instant bonuses
  useEffect(() => {
    checkDealInstantBonuses(game);
  }, []);

  // Reset on-table partition when dealt cards change
  useEffect(() => {
    const localCards = game.players[0]?.cards || [];
    if (localCards.length === 13) {
      setPartitionState(createInitialPartitionState(localCards));
    }
  }, [game.players[0]?.cards]);

  const humanName = profile.name || "You";

  const checkDealInstantBonuses = (currentGame: GameState) => {
    const list: ActiveBonusNotification[] = [];
    currentGame.players.forEach((player, idx) => {
      const b = player.instantBonus;
      if (b.totalPoints > 0) {
        let title = "Instant Deal Bonus";
        let desc = "";
        if (b.grandStraight) {
          title = "👑 Grand Straight";
          desc = "All 13 cards form a continuous straight (+13 pts)!";
        } else if (b.threeTrayel) {
          title = "🔥 Three Trayel";
          desc = "Contains three sets of 3-of-a-kind (+9 pts)!";
        } else if (b.sixJute) {
          title = "👥 Six Jute";
          desc = "Contains six distinct pairs (+6 pts)!";
        }
        list.push({
          id: `bonus-${idx}-${Date.now()}-${Math.random()}`,
          type: "instantBonus",
          title,
          playerName: idx === 0 ? profile.name || "You" : player.name,
          playerIndex: idx,
          points: b.totalPoints,
          description: desc,
          cards: idx === 0 ? player.cards : undefined,
        });
      }
    });

    if (list.length > 0) {
      setNotifications((prev) => [...prev, ...list]);
      triggerHaptic("success");
    }
  };

  const localPlayer = game.players[0];
  const isGameOver = game.isGameOver;
  const totalAssigned = partitionState.roundGroups.flat().length;
  const isReadyToSubmit = isPartitionReady(partitionState);

  // THROW button condition
  const eligibleDeclaration: EligibleDeclaration | null =
    detectEligibleDeclaration(
      localPlayer.cards,
      partitionState.roundGroups,
      game.scores[0]?.points ?? 0,
    );

  // -------------------------------------------------------------------------
  // Tap handlers (tap a card to select, tap another card to swap, tap a slot to move)
  // -------------------------------------------------------------------------

  const handleCardTap = (card: Card) => {
    triggerHaptic("selection");

    if (!partitionState.selectedCardId) {
      setPartitionState((prev) => selectCard(prev, card.id));
      return;
    }

    if (partitionState.selectedCardId === card.id) {
      setPartitionState((prev) => deselectCard(prev));
      return;
    }

    setPartitionState((prev) => swapCards(prev, prev.selectedCardId!, card.id));
    triggerHaptic("impactLight");
  };

  const handleZoneTap = (groupIdx: number) => {
    triggerHaptic("selection");
    if (partitionState.selectedCardId) {
      setPartitionState((prev) =>
        transferCard(prev, prev.selectedCardId!, groupIdx),
      );
    } else {
      setPartitionState((prev) => ({ ...prev, targetRound: groupIdx }));
    }
  };

  // Tap the "your cards" strip to send the selected card back to your hand
  const handlePoolTap = () => {
    if (!partitionState.selectedCardId) return;
    triggerHaptic("selection");
    const id = partitionState.selectedCardId;
    setPartitionState((prev) => deselectCard(removeCardToHand(prev, id)));
  };

  // Auto-arrange: let the AI place all 13 cards into the 4 slots
  const handleAutoArrange = () => {
    triggerHaptic("selection");
    try {
      const auto = generateAIPartition(localPlayer.cards);
      let next = createInitialPartitionState(localPlayer.cards);
      auto.forEach((group, gi) => {
        group.forEach((c) => {
          next = transferCard(next, c.id, gi);
        });
      });
      setPartitionState(next);
    } catch (err) {
      console.warn("Auto-arrange failed:", err);
    }
  };

  // -------------------------------------------------------------------------
  // THROW declaration
  // -------------------------------------------------------------------------

  const handleThrowDeclaration = () => {
    if (!eligibleDeclaration) return;
    triggerHaptic("success");

    setNotifications((prev) => [
      ...prev,
      {
        id: `throw-${Date.now()}`,
        type: "instantBonus",
        title: eligibleDeclaration.title,
        playerName: profile.name || "You",
        playerIndex: 0,
        points: eligibleDeclaration.points,
        description: eligibleDeclaration.description,
        cards: eligibleDeclaration.cards,
      },
    ]);

    if (
      eligibleDeclaration.type === "WIN_20" ||
      eligibleDeclaration.type === "INSTANT_VICTORY"
    ) {
      if (isReadyToSubmit) {
        handleSubmitOnTablePartition();
      }
    }
  };

  // -------------------------------------------------------------------------
  // Confirm & play hand (submit + showdown)
  // -------------------------------------------------------------------------

  const handleSubmitOnTablePartition = () => {
    if (!isReadyToSubmit) return;
    triggerHaptic("impactHeavy");

    try {
      let updated = submitPlayerPartition(game, 0, partitionState.roundGroups);

      for (let i = 1; i < 4; i++) {
        if (!updated.players[i].partition) {
          const aiPart = generateAIPartition(updated.players[i].cards, {
            playerIndex: i,
            currentScore: updated.scores[i]?.points ?? 0,
            opponentsScores: updated.scores.map((s) => s.points),
            difficulty,
          });
          updated = submitPlayerPartition(updated, i, aiPart);
        }
      }

      const settled = settleGame(updated);
      setGame(settled);

      const newNotifs: ActiveBonusNotification[] = [];
      if (settled.cleanSweepWinner !== null) {
        const csWinner = settled.players[settled.cleanSweepWinner];
        newNotifs.push({
          id: `cs-${Date.now()}`,
          type: "cleanSweep",
          title: "🧹 Clean Sweep!",
          playerName:
            settled.cleanSweepWinner === 0
              ? profile.name || "You"
              : csWinner.name,
          playerIndex: settled.cleanSweepWinner,
          points: 1,
          description: "Won all 4 rounds in this deal (+1 bonus point)!",
        });
      }

      if (settled.instantVictoryWinner !== null) {
        const ivWinner = settled.players[settled.instantVictoryWinner];
        newNotifs.push({
          id: `iv-${Date.now()}`,
          type: "instantVictory",
          title: "🏆 Instant Match Victory!",
          playerName:
            settled.instantVictoryWinner === 0
              ? profile.name || "You"
              : ivWinner.name,
          playerIndex: settled.instantVictoryWinner,
          points: 20,
          description:
            "Formed an Instant Victory 4-card sequence in Round 4 and won the match!",
          cards: ivWinner.partition ? ivWinner.partition[3] : undefined,
        });
      }

      if (newNotifs.length > 0) {
        setNotifications((prev) => [...prev, ...newNotifs]);
      }

      if (settled.isGameOver && !matchSavedRef.current) {
        matchSavedRef.current = true;
        recordCompletedMatch(settled);
      }
    } catch (err: any) {
      console.error("Failed to submit and settle on table:", err.message);
    }
  };

  const recordCompletedMatch = async (settled: GameState) => {
    try {
      const winnerId = settled.matchWinner?.playerId;
      const winnerIndex = settled.players.findIndex((p) => p.id === winnerId);
      const isHumanWin = winnerIndex === 0;

      const durationSeconds = Math.max(
        15,
        Math.round((Date.now() - matchStartTimeRef.current) / 1000),
      );

      const historyRounds: HistoryRoundResult[] = (
        settled.roundResults || []
      ).map((r, i) => ({
        round: i + 1,
        winnerIndex: r.winnerIndex,
        winnerName:
          r.winnerIndex !== null
            ? r.winnerIndex === 0
              ? profile.name || "You"
              : settled.players[r.winnerIndex]?.name || "Computer"
            : "Tie (Fire)",
        outcome: r.outcome,
        points: 1,
      }));

      const historyBonuses: HistoryBonusItem[] = [];
      settled.players.forEach((p, i) => {
        if (p.instantBonus.totalPoints > 0) {
          historyBonuses.push({
            playerIndex: i,
            playerName: i === 0 ? profile.name || "You" : p.name,
            bonusType: "Instant Deal Bonus",
            points: p.instantBonus.totalPoints,
          });
        }
      });

      const historyItem: MatchHistoryItem = {
        id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: Date.now(),
        durationSeconds,
        playerNames: settled.players.map((p, i) =>
          i === 0 ? profile.name || "You" : p.name,
        ),
        finalScores: settled.scores.map((s, i) => ({
          ...s,
          name: i === 0 ? profile.name || "You" : s.name,
        })),
        winnerIndex: winnerIndex >= 0 ? winnerIndex : 0,
        winnerName:
          winnerIndex === 0
            ? profile.name || "You"
            : settled.players[winnerIndex]?.name || "Computer",
        isHumanWinner: isHumanWin,
        cleanSweepWinner: settled.cleanSweepWinner,
        instantVictoryWinner: settled.instantVictoryWinner,
        rounds: historyRounds,
        bonuses: historyBonuses,
      };

      await saveMatchToHistory(historyItem);

      await updateProfileStats({
        isWin: isHumanWin,
        pointsScored: settled.scores[0]?.points || 0,
        hadCleanSweep: settled.cleanSweepWinner === 0,
        hadInstantVictory: settled.instantVictoryWinner === 0,
      });

      triggerHaptic(isHumanWin ? "success" : "warning");
    } catch (err) {
      console.warn("Failed to record completed match:", err);
    }
  };

  const handleNextDeal = () => {
    try {
      triggerHaptic("selection");
      const nextDeal = startNextDeal(game);
      setGame(nextDeal);
      checkDealInstantBonuses(nextDeal);
    } catch (err: any) {
      console.error("Failed to start next deal:", err.message);
    }
  };

  const handleNewMatch = () => {
    triggerHaptic("selection");
    matchStartTimeRef.current = Date.now();
    matchSavedRef.current = false;
    const newGame = startNewGame();
    setGame(newGame);
    checkDealInstantBonuses(newGame);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleExitToHome = () => {
    restorePortraitOrientation();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <GameTableUI
        game={game}
        humanName={humanName}
        boardColor={settings.boardColor}
        cardBack={settings.cardBack}
        animations={settings.animations}
        bonusNotifications={notifications}
        onDismissBonus={handleDismissNotification}
        onOpenMenu={() => {
          triggerHaptic("selection");
          setShowMenuModal(true);
        }}
        onOpenSettings={() => router.navigate("/settings" as any)}
        difficulty={difficulty}
        roundGroups={partitionState.roundGroups}
        handCards={partitionState.handCards}
        selectedCardId={partitionState.selectedCardId}
        isReady={isReadyToSubmit}
        assignedCount={totalAssigned}
        throwLabel={eligibleDeclaration ? eligibleDeclaration.badge : null}
        onTapCard={handleCardTap}
        onTapSlot={handleZoneTap}
        onTapPool={handlePoolTap}
        onAutoArrange={handleAutoArrange}
        onConfirm={handleSubmitOnTablePartition}
        onThrow={handleThrowDeclaration}
        onNextDeal={handleNextDeal}
        onNewMatch={handleNewMatch}
        onViewResults={() => setShowScorecardModal(true)}
      />

      <ThreeDotMenuModal
        visible={showMenuModal}
        game={game}
        difficulty={difficulty}
        onChangeDifficulty={handleChangeDifficulty}
        onClose={() => setShowMenuModal(false)}
        onOpenSettings={() => {
          setShowMenuModal(false);
          router.navigate("/settings" as any);
        }}
        onExitGame={handleExitToHome}
        onViewScoreboard={() => {
          setShowMenuModal(false);
          setShowScorecardModal(true);
        }}
      />

      <TableScorecardModal
        visible={showScorecardModal}
        game={game}
        humanPlayerName={humanName}
        onClose={() => setShowScorecardModal(false)}
      />

      {isGameOver && (
        <View style={styles.matchVictoryOverlay}>
          <View style={styles.victoryCard}>
            <Text style={styles.victoryTrophy}>🏆</Text>
            <Text style={styles.victoryHeading}>MATCH VICTORY!</Text>
            <Text style={styles.winnerNameText}>
              {game.matchWinner?.name || "Player"} Won the Match!
            </Text>
            <Text style={styles.winningDetailsText}>
              {game.winningEvent || "Reached 20 Points Target"} • Final Score:{" "}
              {game.matchWinner?.points} pts
            </Text>

            <View style={styles.victoryBtnsRow}>
              <Pressable
                onPress={handleNewMatch}
                style={styles.btnVictoryPlayAgain}
              >
                <Text style={styles.btnVictoryPlayAgainText}>
                  🔄 Play Again
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowScorecardModal(true)}
                style={styles.btnVictoryScorecard}
              >
                <Text style={styles.btnVictoryScorecardText}>📊 Scorecard</Text>
              </Pressable>
              <Pressable
                onPress={handleExitToHome}
                style={styles.btnVictoryHome}
              >
                <Text style={styles.btnVictoryHomeText}>🏠 Home</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#1d1008" },
  matchVictoryOverlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    padding: 16,
  },
  victoryCard: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#eab308",
    padding: 18,
    alignItems: "center",
    maxWidth: 380,
    width: "100%",
    shadowColor: "#eab308",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 14,
  },
  victoryTrophy: { fontSize: 36, marginBottom: 2 },
  victoryHeading: {
    color: "#facc15",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  winnerNameText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },
  winningDetailsText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
    textAlign: "center",
  },
  victoryBtnsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  btnVictoryPlayAgain: {
    backgroundColor: "#ca8a04",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnVictoryPlayAgainText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
  btnVictoryScorecard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnVictoryScorecardText: {
    color: "#f8fafc",
    fontSize: 10,
    fontWeight: "700",
  },
  btnVictoryHome: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnVictoryHomeText: { color: "#f87171", fontSize: 10, fontWeight: "700" },
});

export default GameTable;
