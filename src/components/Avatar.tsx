import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";

interface AvatarProps {
  emoji: string;
  color?: string;
  name: string;
  size?: number;
  ready?: boolean;
  highlight?: boolean;
}

/** Circular gold ring avatar with a name pill overlapping its bottom edge. */
export const Avatar: React.FC<AvatarProps> = ({
  emoji,
  color = "#64748b",
  name,
  size = 52,
  ready,
  highlight,
}) => (
  <View style={styles.wrap}>
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + "44",
          shadowOpacity: highlight ? 0.9 : 0.4,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
      {ready !== undefined && (
        <View
          style={[
            styles.dot,
            { backgroundColor: ready ? "#22c55e" : "#eab308" },
          ]}
        />
      )}
    </View>
    <View style={[styles.pill, { marginTop: -size * 0.2 }]}>
      <Text style={styles.pillText} numberOfLines={1}>
        {name}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  ring: {
    borderWidth: 3,
    borderColor: colors.goldMid,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: "#13202a",
  },
  dot: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#0b1a10",
  },
  pill: {
    backgroundColor: colors.woodDeep,
    borderWidth: 1.5,
    borderColor: colors.goldDark,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 1,
    maxWidth: 110,
  },
  pillText: { color: colors.cream, fontSize: 11, fontWeight: "700" },
});

export default Avatar;
