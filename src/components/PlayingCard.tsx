import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Card, Suit } from "../engine/deck";
import { CardBackColor } from "../services/storage";

interface PlayingCardProps {
  card?: Card | null;
  faceDown?: boolean;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  /** Multiplies the base size. Use this to fit cards to the screen. */
  scale?: number;
  cardBackTheme?: CardBackColor;
  style?: ViewStyle;
}

const BASE = {
  xs: { w: 36, h: 50 },
  sm: { w: 42, h: 58 },
  md: { w: 62, h: 88 },
  lg: { w: 78, h: 112 },
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};
const SUIT_COLORS: Record<Suit, string> = {
  hearts: "#d62828",
  diamonds: "#d62828",
  clubs: "#111827",
  spades: "#111827",
};

const BACKS: Record<
  CardBackColor,
  { bg: string; border: string; inner: string; symbol: string }
> = {
  "gold-luxury": {
    bg: "#b8873a",
    border: "#f1d38a",
    inner: "#8a5d22",
    symbol: "#f7e2a8",
  },
  "royal-red": {
    bg: "#991b1b",
    border: "#fca5a5",
    inner: "#7f1d1d",
    symbol: "#fecaca",
  },
  "classic-blue": {
    bg: "#1e3a8a",
    border: "#93c5fd",
    inner: "#172554",
    symbol: "#bfdbfe",
  },
  "emerald-leaf": {
    bg: "#065f46",
    border: "#6ee7b7",
    inner: "#064e3b",
    symbol: "#a7f3d0",
  },
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  selected = false,
  onPress,
  disabled = false,
  size = "md",
  scale = 1,
  cardBackTheme = "gold-luxury",
  style,
}) => {
  const w = Math.round(BASE[size].w * scale);
  const h = Math.round(BASE[size].h * scale);
  const radius = Math.max(3, Math.round(w * 0.11));

  if (faceDown || !card) {
    const t = BACKS[cardBackTheme] || BACKS["gold-luxury"];
    return (
      <View
        style={[
          styles.base,
          {
            width: w,
            height: h,
            borderRadius: radius,
            backgroundColor: t.bg,
            borderColor: t.border,
            borderWidth: Math.max(1.5, w * 0.045),
            alignItems: "center",
            justifyContent: "center",
          },
          style,
        ]}
      >
        <View
          style={{
            width: "80%",
            height: "86%",
            borderRadius: Math.max(2, radius - 2),
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.35)",
            backgroundColor: t.inner,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: t.symbol,
              fontSize: w * 0.42,
              opacity: 0.9,
              includeFontPadding: false,
            }}
          >
            ♦
          </Text>
        </View>
      </View>
    );
  }

  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];
  const rankSize = w * 0.3;
  const suitSize = w * 0.24;

  const face = (
    <View
      style={[
        styles.base,
        {
          width: w,
          height: h,
          borderRadius: radius,
          backgroundColor: "#ffffff",
          paddingHorizontal: w * 0.08,
          paddingVertical: h * 0.04,
        },
        selected && styles.selected,
        style,
      ]}
    >
      <View style={styles.cornerTL}>
        <Text
          style={{
            color,
            fontSize: rankSize,
            lineHeight: rankSize * 1.05,
            fontWeight: "800",
            includeFontPadding: false,
          }}
        >
          {card.rank}
        </Text>
        <Text
          style={{
            color,
            fontSize: suitSize,
            lineHeight: suitSize * 1.1,
            includeFontPadding: false,
          }}
        >
          {symbol}
        </Text>
      </View>

      <View
        style={[
          StyleSheet.absoluteFill,
          {
            alignItems: "center",
            justifyContent: "center",
            paddingTop: h * 0.1,
          },
        ]}
      >
        <Text
          style={{
            color,
            fontSize: w * 0.7,
            opacity: 0.92,
            includeFontPadding: false,
          }}
        >
          {symbol}
        </Text>
      </View>

      <View style={styles.cornerBR}>
        <Text
          style={{
            color,
            fontSize: rankSize * 0.7,
            lineHeight: rankSize * 0.75,
            fontWeight: "800",
            includeFontPadding: false,
          }}
        >
          {card.rank}
        </Text>
      </View>
    </View>
  );

  const lift = selected ? -h * 0.1 : 0;

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          transform: [{ translateY: lift }, { scale: pressed ? 0.97 : 1 }],
        })}
      >
        {face}
      </Pressable>
    );
  }

  return <View style={{ transform: [{ translateY: lift }] }}>{face}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    overflow: "hidden",
  },
  selected: {
    borderColor: "#eab308",
    borderWidth: 2,
    shadowColor: "#eab308",
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 8,
  },
  cornerTL: { alignItems: "center", alignSelf: "flex-start" },
  cornerBR: {
    position: "absolute",
    right: 3,
    bottom: 2,
    transform: [{ rotate: "180deg" }],
  },
});

export default PlayingCard;
