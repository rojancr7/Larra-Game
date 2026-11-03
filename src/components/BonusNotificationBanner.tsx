import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../constants/theme";
import { Card } from "../engine/deck";
import { triggerHaptic } from "../services/audioHaptics";
import { PlayingCard } from "./PlayingCard";

export interface ActiveBonusNotification {
  id: string;
  type: "instantBonus" | "cleanSweep" | "trailR4" | "instantVictory";
  title: string;
  playerName: string;
  playerIndex: number;
  points: number;
  description: string;
  cards?: Card[];
}

interface Props {
  notifications: ActiveBonusNotification[];
  onDismiss: (id: string) => void;
}

/** Single-line gold pill. Tap to see details, tap the x to dismiss. Position it from the parent. */
export const BonusNotificationBanner: React.FC<Props> = ({
  notifications,
  onDismiss,
}) => {
  const [selected, setSelected] = useState<ActiveBonusNotification | null>(
    null,
  );
  if (notifications.length === 0) return null;

  return (
    <>
      <View style={styles.stack} pointerEvents="box-none">
        {notifications.slice(0, 2).map((b) => (
          <Pressable
            key={b.id}
            style={styles.pill}
            onPress={() => {
              triggerHaptic("selection");
              setSelected(b);
            }}
          >
            <Text style={styles.bolt}>⚡</Text>
            <Text style={styles.text} numberOfLines={1}>
              {b.title.toUpperCase()}: {b.playerName} (+{b.points} PTS)
            </Text>
            <Pressable
              hitSlop={8}
              onPress={() => {
                triggerHaptic("selection");
                onDismiss(b.id);
              }}
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </Pressable>
        ))}
      </View>

      {selected && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setSelected(null)}
        >
          <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
            <View style={styles.detail}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>🌟 {selected.title}</Text>
                <Text style={styles.detailPts}>+{selected.points} PTS</Text>
              </View>
              <Text style={styles.detailPlayer}>
                Awarded to {selected.playerName}
              </Text>
              <Text style={styles.detailDesc}>{selected.description}</Text>
              {selected.cards && selected.cards.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cards}
                >
                  {selected.cards.map((c) => (
                    <PlayingCard key={c.id} card={c} size="sm" />
                  ))}
                </ScrollView>
              )}
              <Pressable
                style={styles.closeBtn}
                onPress={() => setSelected(null)}
              >
                <Text style={styles.closeBtnText}>Got it</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  stack: { alignItems: "center", gap: 4 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e0aa1f",
    borderWidth: 1.5,
    borderColor: "#fff0a8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    maxWidth: 460,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  bolt: { fontSize: 13 },
  text: { color: "#3a2606", fontSize: 12, fontWeight: "900", flexShrink: 1 },
  close: { color: "#3a2606", fontSize: 12, fontWeight: "900", marginLeft: 4 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  detail: {
    backgroundColor: "#0f1d14",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.gold,
    width: "100%",
    maxWidth: 380,
    padding: 16,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
    paddingBottom: 8,
    marginBottom: 8,
  },
  detailTitle: { color: "#fef08a", fontSize: 15, fontWeight: "800" },
  detailPts: { color: "#4ade80", fontSize: 14, fontWeight: "900" },
  detailPlayer: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  detailDesc: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  cards: { flexDirection: "row", gap: 6, marginBottom: 12 },
  closeBtn: {
    backgroundColor: colors.goldDark,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});

export default BonusNotificationBanner;
