import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";
import { Card } from "../engine/deck";
import { CardBackColor } from "../services/storage";
import { PlayingCard } from "./PlayingCard";

/** Overlapping fan of cards. Face-up by default; pass faceDown for a draw-pile look. */
export const CardFan: React.FC<{
  cards: Card[];
  scale?: number;
  faceDown?: boolean;
  cardBack?: CardBackColor;
}> = ({ cards, scale = 0.8, faceDown = false, cardBack }) => {
  const n = cards.length;
  const cw = 62 * scale;
  const ch = 88 * scale;
  const step = cw * 0.5;
  const width = cw + step * Math.max(0, n - 1);

  return (
    <View
      style={{
        width: width + 16,
        height: ch + 18,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ width, height: ch }}>
        {cards.map((c, i) => {
          const mid = (n - 1) / 2;
          return (
            <View
              key={c.id}
              style={{
                position: "absolute",
                left: i * step,
                top: Math.abs(i - mid) * 2.5,
                transform: [{ rotate: `${(i - mid) * 7}deg` }],
              }}
            >
              <PlayingCard
                card={c}
                faceDown={faceDown}
                size="md"
                scale={scale}
                cardBackTheme={cardBack}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

/** Small result card shown in the table center, e.g. "+1 PT / Round Win". */
export const RoundResultCard: React.FC<{
  name: string;
  emoji: string;
  points: number;
  label: string;
  scale?: number;
}> = ({ name, emoji, points, label, scale = 1 }) => (
  <View style={[styles.card, { transform: [{ scale }] }]}>
    <View style={styles.avatarCol}>
      <View style={styles.avatar}>
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>
      <View style={styles.namePill}>
        <Text style={styles.nameText} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
    <View style={styles.textCol}>
      <Text style={styles.pts}>
        {points > 0 ? "+" : ""}
        {points} {points === 1 ? "PT" : "PTS"}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(8, 28, 16, 0.92)",
    borderWidth: 2,
    borderColor: colors.goldDark,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarCol: { alignItems: "center" },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    borderColor: colors.goldMid,
    backgroundColor: "#1d3b52",
    alignItems: "center",
    justifyContent: "center",
  },
  namePill: {
    marginTop: -8,
    backgroundColor: colors.woodDeep,
    borderWidth: 1.5,
    borderColor: colors.goldDark,
    borderRadius: 9,
    paddingHorizontal: 8,
  },
  nameText: {
    color: colors.cream,
    fontSize: 10,
    fontWeight: "700",
    maxWidth: 70,
  },
  textCol: { alignItems: "center" },
  pts: { color: "#4ade80", fontSize: 24, fontWeight: "900" },
  label: { color: "#f5efd8", fontSize: 14, fontWeight: "700" },
});
