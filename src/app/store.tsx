import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { C, serif, shared } from "./theme";
import { triggerHaptic } from "../services/audioHaptics";
import {
    BoardColor,
    CardBackColor,
    DEFAULT_SETTINGS,
    GameSettings,
    loadSettings,
    saveSettings,
} from "../services/storage";

const CARD_BACKS: {
  id: CardBackColor;
  label: string;
  color: string;
  border: string;
}[] = [
  {
    id: "gold-luxury",
    label: "Royal Gold",
    color: "#854d0e",
    border: "#fef08a",
  },
  {
    id: "classic-blue",
    label: "Midnight Velvet",
    color: "#1e3a8a",
    border: "#818cf8",
  },
  {
    id: "emerald-leaf",
    label: "Nepal Felt Green",
    color: "#065f46",
    border: "#6ee7b7",
  },
  { id: "royal-red", label: "Royal Red", color: "#991b1b", border: "#f472b6" },
];

const TABLES: { id: BoardColor; label: string; desc: string; color: string }[] =
  [
    {
      id: "classic-green",
      label: "Traditional Green Felt",
      desc: "Classic casino mat",
      color: "#0d381e",
    },
    {
      id: "emerald",
      label: "Emerald Felt",
      desc: "Deep green, richer tone",
      color: "#064e3b",
    },
    {
      id: "royal-blue",
      label: "Royal Blue",
      desc: "Night lounge feel",
      color: "#1e3a8a",
    },
    {
      id: "velvet-burgundy",
      label: "Velvet Burgundy",
      desc: "Warm and dramatic",
      color: "#4c0519",
    },
    {
      id: "midnight-slate",
      label: "Midnight Slate",
      desc: "Dark, low glare",
      color: "#0f172a",
    },
  ];

export default function StoreScreen() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSettings().then((s) => active && setSettings(s));
      return () => {
        active = false;
      };
    }, []),
  );

  const equip = <K extends "boardColor" | "cardBack">(
    key: K,
    val: GameSettings[K],
  ) => {
    triggerHaptic("selection");
    const next = { ...settings, [key]: val };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content}>
      <View>
        <Text style={shared.pageTitle}>🛍 Card & table customization</Text>
        <Text style={shared.pageSub}>
          Choose how your cards and table look in matches.
        </Text>
      </View>

      <Text style={shared.sectionLabel}>Card backs</Text>
      <View style={styles.cardGrid}>
        {CARD_BACKS.map((cb) => {
          const on = settings.cardBack === cb.id;
          return (
            <Pressable
              key={cb.id}
              onPress={() => equip("cardBack", cb.id)}
              style={[
                shared.card,
                styles.cardItem,
                on && { borderColor: C.amber, borderWidth: 2 },
              ]}
            >
              <View
                style={[
                  styles.cardBack,
                  { backgroundColor: cb.color, borderColor: cb.border },
                ]}
              >
                <Text style={styles.cardBackL}>L</Text>
              </View>
              <Text style={styles.itemName}>{cb.label}</Text>
              <View style={[styles.state, on && styles.stateOn]}>
                <Text style={[styles.stateText, on && { color: C.amberLight }]}>
                  {on ? "Equipped" : "Equip"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={[shared.sectionLabel, { marginTop: 6 }]}>Table mats</Text>
      <View style={{ gap: 10 }}>
        {TABLES.map((t) => {
          const on = settings.boardColor === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => equip("boardColor", t.id)}
              style={[
                shared.card,
                styles.tableItem,
                on && { borderColor: C.emerald, borderWidth: 2 },
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: t.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{t.label}</Text>
                <Text style={styles.itemDesc}>{t.desc}</Text>
              </View>
              <View
                style={[
                  styles.state,
                  on && {
                    backgroundColor: C.emeraldSoft,
                    borderColor: "rgba(16,185,129,0.4)",
                  },
                ]}
              >
                <Text
                  style={[styles.stateText, on && { color: C.emeraldLight }]}
                >
                  {on ? "Equipped" : "Equip"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cardItem: {
    width: "47.5%",
    flexGrow: 1,
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  cardBack: {
    width: 64,
    height: 96,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBackL: {
    color: C.white,
    fontSize: 22,
    fontWeight: "900",
    fontFamily: serif,
  },
  itemName: {
    color: C.white,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  itemDesc: { color: C.muted, fontSize: 10, marginTop: 1 },
  state: {
    backgroundColor: C.border,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stateOn: { backgroundColor: C.amberSoft },
  stateText: { color: C.amber, fontSize: 10, fontWeight: "800" },
  tableItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
});
