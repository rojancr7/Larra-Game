import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { triggerHaptic } from "../services/audioHaptics";
import { restorePortraitOrientation } from "../services/orientation";
import { loadSettings, saveSettings } from "../services/storage";
import { C, serif, shared } from "./theme";

type Difficulty = "easy" | "med" | "hard";

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "med", label: "Medium" },
  { id: "hard", label: "Hard" },
];

const RULES = [
  [
    "1. Partitioning (3-3-3-4)",
    "Divide your 13 cards into 4 sequential rounds before playing.",
  ],
  [
    "2. Scoring",
    "Round 1 = 1 PT (5 PTS if Clean Sweep), Round 2 = 1 PT, Round 3 = 1 PT, Round 4 = 5 PTS.",
  ],
  [
    "3. Real Larra",
    "In Round 4, a 4-card suit flush beats any 3-card suit combination.",
  ],
  [
    "4. Instant hand declarations",
    "6 Jute = +6 PTS, 3 Trayel = +9 PTS, No Jute = +13 PTS.",
  ],
];

export default function HomeScreen() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [roomCode, setRoomCode] = useState("");
  const [rulesOpen, setRulesOpen] = useState(false);

  // Game screen locks landscape; make sure we come back to portrait
  useFocusEffect(
    useCallback(() => {
      restorePortraitOrientation();
      loadSettings().then((s) => {
        if (s.difficulty) {
          setDifficulty(s.difficulty as Difficulty);
        }
      });
    }, []),
  );

  const handleDifficultyChange = (d: Difficulty) => {
    triggerHaptic("selection");
    setDifficulty(d);
    loadSettings().then((s) => {
      saveSettings({ ...s, difficulty: d });
    });
  };

  const startOffline = () => {
    triggerHaptic("selection");
    router.navigate({ pathname: "/game", params: { difficulty } } as any);
  };

  const comingSoon = (title: string, body: string) => {
    triggerHaptic("selection");
    Alert.alert(title, body);
  };

  const joinRoom = () => {
    if (roomCode.length !== 4) {
      Alert.alert("Enter a room code", "Room codes are 4 digits.");
      return;
    }
    comingSoon(
      "Online play is coming soon",
      `Room ${roomCode} can't be joined yet.`,
    );
  };

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={shared.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Target goal banner */}
      <View style={styles.banner}>
        <View style={styles.bannerBadge}>
          <Text style={styles.bannerBadgeText}>
            ⚡ 20-POINT INSTANT VICTORY
          </Text>
        </View>
        <Text style={styles.bannerTitle}>First to 20 points wins the game</Text>
        <Text style={styles.bannerBody}>
          Partition your 13 cards into{" "}
          <Text style={styles.bold}>3-3-3-4 sets</Text>. Win rounds, trigger{" "}
          <Text style={{ color: C.emeraldLight, fontWeight: "700" }}>
            Clean Sweeps
          </Text>
          , play a{" "}
          <Text style={{ color: C.amberLight, fontWeight: "700" }}>
            Real Larra
          </Text>{" "}
          in Round 4, or claim direct instant scores.
        </Text>
        <Pressable
          style={styles.rulebookBtn}
          onPress={() => setRulesOpen(true)}
        >
          <Text style={styles.rulebookBtnText}>📖 View rulebook</Text>
        </Pressable>
      </View>

      {/* Mode 1: Offline vs computer */}
      <View style={[shared.card, styles.mode, { borderTopColor: C.emerald }]}>
        <View style={styles.modeHead}>
          <View style={[styles.modeIcon, { backgroundColor: C.emeraldSoft }]}>
            <Text style={styles.modeIconText}>🤖</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: C.emeraldSoft }]}>
            <Text style={[styles.tagText, { color: C.emeraldLight }]}>
              Offline
            </Text>
          </View>
        </View>
        <Text style={styles.modeTitle}>Play vs Computer</Text>
        <Text style={styles.modeDesc}>
          Practice tactics and test card partitions anytime, without internet.
        </Text>

        <Text style={styles.fieldLabel}>Bot difficulty</Text>
        <View style={styles.segment}>
          {DIFFICULTIES.map((d) => {
            const active = d.id === difficulty;
            return (
              <Pressable
                key={d.id}
                onPress={() => handleDifficultyChange(d.id)}
                style={[styles.segBtn, active && styles.segBtnActive]}
              >
                <Text
                  style={[styles.segText, active && { color: C.emeraldLight }]}
                >
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: C.emerald },
            pressed && styles.pressed,
          ]}
          onPress={startOffline}
        >
          <Text style={[styles.ctaText, { color: C.bg }]}>
            ▶ Start offline match
          </Text>
        </Pressable>
      </View>

      {/* Mode 2: Friends */}
      <View style={[shared.card, styles.mode, { borderTopColor: C.amber }]}>
        <View style={styles.modeHead}>
          <View style={[styles.modeIcon, { backgroundColor: C.amberSoft }]}>
            <Text style={styles.modeIconText}>👥</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: C.amberSoft }]}>
            <Text style={[styles.tagText, { color: C.amber }]}>
              Private room · Soon
            </Text>
          </View>
        </View>
        <Text style={styles.modeTitle}>Play with Friends</Text>
        <Text style={styles.modeDesc}>
          Host a private table, or enter a 4-digit code to join your friends in
          real time.
        </Text>

        <View style={styles.joinRow}>
          <TextInput
            style={styles.codeInput}
            value={roomCode}
            onChangeText={(t) => setRoomCode(t.replace(/\D/g, ""))}
            maxLength={4}
            keyboardType="number-pad"
            placeholder="Room code"
            placeholderTextColor={C.dim}
          />
          <Pressable style={styles.joinBtn} onPress={joinRoom}>
            <Text style={styles.joinBtnText}>Join</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: C.amber },
            pressed && styles.pressed,
          ]}
          onPress={() =>
            comingSoon(
              "Online play is coming soon",
              "Private rooms will arrive with online multiplayer.",
            )
          }
        >
          <Text style={[styles.ctaText, { color: C.bg }]}>
            ＋ Create room code
          </Text>
        </Pressable>
      </View>

      {/* Mode 3: Quick match */}
      <View style={[shared.card, styles.mode, { borderTopColor: C.indigo }]}>
        <View style={styles.modeHead}>
          <View style={[styles.modeIcon, { backgroundColor: C.indigoSoft }]}>
            <Text style={styles.modeIconText}>🌐</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: C.indigoSoft }]}>
            <Text style={[styles.tagText, { color: C.indigoLight }]}>
              Ranked · Soon
            </Text>
          </View>
        </View>
        <Text style={styles.modeTitle}>Quick Match</Text>
        <Text style={styles.modeDesc}>
          Get matched with 3 players worldwide. Earn rating points and unlock
          achievements.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: C.indigo },
            pressed && styles.pressed,
          ]}
          onPress={() =>
            comingSoon(
              "Online play is coming soon",
              "Ranked matchmaking will arrive with online multiplayer.",
            )
          }
        >
          <Text style={[styles.ctaText, { color: C.white }]}>
            ⚡ Find quick match
          </Text>
        </Pressable>
      </View>

      {/* Rulebook modal */}
      <Modal
        visible={rulesOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRulesOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>🎴 Larra game rules</Text>
              <Pressable onPress={() => setRulesOpen(false)} hitSlop={10}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 340 }}>
              {RULES.map(([title, body]) => (
                <Text key={title} style={styles.rule}>
                  <Text style={styles.bold}>{title}: </Text>
                  {body}
                </Text>
              ))}
              <Text
                style={[styles.rule, { color: C.amber, fontWeight: "800" }]}
              >
                5. Target victory: the first player to reach 20 PTS wins.
              </Text>
            </ScrollView>
            <Pressable
              style={[styles.cta, { backgroundColor: C.amber, marginTop: 12 }]}
              onPress={() => setRulesOpen(false)}
            >
              <Text style={[styles.ctaText, { color: C.bg }]}>
                Close rulebook
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: C.border, // #3E5A3F moss
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.amberLine,
    padding: 18,
    gap: 8,
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: C.amberSoft,
    borderColor: C.amberLine,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bannerBadgeText: { color: C.amberLight, fontSize: 10, fontWeight: "800" },
  bannerTitle: {
    color: C.white,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: serif,
  },
  bannerBody: { color: C.text, fontSize: 13, lineHeight: 19 },
  bold: { color: C.white, fontWeight: "800" },
  rulebookBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: C.stone, // #3D4337
    borderColor: C.amberLine,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  rulebookBtnText: { color: C.amberLight, fontSize: 12, fontWeight: "800" },

  mode: { borderTopWidth: 4, gap: 4 },
  modeHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  modeIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modeIconText: { fontSize: 22 },
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: "800" },
  modeTitle: { color: C.white, fontSize: 18, fontWeight: "800" },
  modeDesc: { color: C.muted, fontSize: 12, lineHeight: 17, marginBottom: 8 },
  fieldLabel: {
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 6,
  },
  segment: { flexDirection: "row", gap: 8 },
  segBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  segBtnActive: {
    borderColor: "rgba(107, 127, 103, 0.7)",
    backgroundColor: C.emeraldSoft,
  },
  segText: { color: C.muted, fontSize: 12, fontWeight: "800" },
  joinRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  codeInput: {
    flex: 1,
    backgroundColor: C.bg,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 12,
    color: C.white,
    textAlign: "center",
    fontSize: 14,
    letterSpacing: 4,
    paddingVertical: 10,
    fontFamily: "monospace",
  },
  joinBtn: {
    backgroundColor: C.amberSoft,
    borderColor: C.amberLine,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  joinBtnText: { color: C.amberLight, fontSize: 12, fontWeight: "800" },
  cta: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: { fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 31, 23, 0.9)",
    justifyContent: "center",
    padding: 16,
  },
  sheet: {
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  sheetHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  sheetTitle: {
    color: C.amber,
    fontSize: 17,
    fontWeight: "800",
    fontFamily: serif,
  },
  close: { color: C.muted, fontSize: 18 },
  rule: { color: C.text, fontSize: 13, lineHeight: 20, marginBottom: 10 },
});
