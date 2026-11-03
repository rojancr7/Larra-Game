import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { C, shared } from "./theme";
import { triggerHaptic } from "../services/audioHaptics";
import {
  AVATAR_PRESETS,
  DEFAULT_PROFILE,
  loadProfile,
  PlayerProfile,
  saveProfile,
} from "../services/storage";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadProfile().then((p) => {
        if (!active) return;
        setProfile(p);
        setNameInput(p.name);
      });
      return () => {
        active = false;
        setEditingName(false);
      };
    }, []),
  );

  const flashSaved = () => {
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 1500);
  };

  const update = (patch: Partial<PlayerProfile>) => {
    const next = { ...profile, ...patch };
    setProfile(next);
    saveProfile(next);
    flashSaved();
  };

  const winRate =
    profile.matchesPlayed > 0
      ? Math.round((profile.matchesWon / profile.matchesPlayed) * 100)
      : 0;
  const avatar =
    AVATAR_PRESETS.find((a) => a.id === profile.avatar) || AVATAR_PRESETS[0];

  const stats = [
    {
      label: "Win rate",
      value: `${winRate}%`,
      sub: `${profile.matchesWon} wins / ${profile.matchesPlayed} games`,
      color: C.amber,
    },
    {
      label: "Total points",
      value: `${profile.totalPoints}`,
      sub: "Across all matches",
      color: C.emerald,
    },
    {
      label: "Clean sweeps",
      value: `${profile.cleanSweeps}`,
      sub: "Round 1 sweeps",
      color: C.indigo,
    },
    {
      label: "Instant victories",
      value: `${profile.instantVictories}`,
      sub: "Declared hands",
      color: C.purple,
    },
  ];

  // Badges are earned from real stats
  const badges = [
    {
      icon: "🎴",
      title: "First win",
      desc: "Win your first match",
      tint: C.amberSoft,
      earned: profile.matchesWon >= 1,
    },
    {
      icon: "⚡",
      title: "Clean sweeper",
      desc: "Score a Round 1 clean sweep",
      tint: C.emeraldSoft,
      earned: profile.cleanSweeps >= 1,
    },
    {
      icon: "👑",
      title: "Instant victor",
      desc: "Win with an instant hand",
      tint: C.purpleSoft,
      earned: profile.instantVictories >= 1,
    },
  ];

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={shared.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headRow}>
        <View>
          <Text style={shared.pageTitle}>Player profile</Text>
          <Text style={shared.pageSub}>Saved on this device</Text>
        </View>
        {saved && <Text style={styles.saved}>Saved ✓</Text>}
      </View>

      {/* Header card */}
      <View style={[shared.card, styles.hero]}>
        <View
          style={[styles.bigAvatar, { backgroundColor: avatar.color + "33" }]}
        >
          <Text style={styles.bigAvatarEmoji}>
            {avatar.label.split(" ")[0]}
          </Text>
        </View>

        {editingName ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              maxLength={20}
              autoFocus
            />
            <Pressable
              style={styles.saveBtn}
              onPress={() => {
                triggerHaptic("selection");
                update({ name: nameInput.trim() || "Player 1" });
                setEditingName(false);
              }}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.nameRow}
            onPress={() => setEditingName(true)}
          >
            <Text style={styles.name}>{profile.name}</Text>
            <Text>✏️</Text>
          </Pressable>
        )}

        <Text style={styles.id}>ID {profile.playerId}</Text>
      </View>

      {/* Stats */}
      <View style={styles.grid}>
        {stats.map((s) => (
          <View
            key={s.label}
            style={[shared.card, styles.stat, { borderLeftColor: s.color }]}
          >
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={[styles.statSub, { color: s.color }]}>{s.sub}</Text>
          </View>
        ))}
      </View>

      {/* Badges */}
      <View style={shared.card}>
        <Text style={styles.sectionTitle}>🏅 Trophies & badges</Text>
        <View style={{ gap: 10 }}>
          {badges.map((b) => (
            <View
              key={b.title}
              style={[styles.badge, !b.earned && { opacity: 0.4 }]}
            >
              <View style={[styles.badgeIcon, { backgroundColor: b.tint }]}>
                <Text style={{ fontSize: 18 }}>{b.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTitle}>{b.title}</Text>
                <Text style={styles.badgeDesc}>
                  {b.earned ? b.desc : `Locked · ${b.desc}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Avatar picker */}
      <View style={shared.card}>
        <Text style={styles.sectionTitle}>👑 Choose avatar</Text>
        <View style={styles.avatarGrid}>
          {AVATAR_PRESETS.map((av) => {
            const active = profile.avatar === av.id;
            return (
              <Pressable
                key={av.id}
                style={[styles.avatarItem, active && styles.avatarItemActive]}
                onPress={() => {
                  triggerHaptic("selection");
                  update({ avatar: av.id });
                }}
              >
                <Text style={{ fontSize: 22 }}>{av.label.split(" ")[0]}</Text>
                <Text style={styles.avatarLabel}>{av.label.split(" ")[1]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
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
  hero: { alignItems: "center", gap: 8, paddingVertical: 22 },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  bigAvatarEmoji: { fontSize: 40 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { color: C.white, fontSize: 20, fontWeight: "800" },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameInput: {
    backgroundColor: C.bg,
    borderColor: C.amber,
    borderWidth: 1,
    borderRadius: 10,
    color: C.white,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 150,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: C.amber,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  saveBtnText: { color: C.bg, fontSize: 12, fontWeight: "800" },
  id: { color: C.muted, fontSize: 11, fontFamily: "monospace" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { width: "47.5%", flexGrow: 1, borderLeftWidth: 4, padding: 14 },
  statLabel: { color: C.muted, fontSize: 12 },
  statValue: { color: C.white, fontSize: 22, fontWeight: "800", marginTop: 4 },
  statSub: { fontSize: 10, marginTop: 2 },

  sectionTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(2, 6, 23, 0.8)",
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTitle: { color: C.white, fontSize: 13, fontWeight: "800" },
  badgeDesc: { color: C.muted, fontSize: 11, marginTop: 1 },

  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  avatarItem: {
    width: "22%",
    aspectRatio: 1,
    backgroundColor: "rgba(2, 6, 23, 0.8)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarItemActive: { borderColor: C.amber, backgroundColor: C.amberSoft },
  avatarLabel: {
    color: "#cbd5e1",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },
});
