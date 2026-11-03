import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTableScale } from "../constants/theme";
import { Card } from "../engine/deck";
import { Player } from "../engine/gameController";
import { PlayerScore } from "../engine/scoring";
import { AVATAR_PRESETS, CardBackColor } from "../services/storage";
import { Avatar } from "./Avatar";
import { PlayingCard } from "./PlayingCard";

interface PlayerSeatProps {
  player: Player;
  score: PlayerScore;
  position: "top" | "bottom" | "left" | "right";
  isLocalPlayer?: boolean;
  isWinner?: boolean;
  activeRoundCard?: Card[] | null;
  roundHandLabel?: string | null;
  isRoundWinner?: boolean;
  /** Picks which AVATAR_PRESETS entry this seat uses. */
  avatarIndex?: number;
  cardBack?: CardBackColor;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  position,
  isLocalPlayer = false,
  isWinner = false,
  activeRoundCard,
  roundHandLabel,
  isRoundWinner = false,
  avatarIndex = 1,
  cardBack = "gold-luxury",
}) => {
  const { s } = useTableScale();
  const preset = AVATAR_PRESETS[avatarIndex % AVATAR_PRESETS.length];
  const emoji = preset.label.split(" ")[0];
  const showdown = !!activeRoundCard && activeRoundCard.length > 0;
  const count = player.cards.length;
  const backs = Math.max(1, Math.min(count, position === "top" ? 5 : 3));
  const cardScale = 0.62 * s;
  const step = 62 * cardScale * 0.3;

  const stack = showdown ? (
    <View style={styles.row}>
      {activeRoundCard!.map((c, i) => (
        <View key={c.id || i} style={{ marginLeft: i === 0 ? 0 : -14 * s }}>
          <PlayingCard card={c} size="md" scale={0.55 * s} />
        </View>
      ))}
    </View>
  ) : !isLocalPlayer ? (
    <View>
      <View style={styles.row}>
        {Array.from({ length: backs }).map((_, i) => (
          <View
            key={i}
            style={{
              marginLeft: i === 0 ? 0 : -(62 * cardScale - step),
              transform: [{ rotate: `${(i - (backs - 1) / 2) * 5}deg` }],
            }}
          >
            <PlayingCard
              faceDown
              size="md"
              scale={cardScale}
              cardBackTheme={cardBack}
            />
          </View>
        ))}
      </View>
      <View style={styles.count}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  ) : null;

  const direction =
    position === "top"
      ? "column"
      : position === "right"
        ? "row-reverse"
        : "row";

  return (
    <View
      style={[
        styles.container,
        { flexDirection: direction },
        (isWinner || isRoundWinner) && styles.winner,
      ]}
    >
      <Avatar
        emoji={isLocalPlayer ? "🧑" : emoji}
        color={preset.color}
        name={player.name}
        size={50 * s}
        ready={!!player.partition}
        highlight={isWinner || isRoundWinner}
      />
      <View style={styles.cards}>
        {stack}
        {roundHandLabel ? (
          <Text style={styles.label}>{roundHandLabel}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 6, padding: 4 },
  winner: { backgroundColor: "rgba(234,179,8,0.18)", borderRadius: 14 },
  cards: { alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center" },
  count: {
    position: "absolute",
    right: -6,
    bottom: -4,
    backgroundColor: "#0e7490",
    borderRadius: 9,
    paddingHorizontal: 5,
    minWidth: 18,
    alignItems: "center",
  },
  countText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  label: {
    color: "#86efac",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
    backgroundColor: "rgba(34,197,94,0.18)",
    paddingHorizontal: 5,
    borderRadius: 5,
  },
});

export default PlayerSeat;
