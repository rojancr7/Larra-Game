import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GROUP_SIZES, GroupTag, tagFor } from "../constants/handTags";
import { colors, useTableScale } from "../constants/theme";
import { Card } from "../engine/deck";
import { triggerHaptic } from "../services/audioHaptics";
import { PlayingCard } from "./PlayingCard";

export interface HandTrayProps {
  roundGroups: Card[][];
  /** Cards not yet placed in a slot. */
  handCards: Card[];
  selectedCardId: string | null;
  isReady: boolean;
  assignedCount: number;
  /** 'arrange' = player is editing. 'settled' = results are in, tray is locked. */
  mode: "arrange" | "settled";
  isGameOver?: boolean;
  /** When set, a gold THROW button appears above Confirm. */
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

const SLOT_COLORS = [
  { text: "#fde68a", bg: "#4a3410", border: "#b8860b" },
  { text: "#86efac", bg: "#12361f", border: "#22c55e" },
  { text: "#fca5a5", bg: "#4a1414", border: "#ef4444" },
  { text: "#7dd3fc", bg: "#0c2a45", border: "#38bdf8" },
];

const TAG_COLORS: Record<GroupTag["tone"], { bg: string; border: string }> = {
  good: { bg: "#14532d", border: "#4ade80" },
  weak: { bg: "#7f1d1d", border: "#f87171" },
  bonus: { bg: "#854d0e", border: "#fde047" },
};

interface SlotProps {
  index: number;
  cards: Card[];
  k: number;
  selectedId: string | null;
  glow: boolean;
  tag: GroupTag | null;
  locked: boolean;
  onTapCard: (card: Card) => void;
  onTapSlot: (i: number) => void;
}

const HandSlot: React.FC<SlotProps> = ({
  index,
  cards,
  k,
  selectedId,
  glow,
  tag,
  locked,
  onTapCard,
  onTapSlot,
}) => {
  const size = GROUP_SIZES[index];
  const cw = 62 * k;
  const ch = 88 * k;
  const step = cw * 0.55;
  const c = SLOT_COLORS[index];
  const width = cw + step * (size - 1) + 14;

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={[
          styles.slotLabel,
          { backgroundColor: c.bg, borderColor: c.border },
        ]}
      >
        <Text style={[styles.slotLabelText, { color: c.text }]}>
          {size} Cards
        </Text>
      </View>

      <Pressable
        disabled={locked}
        onPress={() => onTapSlot(index)}
        style={[
          styles.slot,
          { width, height: ch + 18 },
          glow && styles.slotGlow,
        ]}
      >
        {cards.length === 0 ? (
          <Text style={styles.empty}>Tap to place</Text>
        ) : (
          <View style={styles.cardsRow}>
            {cards.map((card, i) => (
              <View
                key={card.id}
                style={{
                  marginLeft: i === 0 ? 0 : -(cw - step),
                  zIndex: card.id === selectedId ? 50 : i,
                }}
              >
                <PlayingCard
                  card={card}
                  size="md"
                  scale={k}
                  selected={card.id === selectedId}
                  onPress={locked ? undefined : () => onTapCard(card)}
                />
              </View>
            ))}
          </View>
        )}
      </Pressable>

      {tag && (
        <View style={styles.tagWrap} pointerEvents="none">
          <View
            style={[
              styles.tag,
              {
                backgroundColor: TAG_COLORS[tag.tone].bg,
                borderColor: TAG_COLORS[tag.tone].border,
              },
            ]}
          >
            <Text
              style={[styles.tagText, { fontSize: Math.max(8, 10 * k) }]}
              numberOfLines={1}
            >
              {tag.tone === "bonus" ? tag.label.toUpperCase() : tag.label}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export const HandTray: React.FC<HandTrayProps> = ({
  roundGroups,
  handCards,
  selectedCardId,
  isReady,
  assignedCount,
  mode,
  isGameOver = false,
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
  const { W, H } = useTableScale();
  const locked = mode === "settled";
  const k = Math.max(
    0.5,
    Math.min((H * 0.2) / 88, (0.66 * W - 70) / 554, 1.15),
  );
  const tags = roundGroups.map((g, i) => tagFor(g, i));
  const selectedGroup = selectedCardId
    ? roundGroups.findIndex((g) => g.some((c) => c.id === selectedCardId))
    : -1;
  const glowIndex =
    selectedGroup >= 0 ? selectedGroup : tags[3]?.tone === "bonus" ? 3 : -1;
  const sideWidth = W * 0.15;

  const leftBtn = locked
    ? { label: "RESULTS", icon: "📊", onPress: onViewResults }
    : { label: "AUTO-ARRANGE", icon: "✨", onPress: onAutoArrange };

  const right = locked
    ? isGameOver
      ? {
          label: "PLAY AGAIN",
          icon: "🏆",
          onPress: onNewMatch,
          disabled: false,
          gold: true,
        }
      : {
          label: "NEXT HAND",
          icon: "➜",
          onPress: onNextDeal,
          disabled: false,
          gold: false,
        }
    : {
        label: isReady ? "CONFIRM & PLAY HAND" : `ARRANGE ${assignedCount}/13`,
        icon: "⚡",
        onPress: onConfirm,
        disabled: !isReady,
        gold: false,
      };

  return (
    <View style={styles.row}>
      <View style={{ width: sideWidth, justifyContent: "flex-end" }}>
        <Pressable
          onPress={() => {
            triggerHaptic("selection");
            leftBtn.onPress();
          }}
          style={[styles.btn, styles.btnBlue]}
        >
          <Text style={styles.btnIcon}>{leftBtn.icon}</Text>
          <Text style={styles.btnText}>{leftBtn.label}</Text>
        </Pressable>
      </View>

      <View style={styles.trayWrap}>
        {!locked && handCards.length > 0 && (
          <Pressable onPress={onTapPool} style={styles.pool}>
            <Text style={styles.poolText}>
              {selectedGroup >= 0
                ? "Tap here to return the card"
                : `Your cards (${handCards.length})`}
            </Text>
            <View style={styles.cardsRow}>
              {handCards.map((c, i) => (
                <View
                  key={c.id}
                  style={{
                    marginLeft: i === 0 ? 0 : -(62 * k * 0.62) * 0.45,
                    zIndex: c.id === selectedCardId ? 50 : i,
                  }}
                >
                  <PlayingCard
                    card={c}
                    size="md"
                    scale={k * 0.62}
                    selected={c.id === selectedCardId}
                    onPress={() => onTapCard(c)}
                  />
                </View>
              ))}
            </View>
          </Pressable>
        )}

        <View style={styles.tray}>
          <View style={styles.slotsRow}>
            {roundGroups.map((g, i) => (
              <HandSlot
                key={i}
                index={i}
                cards={g}
                k={k}
                selectedId={selectedCardId}
                glow={glowIndex === i}
                tag={tags[i]}
                locked={locked}
                onTapCard={onTapCard}
                onTapSlot={onTapSlot}
              />
            ))}
          </View>
        </View>

        <View style={styles.caption}>
          <Text style={styles.captionText}>
            YOUR 13-CARD HAND (3-3-3-4 SPLIT)
          </Text>
        </View>
      </View>

      <View style={{ width: sideWidth, justifyContent: "flex-end" }}>
        {!locked && throwLabel ? (
          <Pressable onPress={onThrow} style={[styles.btn, styles.btnThrow]}>
            <Text style={styles.btnIcon}>🔥</Text>
            <Text style={styles.btnText}>THROW: {throwLabel}</Text>
          </Pressable>
        ) : null}
        <Pressable
          disabled={right.disabled}
          onPress={() => {
            triggerHaptic("selection");
            right.onPress();
          }}
          style={[
            styles.btn,
            right.gold ? styles.btnGold : styles.btnGreen,
            right.disabled && styles.btnDisabled,
          ]}
        >
          <Text style={styles.btnIcon}>{right.icon}</Text>
          <Text style={styles.btnText}>{right.label}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  trayWrap: { alignItems: "center" },
  pool: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  poolText: {
    color: colors.cream,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 2,
  },
  tray: {
    backgroundColor: "#6b4423",
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#c9962f",
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  slotsRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  slotLabel: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 1,
    marginBottom: 3,
  },
  slotLabelText: { fontSize: 11, fontWeight: "800" },
  slot: {
    backgroundColor: "#2a1608",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 8,
  },
  slotGlow: {
    borderColor: "#38bdf8",
    shadowColor: "#38bdf8",
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 12,
  },
  cardsRow: { flexDirection: "row", alignItems: "center" },
  empty: { color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "700" },
  tagWrap: {
    position: "absolute",
    left: -10,
    right: -10,
    bottom: -9,
    alignItems: "center",
  },
  tag: {
    borderWidth: 1.5,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  tagText: { color: "#fff", fontWeight: "800" },
  caption: {
    marginTop: -10,
    backgroundColor: "#3a2208",
    borderWidth: 1.5,
    borderColor: "#c9962f",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  captionText: {
    color: colors.cream,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 10,
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  btnBlue: { backgroundColor: "#2b5fb4", borderColor: "#7db0ff" },
  btnGreen: {
    backgroundColor: "#1f9d3f",
    borderColor: "#7ff0a0",
    shadowColor: "#4ade80",
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  btnGold: { backgroundColor: "#ca8a04", borderColor: "#fde047" },
  btnThrow: { backgroundColor: "#d97706", borderColor: "#fde047" },
  btnDisabled: {
    backgroundColor: "#3b4a40",
    borderColor: "#5b6b60",
    shadowOpacity: 0,
    opacity: 0.7,
  },
  btnIcon: { fontSize: 15 },
  btnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    flexShrink: 1,
  },
});

export default HandTray;
