import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { MUSIC_TRACKS } from "../constants/gameAssets";
import { triggerHaptic } from "../services/audioHaptics";
import {
  forcePlayPlaceSound,
  forcePlaySpreadSound,
  playBackgroundMusic,
  stopBackgroundMusic,
} from "../services/soundService";
import {
  DEFAULT_SETTINGS,
  GameSettings,
  MusicTrackId,
  SpreadSpeed,
  loadSettings,
  resetSettings,
  saveSettings,
} from "../services/storage";
import { Palette, ThemeMode, useTheme } from "../theme/appTheme";

type Difficulty = GameSettings["difficulty"];

const THEME_OPTIONS: { id: ThemeMode; label: string }[] = [
  { id: "system", label: "Match phone" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

const SPEED_OPTIONS: { id: SpreadSpeed; label: string; desc: string }[] = [
  {
    id: "slow",
    label: "Slow",
    desc: "Relaxed, like a dealer at a casino table.",
  },
  { id: "medium", label: "Medium", desc: "A natural pace. Recommended." },
  {
    id: "fast",
    label: "Fast",
    desc: "Quick dealing for players who know the game.",
  },
  {
    id: "instant",
    label: "Instant",
    desc: "Cards appear at once, with no dealing animation.",
  },
];

const DIFFICULTY_OPTIONS: { id: string; label: string; desc: string }[] = [
  {
    id: "easy",
    label: "Easy",
    desc: "Plays casually. Good for learning the game.",
  },
  {
    id: "med",
    label: "Medium",
    desc: "A balanced opponent that plays a fair game.",
  },
  {
    id: "hard",
    label: "Hard",
    desc: "Plans its hand carefully and rarely makes mistakes.",
  },
];

const TRACK_NAMES: Record<string, string> = {
  sound1: "Casino lounge",
  sound2: "Night arena",
  none: "No music",
};

// Row of choices where exactly one is selected
function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: c.inset,
        borderRadius: 12,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.id)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 9,
              alignItems: "center",
              borderWidth: 1,
              borderColor: on ? c.border : "transparent",
              backgroundColor: on ? c.surface : "transparent",
            }}
          >
            <Text
              style={{
                color: on ? c.text : c.textMuted,
                fontSize: 13,
                fontWeight: on ? "800" : "600",
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const { c, shared, mode, setMode, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [previewingMusic, setPreviewingMusic] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always holds the newest settings, so two quick changes never overwrite each other
  const latest = useRef<GameSettings>(DEFAULT_SETTINGS);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSettings().then((s) => {
        if (!active) return;
        latest.current = s;
        setSettings(s);
      });
      return () => {
        active = false;
        stopBackgroundMusic();
        setPreviewingMusic(false);
      };
    }, []),
  );

  const flashSaved = () => {
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 1500);
  };

  // Change one or more settings at once
  const apply = (patch: Partial<GameSettings>, haptic = true) => {
    if (haptic) triggerHaptic("selection");
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setSettings(next);
    saveSettings(next);
    flashSaved();
  };

  const handleTestSpreadSound = async () => {
    triggerHaptic("impactLight");
    await forcePlaySpreadSound();
  };

  const handleTestPlaceSound = async () => {
    triggerHaptic("selection");
    await forcePlayPlaceSound();
  };

  const handleToggleMusicPreview = async () => {
    triggerHaptic("selection");
    if (previewingMusic) {
      await stopBackgroundMusic();
      setPreviewingMusic(false);
    } else {
      const track =
        settings.musicTrack === "none" ? "sound1" : settings.musicTrack;
      await playBackgroundMusic(track);
      setPreviewingMusic(true);
    }
  };

  const handlePickTrack = async (id: MusicTrackId) => {
    apply({ musicTrack: id, musicEnabled: id !== "none" });
    if (previewingMusic) {
      if (id === "none") {
        await stopBackgroundMusic();
        setPreviewingMusic(false);
      } else {
        await playBackgroundMusic(id);
      }
    }
  };

  const handleReset = async () => {
    // First tap asks, second tap does it (Alert doesn't work on web)
    if (!confirmReset) {
      setConfirmReset(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setConfirmReset(false);
    triggerHaptic("warning");
    await stopBackgroundMusic();
    setPreviewingMusic(false);
    const fresh = await resetSettings();
    latest.current = fresh;
    setSettings(fresh);
    flashSaved();
  };

  const speed = settings.spreadSpeed || "medium";
  const difficulty = settings.difficulty || "easy";
  const soundOn = settings.soundEffects;

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={[shared.content, { paddingBottom: 40 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headRow}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={shared.pageTitle}>Settings</Text>
          <Text style={shared.pageSub}>
            Look, sound, dealing speed and the computer opponent
          </Text>
        </View>
        {saved && (
          <View style={styles.savedPill}>
            <Text style={styles.savedText}>Saved</Text>
          </View>
        )}
      </View>

      {/* Appearance */}
      <View style={shared.card}>
        <Text style={styles.title}>Appearance</Text>
        <Text style={styles.sub}>
          {mode === "system"
            ? `Following your phone. Right now that means ${scheme} mode.`
            : `Always ${mode} mode, whatever your phone is set to.`}
        </Text>
        <Segmented options={THEME_OPTIONS} value={mode} onChange={setMode} />
      </View>

      {/* Dealing speed */}
      <View style={shared.card}>
        <Text style={styles.title}>Dealing speed</Text>
        <Text style={styles.sub}>How fast the 13 cards are dealt out</Text>

        <Segmented
          options={SPEED_OPTIONS}
          value={speed}
          onChange={(id) => apply({ spreadSpeed: id })}
        />
        <Text style={styles.hint}>
          {SPEED_OPTIONS.find((s) => s.id === speed)?.desc}
        </Text>

        <Pressable style={styles.outlineBtn} onPress={handleTestSpreadSound}>
          <Text style={styles.outlineBtnText}>Try the dealing sound</Text>
        </Pressable>
      </View>

      {/* Sound */}
      <View style={shared.card}>
        <Text style={styles.title}>Sound and vibration</Text>

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchLabel}>Sound effects</Text>
            <Text style={styles.switchDesc}>
              Turns every card sound on or off
            </Text>
          </View>
          <Switch
            value={soundOn}
            onValueChange={(v) => apply({ soundEffects: v })}
            trackColor={{ false: c.border, true: c.success }}
            thumbColor="#F5F5F0"
          />
        </View>

        <View
          style={[
            styles.switchRow,
            styles.switchDivider,
            !soundOn && styles.dimmed,
          ]}
        >
          <View style={styles.switchText}>
            <View style={styles.labelWithTest}>
              <Text style={styles.switchLabel}>Dealing sound</Text>
              <Pressable
                style={styles.testPill}
                onPress={handleTestSpreadSound}
                disabled={!soundOn}
              >
                <Text style={styles.testPillText}>Test</Text>
              </Pressable>
            </View>
            <Text style={styles.switchDesc}>
              The riffle you hear as cards are dealt
            </Text>
          </View>
          <Switch
            value={settings.spreadSound !== false}
            onValueChange={(v) => apply({ spreadSound: v })}
            disabled={!soundOn}
            trackColor={{ false: c.border, true: c.success }}
            thumbColor="#F5F5F0"
          />
        </View>

        <View
          style={[
            styles.switchRow,
            styles.switchDivider,
            !soundOn && styles.dimmed,
          ]}
        >
          <View style={styles.switchText}>
            <View style={styles.labelWithTest}>
              <Text style={styles.switchLabel}>Card taps and moves</Text>
              <Pressable
                style={styles.testPill}
                onPress={handleTestPlaceSound}
                disabled={!soundOn}
              >
                <Text style={styles.testPillText}>Test</Text>
              </Pressable>
            </View>
            <Text style={styles.switchDesc}>
              Clicks when you pick up, slide or place a card
            </Text>
          </View>
          <Switch
            value={settings.cardMoveSound !== false}
            onValueChange={(v) => apply({ cardMoveSound: v })}
            disabled={!soundOn}
            trackColor={{ false: c.border, true: c.success }}
            thumbColor="#F5F5F0"
          />
        </View>

        <View style={[styles.switchRow, styles.switchDivider]}>
          <View style={styles.switchText}>
            <Text style={styles.switchLabel}>Vibration</Text>
            <Text style={styles.switchDesc}>
              A small buzz when you select cards or declare
            </Text>
          </View>
          <Switch
            value={settings.vibration}
            onValueChange={(v) => apply({ vibration: v })}
            trackColor={{ false: c.border, true: c.success }}
            thumbColor="#F5F5F0"
          />
        </View>
      </View>

      {/* Music */}
      <View style={shared.card}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.title}>Background music</Text>
            <Text style={styles.sub}>Plays quietly while you play</Text>
          </View>
          <Pressable
            style={[styles.previewBtn, previewingMusic && styles.previewBtnOn]}
            onPress={handleToggleMusicPreview}
          >
            <Text
              style={[
                styles.previewBtnText,
                previewingMusic && { color: c.dangerText },
              ]}
            >
              {previewingMusic ? "Stop" : "Listen"}
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          {MUSIC_TRACKS.map((m) => {
            const active =
              (settings.musicTrack || "sound1") === m.id &&
              (m.id === "none"
                ? !settings.musicEnabled
                : settings.musicEnabled);

            return (
              <Pressable
                key={m.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.option, active && styles.optionOn]}
                onPress={() => handlePickTrack(m.id as MusicTrackId)}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.optionLabel, active && styles.optionLabelOn]}
                  >
                    {TRACK_NAMES[m.id] ?? m.id}
                  </Text>
                  <Text style={styles.optionDesc}>{m.description}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioOn]}>
                  {active && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Computer opponent */}
      <View style={shared.card}>
        <Text style={styles.title}>Computer opponent</Text>
        <Text style={styles.sub}>Used in games you play offline</Text>

        <Segmented
          options={DIFFICULTY_OPTIONS}
          value={difficulty as string}
          onChange={(id) => apply({ difficulty: id as Difficulty })}
        />
        <Text style={styles.hint}>
          {DIFFICULTY_OPTIONS.find((d) => d.id === difficulty)?.desc}
        </Text>
      </View>

      {/* Name */}
      <View style={shared.card}>
        <Text style={styles.title}>Display name</Text>
        <Text style={styles.sub}>Shown on the scoreboard and at your seat</Text>
        <TextInput
          style={styles.input}
          value={settings.playerName}
          onChangeText={(t) => apply({ playerName: t }, false)}
          placeholder="Your name"
          placeholderTextColor={c.textDim}
          maxLength={20}
        />
      </View>

      <Pressable
        style={[styles.reset, confirmReset && styles.resetConfirm]}
        onPress={handleReset}
        accessibilityRole="button"
      >
        <Text style={[styles.resetText, confirmReset && { color: c.onAccent }]}>
          {confirmReset
            ? "Tap again to reset game settings"
            : "Reset game settings"}
        </Text>
      </Pressable>
      <Text style={styles.footnote}>
        Resetting keeps your light or dark choice.
      </Text>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    headRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    savedPill: {
      backgroundColor: c.successSoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    savedText: { color: c.successText, fontSize: 12, fontWeight: "700" },

    title: { color: c.text, fontSize: 16, fontWeight: "800" },
    sub: { color: c.textMuted, fontSize: 13, marginTop: 2, marginBottom: 12 },
    hint: { color: c.textMuted, fontSize: 13, marginTop: 10 },
    titleRow: { flexDirection: "row", alignItems: "flex-start" },

    outlineBtn: {
      marginTop: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: "center",
    },
    outlineBtnText: { color: c.accentText, fontSize: 13, fontWeight: "700" },

    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    switchText: { flex: 1, paddingRight: 12 },
    switchDivider: { borderTopWidth: 1, borderTopColor: c.border },
    switchLabel: { color: c.text, fontSize: 14, fontWeight: "700" },
    switchDesc: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    dimmed: { opacity: 0.45 },
    labelWithTest: { flexDirection: "row", alignItems: "center", gap: 8 },
    testPill: {
      backgroundColor: c.accentSoft,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    testPillText: { color: c.accentText, fontSize: 11, fontWeight: "700" },

    previewBtn: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    previewBtnOn: { borderColor: c.danger, backgroundColor: c.dangerSoft },
    previewBtnText: { color: c.text, fontSize: 12, fontWeight: "700" },

    option: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.bg,
      borderColor: c.border,
      borderWidth: 1.5,
      borderRadius: 12,
      padding: 12,
    },
    optionOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    optionLabel: { color: c.text, fontSize: 14, fontWeight: "700" },
    optionLabelOn: { color: c.accentText },
    optionDesc: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
    },
    radioOn: { borderColor: c.accent },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.accent,
    },

    input: {
      backgroundColor: c.bg,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 12,
      color: c.text,
      fontSize: 15,
      fontWeight: "600",
      paddingHorizontal: 14,
      paddingVertical: 11,
    },

    reset: {
      borderColor: c.danger,
      borderWidth: 1.5,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    resetConfirm: { backgroundColor: c.danger },
    resetText: { color: c.dangerText, fontSize: 14, fontWeight: "700" },
    footnote: {
      color: c.textDim,
      fontSize: 12,
      textAlign: "center",
      marginTop: -4,
    },
  });
