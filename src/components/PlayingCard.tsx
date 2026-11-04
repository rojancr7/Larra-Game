import React from "react";
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Card, Suit } from "../engine/deck";
import { ThemeDef, ThemeId, getThemeById } from "../constants/themeManifest";
import { useAppTheme } from "../services/themeManager";

interface PlayingCardProps {
  card?: Card | null;
  faceDown?: boolean;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  /** Multiplies base size. Preserves exact 5:7 card ratio. */
  scale?: number;
  themeId?: ThemeId;
  style?: ViewStyle;
}

// Exactly 5:7 aspect ratio (900x1260 specs)
const BASE = {
  xs: { w: 35, h: 49 },
  sm: { w: 45, h: 63 },
  md: { w: 60, h: 84 },
  lg: { w: 80, h: 112 },
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

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  selected = false,
  onPress,
  disabled = false,
  size = "md",
  scale = 1,
  themeId,
  style,
}) => {
  const activeTheme = useAppTheme();
  const theme: ThemeDef = themeId ? getThemeById(themeId) : activeTheme;

  const w = Math.round(BASE[size].w * scale);
  const h = Math.round(BASE[size].h * scale);
  const radius = Math.max(3, Math.round(w * 0.12));

  if (faceDown || !card) {
    return (
      <View
        style={[
          styles.base,
          {
            width: w,
            height: h,
            borderRadius: radius,
            borderColor: theme.ui.accent,
            borderWidth: Math.max(1, w * 0.035),
            overflow: "hidden",
            backgroundColor: "transparent",
          },
          style,
        ]}
      >
        <Image
          source={theme.cardBackSource}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    );
  }

  const color = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];

  const content = (
    <View
      style={[
        styles.base,
        styles.faceUp,
        {
          width: w,
          height: h,
          borderRadius: radius,
          backgroundColor: "#fffdfa",
          borderColor: selected ? theme.ui.accent : "#d6d3d1",
          borderWidth: selected ? Math.max(2, w * 0.06) : 1,
        },
        selected && {
          shadowColor: theme.ui.accent,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
          elevation: 8,
          transform: [{ translateY: -6 }],
        },
        style,
      ]}
    >
      {/* Top-left rank & mini suit */}
      <View style={[styles.corner, { top: 2 * scale, left: 3 * scale }]}>
        <Text
          style={[
            styles.rank,
            { color, fontSize: Math.max(9, Math.round(11 * scale)) },
          ]}
        >
          {card.rank}
        </Text>
        <Text
          style={[
            styles.miniSuit,
            { color, fontSize: Math.max(7, Math.round(9 * scale)) },
          ]}
        >
          {symbol}
        </Text>
      </View>

      {/* Center suit emblem */}
      <View style={styles.center}>
        <Text
          style={[
            styles.bigSuit,
            { color, fontSize: Math.max(13, Math.round(22 * scale)) },
          ]}
        >
          {symbol}
        </Text>
      </View>

      {/* Bottom-right upside-down rank & mini suit */}
      <View
        style={[
          styles.corner,
          {
            bottom: 2 * scale,
            right: 3 * scale,
            transform: [{ rotate: "180deg" }],
          },
        ]}
      >
        <Text
          style={[
            styles.rank,
            { color, fontSize: Math.max(9, Math.round(11 * scale)) },
          ]}
        >
          {card.rank}
        </Text>
        <Text
          style={[
            styles.miniSuit,
            { color, fontSize: Math.max(7, Math.round(9 * scale)) },
          ]}
        >
          {symbol}
        </Text>
      </View>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable onPress={onPress} hitSlop={4}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  base: {
    justifyContent: "center",
    alignItems: "center",
  },
  faceUp: {
    position: "relative",
  },
  corner: {
    position: "absolute",
    alignItems: "center",
  },
  rank: {
    fontWeight: "900",
    lineHeight: 12,
  },
  miniSuit: {
    fontWeight: "900",
    lineHeight: 10,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  bigSuit: {
    fontWeight: "900",
  },
});

export default PlayingCard;
