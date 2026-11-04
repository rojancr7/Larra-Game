import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, useTableScale } from "../constants/theme";
import { Card } from "../engine/deck";
import { GameState } from "../engine/gameController";
import { AIDifficulty, AVATAR_PRESETS, SpreadSpeed } from "../services/storage";
import { ThemeId, getThemeById } from "../constants/themeManifest";
import { useAppTheme } from "../services/themeManager";
import {
    ActiveBonusNotification,
    BonusNotificationBanner,
} from "./BonusNotificationBanner";
import { HandTray } from "./HandTray";
import { HudPill } from "./HudPill";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { PlayerSeat } from "./PlayerSeat";
import { PlayingCard } from "./PlayingCard";
import { PointsPopup } from "./PointsPopup";
import { CardFan, RoundResultCard } from "./TableCenter";
import { TableFrame } from "./TableFrame";

export interface GameTableUIProps {
  game: GameState;
  humanName: string;
  themeId?: ThemeId;
  spreadSpeed?: SpreadSpeed;
  animations?: boolean;
  targetPoints?: number;
  difficulty?: AIDifficulty;
  /** 0-based round shown in the "ROUND 1/4" pill. */
  activeRound?: number;
  bonusNotifications?: ActiveBonusNotification[];
  onDismissBonus?: (id: string) => void;
  onOpenMenu: () => void;
  onOpenSettings: () => void;

  // Hand tray (state comes from tablePartitionManager in GameTable)
  roundGroups: Card[][];
  handCards: Card[];
  selectedCardId: string | null;
  isReady: boolean;
  assignedCount: number;
  throwLabel?: string | null;
  onTapCard: (card: Card) => void;
  onTapSlot: (index: number) => void;
  onTapPool: () => void;
  onAutoArrange: () => void;
  onConfirm: () => void;
  onThrow: () => void;
  onNextDeal: () => void;
  onNewMatch: () => void;
  onViewResults: () => void;
}

