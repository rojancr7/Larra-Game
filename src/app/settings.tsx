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
import { C, shared } from '../theme/appTheme';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [previewingMusic, setPreviewingMusic] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSettings().then((s) => {
        if (active) setSettings(s);
      });
      return () => {
        active = false;
        stopBackgroundMusic();
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
      const track = settings.musicTrack === "none" ? "sound1" : settings.musicTrack;
      await playBackgroundMusic(track);
      setPreviewingMusic(true);
    }
  };

  const handleReset = async () => {
    triggerHaptic("warning");
    await stopBackgroundMusic();
    setPreviewingMusic(false);
    const fresh = await resetSettings();
    setSettings(fresh);
    flashSaved();
  };

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={[shared.content, { paddingBottom: 40 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headRow}>
        <View>
          <Text style={shared.pageTitle}>⚙️ Settings & Audio Controls</Text>
          <Text style={shared.pageSub}>
            Manage card dealing speed, realistic sounds, music and bot difficulty
          </Text>
        </View>
        {saved && <Text style={styles.saved}>Saved ✓</Text>}
      </View>

      {/* Card Dealing & Spread Speed */}
      <View style={shared.card}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.title}>🃏 Card Spread & Dealing Speed</Text>
            <Text style={styles.sub}>
              Controls the physical dealing animation and sound timing of 13 cards
            </Text>
          </View>
        </View>

        <View style={styles.speedGrid}>
          {[
            {
              id: "slow" as SpreadSpeed,
              label: "Slow (Relaxed)",
              desc: "Cinematic, deliberate casino card dealing (65ms step)",
            },
            {
              id: "medium" as SpreadSpeed,
              label: "Medium (Realistic)",
              desc: "Smooth realistic physical card flow — Default recommended (38ms step)",
            },
            {
              id: "fast" as SpreadSpeed,
              label: "Fast (Snappy)",
              desc: "Rapid dealing for fast tournament play (18ms step)",
            },
            {
              id: "instant" as SpreadSpeed,
              label: "Instant",
              desc: "Immediate card placement without staggered animation",
            },
          ].map((s) => {
            const active = (settings.spreadSpeed || "medium") === s.id;
            return (
              <Pressable
                key={s.id}
                style={[styles.speedOption, active && styles.speedOptionActive]}
                onPress={() => update("spreadSpeed", s.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.speedOptionLabel,
                      active && styles.speedOptionLabelActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                  <Text style={styles.speedOptionDesc}>{s.desc}</Text>
                </View>
                {active && <Text style={styles.activeCheck}>✓</Text>}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.testBtn}
          onPress={handleTestSpreadSound}
        >
          <Text style={styles.testBtnText}>
            ▶ Test Card Spread Sound & Vibration
          </Text>
        </Pressable>
      </View>

      {/* Audio & Sound Effects Management */}
      <View style={shared.card}>
        <Text style={styles.title}>🔊 Audio & Atmosphere Controls</Text>
        <Text style={styles.sub}>
          Real sound effects from assets/Card Spread sounds & assets/Sounds
        </Text>

        {/* Master Sound Effects */}
        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.switchLabel}>Master Sound Effects</Text>
            <Text style={styles.switchDesc}>
              Enable or disable all card sounds, spreads, and audio cues
            </Text>
          </View>
          <Switch
            value={settings.soundEffects}
            onValueChange={(v) => update("soundEffects", v)}
            trackColor={{ false: C.border, true: C.emerald }}
            thumbColor={settings.soundEffects ? C.bg : C.muted}
          />
        </View>

        {/* Card Spread Sound */}
        <View style={[styles.switchRow, styles.switchDivider]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.switchLabel}>Card Spread Sound</Text>
              <Pressable
                style={styles.smallTestPill}
                onPress={handleTestSpreadSound}
              >
                <Text style={styles.smallTestPillText}>▶ Test</Text>
              </Pressable>
            </View>
            <Text style={styles.switchDesc}>
              Realistic deck spread audio when cards are dealt out on the table
            </Text>
          </View>
          <Switch
            value={settings.spreadSound !== false}
            onValueChange={(v) => update("spreadSound", v)}
            trackColor={{ false: C.border, true: C.emerald }}
            thumbColor={settings.spreadSound !== false ? C.bg : C.muted}
          />
        </View>

        {/* Card Move Sound */}
        <View style={[styles.switchRow, styles.switchDivider]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.switchLabel}>Card Move & Tap Sound</Text>
              <Pressable
                style={styles.smallTestPill}
                onPress={handleTestPlaceSound}
              >
                <Text style={styles.smallTestPillText}>▶ Test</Text>
              </Pressable>
            </View>
            <Text style={styles.switchDesc}>
              Single card placement, sliding and selection clicks
            </Text>
          </View>
          <Switch
            value={settings.cardMoveSound !== false}
            onValueChange={(v) => update("cardMoveSound", v)}
            trackColor={{ false: C.border, true: C.emerald }}
            thumbColor={settings.cardMoveSound !== false ? C.bg : C.muted}
          />
        </View>

        {/* Haptic Vibration */}
        <View style={[styles.switchRow, styles.switchDivider]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.switchLabel}>Haptic Vibration</Text>
            <Text style={styles.switchDesc}>
              Physical vibration feedback on card selection, spread, and declarations
            </Text>
          </View>
          <Switch
            value={settings.vibration}
            onValueChange={(v) => update("vibration", v)}
            trackColor={{ false: C.border, true: C.emerald }}
            thumbColor={settings.vibration ? C.bg : C.muted}
          />
        </View>
      </View>

      {/* Background Music Configuration */}
      <View style={shared.card}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.title}>🎵 Background Casino Music</Text>
            <Text style={styles.sub}>
              Select ambient soundtrack from assets/Sounds/
            </Text>
          </View>
          <Pressable
            style={[
              styles.previewBtn,
              previewingMusic && styles.previewBtnActive,
            ]}
            onPress={handleToggleMusicPreview}
          >
            <Text style={styles.previewBtnText}>
              {previewingMusic ? "⏹ Stop Music" : "▶ Preview Music"}
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: 8, marginTop: 4 }}>
          {MUSIC_TRACKS.map((m) => {
            const active =
              (settings.musicTrack || "sound1") === m.id &&
              (m.id === "none" ? !settings.musicEnabled : settings.musicEnabled);

            return (
              <Pressable
                key={m.id}
                style={[styles.musicSelectCard, active && styles.musicSelectCardActive]}
                onPress={() => {
                  update("musicTrack", m.id as MusicTrackId);
                  update("musicEnabled", m.id !== "none");
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.musicSelectLabel,
                      active && styles.musicSelectLabelActive,
                    ]}
                  >
                    {m.id === "sound1"
                      ? "🎷 Casino Lounge (sound1.mp3)"
                      : m.id === "sound2"
                        ? "🌃 Night Arena (sound2.mp3)"
                        : "🔇 Mute Background Music"}
                  </Text>
                  <Text style={styles.musicSelectDesc}>{m.description}</Text>
                </View>
                {active && <Text style={styles.activeCheck}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Bot Tactical Difficulty */}
      <View style={shared.card}>
        <Text style={styles.title}>🤖 Computer AI Difficulty</Text>
        <Text style={styles.sub}>Default tactical algorithm for offline matches</Text>
        <View style={styles.diffGrid}>
          {[
            { id: "easy", label: "🟢 Easy", desc: "Casual arrangement, perfect for learning" },
            { id: "med", label: "🟡 Medium", desc: "Standard competitive AI with balanced play" },
            { id: "hard", label: "🔴 Hard", desc: "Grandmaster AI: optimal Larra partitioning & bluffing" },
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

      {/* Player Display Name */}
      <View style={shared.card}>
        <Text style={styles.title}>👤 Player Display Name</Text>
        <Text style={styles.sub}>Shown on the scoreboard and player seat</Text>
        <TextInput
          style={styles.input}
          value={settings.playerName}
          onChangeText={(t) => update("playerName", t)}
          placeholder="Enter display name"
          placeholderTextColor={C.dim}
          maxLength={20}
        />
      </View>

      <Pressable style={styles.reset} onPress={handleReset}>
        <Text style={styles.resetText}>🔄 Reset All Settings to Factory Default</Text>
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
  saved: {
    color: C.emerald,
    fontSize: 12,
    fontWeight: "900",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  title: { color: C.white, fontSize: 15, fontWeight: "800" },
  sub: { color: C.muted, fontSize: 11, marginTop: 2, marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  speedGrid: {
    gap: 8,
  },
  speedOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 6, 23, 0.7)",
    borderColor: C.border,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
  },
  speedOptionActive: {
    borderColor: C.emerald,
    backgroundColor: C.emeraldSoft,
  },
  speedOptionLabel: {
    color: C.white,
    fontSize: 13,
    fontWeight: "800",
  },
  speedOptionLabelActive: {
    color: C.emeraldLight,
  },
  speedOptionDesc: {
    color: C.muted,
    fontSize: 10,
    marginTop: 2,
  },
  activeCheck: {
    color: C.emeraldLight,
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 8,
  },
  testBtn: {
    marginTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  testBtnText: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "800",
  },
  smallTestPill: {
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    borderColor: "rgba(250, 204, 21, 0.4)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  smallTestPillText: {
    color: "#facc15",
    fontSize: 9,
    fontWeight: "800",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  switchDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  switchLabel: { color: C.white, fontSize: 13, fontWeight: "700" },
  switchDesc: { color: C.muted, fontSize: 11, marginTop: 2 },
  previewBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewBtnActive: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderColor: "#ef4444",
  },
  previewBtnText: {
    color: "#f8fafc",
    fontSize: 10,
    fontWeight: "800",
  },
  musicSelectCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 6, 23, 0.7)",
    borderColor: C.border,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
  },
  musicSelectCardActive: {
    borderColor: C.amber,
    backgroundColor: C.amberSoft,
  },
  musicSelectLabel: {
    color: C.white,
    fontSize: 13,
    fontWeight: "800",
  },
  musicSelectLabelActive: {
    color: C.amberLight,
  },
  musicSelectDesc: {
    color: C.muted,
    fontSize: 10,
    marginTop: 2,
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
    fontSize: 13,
    fontWeight: "800",
  },
  diffCardLabelActive: {
    color: C.emeraldLight,
  },
  diffCardDesc: {
    color: C.muted,
    fontSize: 10,
    marginTop: 2,
  },
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
