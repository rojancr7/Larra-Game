import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";
import { Player } from "../engine/gameController";
import { PlayerScore } from "../engine/scoring";

interface Props {
  players: Player[];
  scores: PlayerScore[];
  width?: number;
}

/** Compact gold-header leaderboard. Index 0 is always the local player. */
export const LeaderboardPanel: React.FC<Props> = ({
  players,
  scores,
  width = 150,
}) => (
  <View style={[styles.panel, { width }]}>
    <View style={styles.header}>
      <Text style={styles.headerText}>🏆 LEADERBOARD</Text>
    </View>
    {players.map((p, i) => {
      const you = i === 0;
      return (
        <View key={p.id} style={[styles.row, you && styles.rowYou]}>
          <Text style={styles.marker}>{you ? "◆" : " "}</Text>
          <Text style={[styles.name, you && styles.nameYou]} numberOfLines={1}>
            {you ? `${p.name} (You)` : p.name}
          </Text>
          <Text style={[styles.pts, you && styles.nameYou]}>
            {scores[i]?.points ?? 0}
          </Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "rgba(10, 40, 22, 0.95)",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.goldDark,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#d9a521",
    paddingVertical: 3,
    alignItems: "center",
  },
  headerText: {
    color: "#3a2606",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
  },
  rowYou: { backgroundColor: "rgba(234, 179, 8, 0.2)" },
  marker: { color: colors.goldLight, fontSize: 9, width: 11 },
  name: { flex: 1, color: "#e5e7eb", fontSize: 11, fontWeight: "600" },
  nameYou: { color: "#fff", fontWeight: "800" },
  pts: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "800",
    minWidth: 16,
    textAlign: "right",
  },
});

export default LeaderboardPanel;
