import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { C, shared } from "./theme";
import { triggerHaptic } from "../services/audioHaptics";
import {
  DEFAULT_SETTINGS,
  GameSettings,
  GameTheme,
  loadSettings,
  resetSettings,
  saveSettings,
} from "../services/storage";

const THEMES: { id: GameTheme; label: string; desc: string }[] = [
  {
    id: "casino",
    label: "🎰 Casino Royale",
    desc: "Classic gold-embossed felt table",
  },
  { id: "regal", label: "👑 Regal Palace", desc: "Luxury tournament styling" },
  {
    id: "minimal",
    label: "✨ Clean Minimal",
    desc: "Modern high-contrast layout",
  },
];

const TOGGLES: {
  key: "soundEffects" | "vibration" | "animations";
  label: string;
  desc: string;
}[] = [
  {
    key: "soundEffects",
    label: "Sound effects",
    desc: "Card flipping, shuffling and winning sounds",
  },
  {
    key: "vibration",
    label: "Haptic vibration",
    desc: "Vibrate on card selection and wins",
  },
  {
    key: "animations",
    label: "Animations",
    desc: "Card transitions and banner reveals",
  },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSettings().then((s) => active && setSettings(s));
      return () => {
        active = false;
      };
    }, []),
  );

  const flashSaved = () => {
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 1500);
  };

  const update = <K extends keyof GameSettings>(
    key: K,
    val: GameSettings[K],
  ) => {
    triggerHaptic("selection");
    const next = { ...settings, [key]: val };
    setSettings(next);
    saveSettings(next);
    flashSaved();
  };

  const handleReset = async () => {
    triggerHaptic("warning");
    const fresh = await resetSettings();
    setSettings(fresh);
    flashSaved();
  };

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={shared.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headRow}>
        <View>
          <Text style={shared.pageTitle}>⚙️ Game preferences</Text>
          <Text style={shared.pageSub}>Audio, feedback and look</Text>
        </View>
        {saved && <Text style={styles.saved}>Saved ✓</Text>}
      </View>

      {/* Display name */}
      <View style={shared.card}>
        <Text style={styles.title}>Display name</Text>
        <Text style={styles.sub}>Shown at the table during matches</Text>
        <TextInput
          style={styles.input}
          value={settings.playerName}
          onChangeText={(t) => update("playerName", t)}
          placeholder="Enter your name"
          placeholderTextColor={C.dim}
          maxLength={20}
        />
      </View>

      {/* Bot Difficulty */}
      <View style={shared.card}>
        <Text style={styles.title}>Bot difficulty</Text>
        <Text style={styles.sub}>Default tactical skill for computer opponents</Text>
        <View style={styles.diffGrid}>
          {[
            { id: "easy", label: "🟢 Easy", desc: "Casual & beginner friendly" },
            { id: "med", label: "🟡 Medium", desc: "Balanced tactical gameplay" },
            { id: "hard", label: "🔴 Hard", desc: "Tournament grandmaster AI" },
          ].map((d) => {
            const active = (settings.difficulty || "easy") === d.id;
            return (
              <Pressable
                key={d.id}
                style={[styles.diffCard, active && styles.diffCardActive]}
                onPress={() => update("difficulty", d.id as any)}
              >
                <Text
                  style={[
                    styles.diffCardLabel,
                    active && styles.diffCardLabelActive,
                  ]}
                >
                  {d.label}
                </Text>
                <Text style={styles.diffCardDesc}>{d.desc}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Toggles */}
      <View style={shared.card}>
        {TOGGLES.map((t, i) => (
          <View
            key={t.key}
            style={[styles.switchRow, i > 0 && styles.switchDivider]}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.switchLabel}>{t.label}</Text>
              <Text style={styles.switchDesc}>{t.desc}</Text>
            </View>
            <Switch
              value={settings[t.key]}
              onValueChange={(v) => update(t.key, v)}
              trackColor={{ false: C.border, true: C.emerald }}
              thumbColor={settings[t.key] ? C.bg : C.muted}
            />
          </View>
        ))}
      </View>

      {/* Theme */}
      <View style={shared.card}>
        <Text style={[styles.title, { marginBottom: 10 }]}>
          Aesthetic theme
        </Text>
        <View style={{ gap: 8 }}>
          {THEMES.map((t) => {
            const on = settings.theme === t.id;
            return (
              <Pressable
                key={t.id}
                style={[styles.theme, on && styles.themeOn]}
                onPress={() => update("theme", t.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>{t.label}</Text>
                  <Text style={styles.switchDesc}>{t.desc}</Text>
                </View>
                {on && <Text style={styles.check}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.sub, { marginTop: 10, marginBottom: 0 }]}>
          Card backs and table colors are in the Store tab.
        </Text>
      </View>

      <Pressable style={styles.reset} onPress={handleReset}>
        <Text style={styles.resetText}>🔄 Reset all settings to default</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saved: { color: C.emerald, fontSize: 12, fontWeight: "800" },
  title: { color: C.white, fontSize: 15, fontWeight: "800" },
  sub: { color: C.muted, fontSize: 12, marginTop: 2, marginBottom: 12 },
  input: {
    backgroundColor: C.bg,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 12,
    color: C.white,
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  diffGrid: {
    gap: 8,
  },
  diffCard: {
    backgroundColor: "rgba(2, 6, 23, 0.8)",
    borderColor: C.border,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
  },
  diffCardActive: {
    borderColor: C.emerald,
    backgroundColor: C.emeraldSoft,
  },
  diffCardLabel: {
    color: C.white,
    fontSize: 14,
    fontWeight: "800",
  },
  diffCardLabelActive: {
    color: C.emeraldLight,
  },
  diffCardDesc: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  switchDivider: { borderTopWidth: 1, borderTopColor: C.border },
  switchLabel: { color: C.white, fontSize: 14, fontWeight: "700" },
  switchDesc: { color: C.muted, fontSize: 12, marginTop: 2 },
  theme: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 6, 23, 0.8)",
    borderColor: C.border,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
  },
  themeOn: { borderColor: C.amber, backgroundColor: C.amberSoft },
  check: { color: C.amber, fontSize: 16, fontWeight: "900" },
  reset: {
    backgroundColor: C.roseSoft,
    borderColor: "rgba(244, 63, 94, 0.3)",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  resetText: { color: "#fda4af", fontSize: 13, fontWeight: "800" },
});