export const GameTableUI: React.FC<GameTableUIProps> = ({
  game,
  humanName,
  themeId,
  spreadSpeed = "medium",
  animations = true,
  targetPoints = 20,
  difficulty = "easy",
  activeRound = 0,
  bonusNotifications = [],
  onDismissBonus = () => {},
  onOpenMenu,
  onOpenSettings,
  roundGroups,
  handCards,
  selectedCardId,
  isReady,
  assignedCount,
  throwLabel,
  onTapCard,
  onTapSlot,
  onTapPool,
  onAutoArrange,
  onConfirm,
  onThrow,
  onNextDeal,
  onNewMatch,
  onViewResults,
}) => {
  const { s } = useTableScale();
  const appTheme = useAppTheme();
  const theme = themeId ? getThemeById(themeId) : appTheme;
  const me = game.players[0];
  const results = game.roundResults || [];
  const players = game.players.map((p, i) =>
    i === 0 ? { ...p, name: humanName } : p,
  );

  // Points the local player earned this deal (same rules as the scorecard).
  let earned = 0;
  let r4Bonus: { pts: number; label: string } | null = null;
  results.forEach((r, i) => {
    if (r.winnerIndex !== 0) return;
    if (i < 3) {
      earned += 1;
      return;
    }
    const g = roundGroups[3];
    const trail = g.length > 0 && g.every((c) => c.rank === g[0].rank);
    const pts = trail ? (g[0].rank === "A" ? 5 : 4) : 1;
    earned += pts;
    if (pts > 1)
      r4Bonus = { pts, label: pts === 5 ? "Quad Aces" : "Four of a Kind" };
  });
  const popup =
    game.cleanSweepWinner === 0 ? { points: 1, label: "Clean Sweep" } : r4Bonus;
  const showCards = me.partition ? me.partition[3] : roundGroups[3];

  const roundLabel = `ROUND ${Math.min(activeRound + 1, 4)}/4 - ${activeRound >= 3 ? 4 : 3} CARDS`;

  return (
    <TableFrame>
      {/* Top-left: menu, logo, pills */}
      <Pressable
        style={[
          styles.iconBtn,
          {
            left: 8 * s,
            top: 8 * s,
            width: 40 * s,
            height: 40 * s,
            backgroundColor: theme.ui.panel,
            borderColor: theme.ui.accent,
          },
        ]}
        onPress={onOpenMenu}
      >
        <Text style={styles.iconText}>☰</Text>
      </Pressable>
      <View style={{ position: "absolute", left: 58 * s, top: 8 * s }}>
        <Text style={[styles.logo, { fontSize: 26 * s, color: theme.ui.accent }]}>♠ LARRA</Text>
        <View style={{ gap: 4, marginTop: 4 }}>
          <HudPill icon="🎯" label={`TARGET: ${targetPoints} PTS`} />
          <HudPill label={roundLabel} />
          <HudPill
            icon={difficulty === "hard" ? "🔴" : difficulty === "med" ? "🟡" : "🟢"}
            label={`${difficulty.toUpperCase()} BOT`}
          />
        </View>
      </View>

      {/* Top-right: settings, leaderboard, draw pile */}
      <Pressable
        style={[
          styles.iconBtn,
          {
            right: 8 * s,
            top: 8 * s,
            width: 40 * s,
            height: 40 * s,
            backgroundColor: theme.ui.panel,
            borderColor: theme.ui.accent,
          },
        ]}
        onPress={onOpenSettings}
      >
        <Text style={styles.iconText}>⚙</Text>
      </Pressable>
      <View style={{ position: "absolute", right: 58 * s, top: 8 * s }}>
        <LeaderboardPanel
          players={players}
          scores={game.scores}
          width={150 * s}
        />
      </View>
      <View
        style={{
          position: "absolute",
          right: 224 * s,
          top: 14 * s,
          transform: [{ rotate: "-8deg" }],
        }}
      >
        <PlayingCard
          faceDown
          size="md"
          scale={0.5 * s}
          themeId={theme.id}
        />
      </View>

      {/* Opponents: top = player 3, left = player 4, right = player 2 */}
      <View
        style={{
          position: "absolute",
          top: 6 * s,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
        pointerEvents="box-none"
      >
        <PlayerSeat
          player={game.players[2]}
          score={game.scores[2]}
          position="top"
          avatarIndex={3}
          themeId={theme.id}
          isWinner={game.matchWinner?.playerId === game.players[2].id}
        />
      </View>
      <View style={{ position: "absolute", left: 30 * s, top: "33%" }}>
        <PlayerSeat
          player={game.players[3]}
          score={game.scores[3]}
          position="left"
          avatarIndex={1}
          themeId={theme.id}
          isWinner={game.matchWinner?.playerId === game.players[3].id}
        />
      </View>
      <View style={{ position: "absolute", right: 30 * s, top: "33%" }}>
        <PlayerSeat
          player={game.players[1]}
          score={game.scores[1]}
          position="right"
          avatarIndex={2}
          themeId={theme.id}
          isWinner={game.matchWinner?.playerId === game.players[1].id}
        />
      </View>

      {/* Bonus alert */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "25%",
          alignItems: "center",
        }}
        pointerEvents="box-none"
      >
        <BonusNotificationBanner
          notifications={bonusNotifications}
          onDismiss={onDismissBonus}
        />
      </View>

      {/* Table center */}
      <View style={[styles.center, { top: "34%" }]} pointerEvents="box-none">
        {game.isSettled && showCards.length > 0 ? (
          <>
            <CardFan cards={showCards} scale={0.7 * s} />
            <RoundResultCard
              name={humanName}
              emoji={AVATAR_PRESETS[0].label.split(" ")[0]}
              points={earned}
              label={earned > 0 ? "Round Win" : "No Wins"}
              scale={s}
            />
            {popup && (
              <PointsPopup
                points={popup.points}
                label={popup.label}
                animations={animations}
                size={104 * s}
              />
            )}
          </>
        ) : (
          <Text style={[styles.hint, { fontSize: 13 * s }]}>
            Arrange your 13 cards, then play your hand
          </Text>
        )}
      </View>

      {/* Hand tray with Auto-Arrange and Confirm buttons */}
      <View
        style={[styles.bottom, { bottom: 10 * s }]}
        pointerEvents="box-none"
      >
        <HandTray
          roundGroups={roundGroups}
          handCards={handCards}
          selectedCardId={selectedCardId}
          isReady={isReady}
          assignedCount={assignedCount}
          mode={game.isSettled ? "settled" : "arrange"}
          isGameOver={game.isGameOver}
          throwLabel={throwLabel}
          spreadSpeed={spreadSpeed}
          themeId={theme.id}
          onTapCard={onTapCard}
          onTapSlot={onTapSlot}
          onTapPool={onTapPool}
          onAutoArrange={onAutoArrange}
          onConfirm={onConfirm}
          onThrow={onThrow}
          onNextDeal={onNextDeal}
          onNewMatch={onNewMatch}
          onViewResults={onViewResults}
        />
      </View>
    </TableFrame>
  );
};

const styles = StyleSheet.create({
  iconBtn: {
    position: "absolute",
    zIndex: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.goldDark,
    backgroundColor: "#3a2208",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: colors.goldLight, fontSize: 20, fontWeight: "900" },
  logo: {
    color: colors.goldMid,
    fontWeight: "900",
    letterSpacing: 3,
    textShadowColor: "#000",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 2 },
  },
  center: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  hint: { color: "rgba(255,243,196,0.7)", fontWeight: "700" },
  bottom: { position: "absolute", left: 0, right: 0, alignItems: "center" },
});

export default GameTableUI;
