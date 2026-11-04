import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BOARD_THEMES,
  CARD_BACK_THEMES,
  getBoardTheme,
  getCardBackTheme,
} from "../constants/legacyThemeShim"; // legacy shim
import { triggerHaptic } from "../services/audioHaptics";
import {
  playBackgroundMusic,
  playCardPlaceSound,
  playCardSpreadSound,
  stopBackgroundMusic,
} from "../services/soundService";
import {
  BoardColor,
  CardBackColor,
  DEFAULT_SETTINGS,
  GameSettings,
  MusicTrackId,
  loadSettings,
  saveSettings,
} from "../services/storage";
import { C, shared } from '../theme/appTheme';

const MUSIC_TRACKS: { id: MusicTrackId; description: string }[] = [
  { id: "sound1", description: "Relaxing casino lounge ambience." },
  { id: "sound2", description: "Atmospheric night arena music." },
  { id: "none", description: "Turn off background music." },
];

export default function StoreScreen() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

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

  const equip = <K extends keyof GameSettings>(
    key: K,
    val: GameSettings[K],
  ) => {
    triggerHaptic("selection");
    if (key === "cardBack") {
      playCardPlaceSound();
    } else if (key === "boardColor") {
      playCardSpreadSound("fast");
    }
    const next = { ...settings, [key]: val };
    setSettings(next);
    saveSettings(next);
  };

  const handlePreviewMusic = async (trackId: MusicTrackId) => {
    triggerHaptic("selection");
    if (playingTrack === trackId || trackId === "none") {
      await stopBackgroundMusic();
      setPlayingTrack(null);
    } else {
      await playBackgroundMusic(trackId);
      setPlayingTrack(trackId);
    }
  };

  const currentBoard = getBoardTheme(settings.themeId);
  const currentCard = getCardBackTheme(settings.themeId);

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={[shared.content, { paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={shared.pageTitle}>🛍 Customization & Theme Store</Text>
        <Text style={shared.pageSub}>
          Customize your real felt table, playing card backs, and casino audio.
        </Text>
      </View>

      {/* Interactive Live Preview Box */}
      <View style={styles.previewContainer}>
        <View style={styles.previewHeaderRow}>
          <Text style={styles.previewTitle}>✨ EQUIPPED SETUP PREVIEW</Text>
          <Text style={styles.previewBadge}>ACTIVE IN MATCHES</Text>
        </View>

        <View style={styles.previewStage}>
          {/* Table Background Layer */}
          <Image
            source={currentBoard.source}
            style={styles.previewTableBg}
            resizeMode="cover"
          />
          <View style={styles.previewTableOverlay} />

          {/* Card Fan Layer */}
          <View style={styles.cardFanWrapper}>
            {[-18, -6, 6, 18].map((deg, idx) => (
              <View
                key={idx}
                style={[
                  styles.previewCardWrap,
                  {
                    transform: [
                      { rotate: `${deg}deg` },
                      { translateY: Math.abs(deg) * 0.3 },
                    ],
                    marginLeft: idx === 0 ? 0 : -22,
                    zIndex: idx + 1,
                  },
                ]}
              >
                <Image
                  source={currentCard.source}
                  style={[
                    styles.previewCardImage,
                    { borderColor: currentCard.borderColor },
                  ]}
                  resizeMode="cover"
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.previewDetailsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewDetailLabel}>Felt Board</Text>
            <Text
              style={[
                styles.previewDetailValue,
                { color: currentBoard.accentColor },
              ]}
            >
              {currentBoard.name}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={styles.previewDetailLabel}>Card Back</Text>
            <Text
              style={[
                styles.previewDetailValue,
                { color: currentCard.borderColor },
              ]}
            >
              {currentCard.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Table Mats Collection */}
      <View style={{ marginTop: 18 }}>
        <Text style={shared.sectionLabel}>
          TABLE FELT THEMES (ASSETS/BOARD)
        </Text>
        <View style={{ gap: 10 }}>
          {BOARD_THEMES.map((t) => {
            const on = settings.themeId === t.id;
            const theme = getBoardTheme(t.id);

            return (
              <Pressable
                key={t.id}
                onPress={() => equip("boardColor", t.id as BoardColor)}
                style={[
                  shared.card,
                  styles.tableCard,
                  on && { borderColor: theme.accentColor, borderWidth: 2 },
                ]}
              >
                <Image
                  source={theme.source}
                  style={[
                    styles.tableThumb,
                    { borderColor: theme.accentColor },
                  ]}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.itemName,
                      on && { color: theme.accentColor },
                    ]}
                  >
                    {t.name}
                  </Text>
                  <Text style={[styles.codeTag, { color: theme.accentColor }]}>
                    ID: {t.id}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statePill,
                    on && {
                      backgroundColor: "rgba(16, 185, 129, 0.2)",
                      borderColor: theme.accentColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stateText,
                      on && { color: theme.accentColor, fontWeight: "900" },
                    ]}
                  >
                    {on ? "Equipped ✓" : "Equip"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Card Backs Collection */}
      <View style={{ marginTop: 22 }}>
        <Text style={shared.sectionLabel}>
          PLAYING CARD BACKS (ASSETS/CARD)
        </Text>
        <View style={styles.cardGrid}>
          {CARD_BACK_THEMES.map((cb) => {
            const theme = getCardBackTheme(cb.id);
            const on =
              settings.cardBack === cb.id ||
              (String(settings.cardBack) === "gold-luxury" &&
                String(cb.id) === "card1") ||
              (String(settings.cardBack) === "classic-blue" &&
                String(cb.id) === "card2");

            return (
              <Pressable
                key={cb.id}
                onPress={() => equip("cardBack", cb.id as CardBackColor)}
                style={[
                  shared.card,
                  styles.cardItem,
                  on && { borderColor: theme.borderColor, borderWidth: 2 },
                ]}
              >
                <View style={styles.cardThumbWrap}>
                  <Image
                    source={theme.source}
                    style={[
                      styles.cardThumbImage,
                      { borderColor: theme.borderColor },
                    ]}
                    resizeMode="cover"
                  />
                </View>

                <Text style={styles.itemName} numberOfLines={1}>
                  {cb.name}
                </Text>
                <Text style={styles.cardSubText} numberOfLines={2}>
                  ID: {cb.id}
                </Text>

                <View
                  style={[
                    styles.statePill,
                    on && {
                      backgroundColor: "rgba(245, 158, 11, 0.2)",
                      borderColor: theme.borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stateText,
                      on && { color: theme.borderColor, fontWeight: "900" },
                    ]}
                  >
                    {on ? "Equipped ✓" : "Equip"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Atmospheric Audio Collection */}
      <View style={{ marginTop: 22 }}>
        <Text style={shared.sectionLabel}>
          CASINO MUSIC & ATMOSPHERE (ASSETS/SOUNDS)
        </Text>
        <View style={{ gap: 10 }}>
          {MUSIC_TRACKS.map((m) => {
            const isEquipped =
              settings.musicTrack === m.id &&
              (m.id === "none"
                ? !settings.musicEnabled
                : settings.musicEnabled);
            const isPlaying = playingTrack === m.id;

            return (
              <View
                key={m.id}
                style={[
                  shared.card,
                  styles.musicCard,
                  isEquipped && { borderColor: C.amber, borderWidth: 2 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.itemName,
                      isEquipped && { color: C.amberLight },
                    ]}
                  >
                    {m.id === "sound1"
                      ? "🎵 Casino Lounge (Ambient Track 1)"
                      : m.id === "sound2"
                        ? "🎶 Night Arena (Atmospheric Track 2)"
                        : "🔇 Mute Background Music"}
                  </Text>
                  <Text style={styles.itemDesc}>{m.description}</Text>
                </View>

                <View style={styles.musicBtnRow}>
                  {m.id !== "none" && (
                    <Pressable
                      style={[
                        styles.previewBtn,
                        isPlaying && styles.previewBtnActive,
                      ]}
                      onPress={() => handlePreviewMusic(m.id as MusicTrackId)}
                    >
                      <Text style={styles.previewBtnText}>
                        {isPlaying ? "⏹ Stop" : "▶ Preview"}
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={[
                      styles.statePill,
                      isEquipped && {
                        backgroundColor: C.amberSoft,
                        borderColor: C.amber,
                      },
                    ]}
                    onPress={() => {
                      equip("musicTrack", m.id as MusicTrackId);
                      equip("musicEnabled", m.id !== "none");
                    }}
                  >
                    <Text
                      style={[
                        styles.stateText,
                        isEquipped && {
                          color: C.amberLight,
                          fontWeight: "900",
                        },
                      ]}
                    >
                      {isEquipped ? "Equipped ✓" : "Equip"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(234, 179, 8, 0.4)",
    padding: 14,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  previewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  previewTitle: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  previewBadge: {
    color: "#4ade80",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    fontSize: 9,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  previewStage: {
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#451a03",
  },
  previewTableBg: {
    ...(StyleSheet.absoluteFill as any),
    width: "100%",
    height: "100%",
  },
  previewTableOverlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  cardFanWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCardWrap: {
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  previewCardImage: {
    width: 62,
    height: 90,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  previewDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  previewDetailLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
  },
  previewDetailValue: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 1,
  },
  tableCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  tableThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  itemName: {
    color: C.white,
    fontSize: 13,
    fontWeight: "800",
  },
  itemDesc: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
  codeTag: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
    letterSpacing: 0.5,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cardItem: {
    width: "48%",
    flexGrow: 1,
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  cardThumbWrap: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  cardThumbImage: {
    width: 60,
    height: 88,
    borderRadius: 8,
    borderWidth: 2,
  },
  cardSubText: {
    color: C.muted,
    fontSize: 10,
    textAlign: "center",
    height: 26,
  },
  statePill: {
    backgroundColor: C.border,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  musicCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  musicBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
});
