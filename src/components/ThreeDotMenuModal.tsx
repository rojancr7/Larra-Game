import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MUSIC_TRACKS } from "../constants/gameAssets"; // audio tracks
import { BOARD_THEMES, CARD_BACK_THEMES } from "../constants/legacyThemeShim"; // legacy shim provides theme data
import { GameState } from "../engine/gameController";
import { triggerHaptic } from "../services/audioHaptics";
import {
  AIDifficulty,
  GameSettings,
  MusicTrackId,
  SpreadSpeed,
} from "../services/storage";

interface ThreeDotMenuModalProps {
  visible: boolean;
  game: GameState;
  difficulty?: AIDifficulty;
  onChangeDifficulty?: (d: AIDifficulty) => void;
  settings?: GameSettings;
  onUpdateSettings?: (settings: GameSettings) => void;
  onClose: () => void;
  onOpenSettings: () => void;
  onExitGame: () => void;
  onViewScoreboard: () => void;
}

export const ThreeDotMenuModal: React.FC<ThreeDotMenuModalProps> = ({
  visible,
  game,
  difficulty = "easy",
  onChangeDifficulty,
  settings,
  onUpdateSettings,
  onClose,
  onOpenSettings,
  onExitGame,
  onViewScoreboard,
}) => {
  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    val: GameSettings[K],
  ) => {
    triggerHaptic("selection");
    if (settings && onUpdateSettings) {
      onUpdateSettings({ ...settings, [key]: val });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.menuContainer}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.menuHeader}>
            <Text style={styles.menuHeaderTitle}>
              ⚙️ Match Options & Customization
            </Text>
            <Text style={styles.menuHeaderSubtitle}>
              Target: 20 Points to Win
            </Text>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Score Snippet */}
            <View style={styles.quickScoresBox}>
              <Text style={styles.sectionLabel}>CURRENT POINTS</Text>
              <View style={styles.scoreRow}>
                {game.players.map((p, i) => (
                  <View key={p.id} style={styles.playerScoreItem}>
                    <Text style={styles.playerNameText} numberOfLines={1}>
                      {i === 0 ? "👤 You" : `🤖 ${p.name}`}
                    </Text>
                    <Text style={styles.playerPointsText}>
                      {game.scores[i]?.points ?? 0} pts
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* AI Difficulty Selector */}
            {onChangeDifficulty && (
              <View style={styles.settingBlock}>
                <Text style={styles.sectionLabel}>AI DIFFICULTY</Text>
                <View style={styles.chipRow}>
                  {(["easy", "med", "hard"] as AIDifficulty[]).map((d) => {
                    const active = difficulty === d;
                    const label =
                      d === "easy"
                        ? "🟢 Easy"
                        : d === "med"
                          ? "🟡 Med"
                          : "🔴 Hard";
                    return (
                      <Pressable
                        key={d}
                        style={[styles.chipBtn, active && styles.chipBtnActive]}
                        onPress={() => {
                          triggerHaptic("selection");
                          onChangeDifficulty(d);
                        }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* In-Game Table Felt Switcher */}
            {settings && onUpdateSettings && (
              <View style={styles.settingBlock}>
                <Text style={styles.sectionLabel}>TABLE FELT THEME</Text>
                <View style={styles.chipRow}>
                  {BOARD_THEMES.map((b) => {
                    const active = settings.boardColor === b.id;
                    return (
                      <Pressable
                        key={b.id}
                        style={[
                          styles.chipBtn,
                          active && {
                            borderColor: "#34d399",
                            backgroundColor: "rgba(255,255,255,0.18)",
                            borderWidth: 1.5,
                          },
                        ]}
                        onPress={() =>
                          updateSetting(
                            "boardColor",
                            b.id as GameSettings["boardColor"],
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && {
                              color: "#34d399",
                              fontWeight: "900",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {b.id.toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* In-Game Card Back Switcher */}
            {settings && onUpdateSettings && (
              <View style={styles.settingBlock}>
                <Text style={styles.sectionLabel}>CARD BACK</Text>
                <View style={styles.chipRow}>
                  {CARD_BACK_THEMES.map((c) => {
                    const active = settings.cardBack === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        style={[
                          styles.chipBtn,
                          active && {
                            borderColor: "#34d399",
                            backgroundColor: "rgba(255,255,255,0.18)",
                            borderWidth: 1.5,
                          },
                        ]}
                        onPress={() =>
                          updateSetting(
                            "cardBack",
                            c.id as GameSettings["cardBack"],
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && {
                              color: "#34d399",
                              fontWeight: "900",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {c.id.toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Card Dealing & Spread Speed */}
            {settings && onUpdateSettings && (
              <View style={styles.settingBlock}>
                <Text style={styles.sectionLabel}>CARD SPREAD SPEED</Text>
                <View style={styles.chipRow}>
                  {(
                    [
                      { id: "slow", label: "Slow" },
                      { id: "medium", label: "Realistic" },
                      { id: "fast", label: "Fast" },
                      { id: "instant", label: "Instant" },
                    ] as { id: SpreadSpeed; label: string }[]
                  ).map((s) => {
                    const active = (settings.spreadSpeed || "medium") === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        style={[
                          styles.chipBtn,
                          active && styles.chipBtnActiveEmerald,
                        ]}
                        onPress={() => updateSetting("spreadSpeed", s.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {s.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Background Music Track */}
            {settings && onUpdateSettings && (
              <View style={styles.settingBlock}>
                <Text style={styles.sectionLabel}>BACKGROUND MUSIC</Text>
                <View style={styles.chipRow}>
                  {MUSIC_TRACKS.map((m) => {
                    const active = (settings.musicTrack || "sound1") === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        style={[
                          styles.chipBtn,
                          active && styles.chipBtnActiveGold,
                        ]}
                        onPress={() => {
                          updateSetting("musicTrack", m.id as MusicTrackId);
                          updateSetting("musicEnabled", m.id !== "none");
                        }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && { color: "#facc15", fontWeight: "900" },
                          ]}
                          numberOfLines={1}
                        >
                          {m.id === "sound1"
                            ? "🎵 Lounge"
                            : m.id === "sound2"
                              ? "🎶 Arena"
                              : "🔇 Off"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.divider} />

            {/* Menu Items */}
            <Pressable
              style={styles.menuButton}
              onPress={() => {
                triggerHaptic("selection");
                onClose();
                onViewScoreboard();
              }}
            >
              <Text style={styles.menuButtonIcon}>📊</Text>
              <Text style={styles.menuButtonText}>View Full Scoreboard</Text>
            </Pressable>

            <Pressable
              style={styles.menuButton}
              onPress={() => {
                triggerHaptic("selection");
                onClose();
                onOpenSettings();
              }}
            >
              <Text style={styles.menuButtonIcon}>🎨</Text>
              <Text style={styles.menuButtonText}>Full Game Settings</Text>
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={[styles.menuButton, styles.exitButton]}
              onPress={() => {
                triggerHaptic("warning");
                onClose();
                onExitGame();
              }}
            >
              <Text style={styles.menuButtonIcon}>🚪</Text>
              <Text style={[styles.menuButtonText, styles.exitButtonText]}>
                Exit Match & Return Home
              </Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  menuContainer: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(234, 179, 8, 0.4)",
    width: "100%",
    maxWidth: 380,
    maxHeight: "92%",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  menuHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingBottom: 8,
    marginBottom: 8,
  },
  menuHeaderTitle: {
    color: "#fbbf24",
    fontSize: 15,
    fontWeight: "900",
  },
  menuHeaderSubtitle: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 2,
  },
  scrollArea: {
    maxHeight: 310,
  },
  quickScoresBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  settingBlock: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    color: "#cbd5e1",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  chipRow: {
    flexDirection: "row",
    gap: 4,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipBtnActive: {
    backgroundColor: "#059669",
    borderColor: "#34d399",
    borderWidth: 1,
  },
  chipBtnActiveEmerald: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    borderColor: "#10b981",
    borderWidth: 1,
  },
  chipBtnActiveGold: {
    backgroundColor: "rgba(234, 179, 8, 0.25)",
    borderColor: "#eab308",
    borderWidth: 1,
  },
  chipText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  playerScoreItem: {
    alignItems: "center",
  },
  playerNameText: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: "600",
    maxWidth: 55,
  },
  playerPointsText: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 1,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  menuButtonIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  menuButtonText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 6,
  },
  exitButton: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  exitButtonText: {
    color: "#f87171",
  },
});

export default ThreeDotMenuModal;
