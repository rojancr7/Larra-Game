import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { triggerHaptic } from "../services/audioHaptics";
import { Palette, useTheme } from "../theme/appTheme";

import {
  AVATAR_PRESETS,
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
} from "../services/storage";

import type { PlayerProfile } from "../services/storage";

export default function ProfileScreen() {
  const { c, shared } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saved, setSaved] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reload whenever this tab comes into view
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
      sub: `${profile.matchesWon} won of ${profile.matchesPlayed} played`,
      color: c.accent,
    },
    {
      label: "Total points",
      value: `${profile.totalPoints}`,
      sub: "From all matches",
      color: c.success,
    },
    {
      label: "Clean sweeps",
      value: `${profile.cleanSweeps}`,
      sub: "Won round 1 outright",
      color: c.info,
    },
    {
      label: "Instant wins",
      value: `${profile.instantVictories}`,
      sub: "Won by declaring a hand",
      color: c.purple,
    },
  ];

  const badges = [
    {
      icon: "🎴",
      title: "First win",
      desc: "Win your first match",
      tint: c.accentSoft,
      earned: profile.matchesWon >= 1,
    },
    {
      icon: "⚡",
      title: "Clean sweeper",
      desc: "Sweep round 1",
      tint: c.successSoft,
      earned: profile.cleanSweeps >= 1,
    },
    {
      icon: "👑",
      title: "Instant victor",
      desc: "Win with a declared hand",
      tint: c.purpleSoft,
      earned: profile.instantVictories >= 1,
    },
  ];

  const saveName = () => {
    triggerHaptic("selection");
    update({ name: nameInput.trim() || "Player 1" });
    setEditingName(false);
  };

  return (
    <ScrollView
      style={shared.screen}
      contentContainerStyle={shared.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headRow}>
        <View>
          <Text style={shared.pageTitle}>Your profile</Text>
          <Text style={shared.pageSub}>Stored on this device only</Text>
        </View>

        {saved && (
          <View style={styles.savedPill}>
            <Text style={styles.savedText}>Saved</Text>
          </View>
        )}
      </View>

      {/* Avatar and name */}
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
              onSubmitEditing={saveName}
              maxLength={20}
              autoFocus
              returnKeyType="done"
              placeholder="Your name"
              placeholderTextColor={c.textDim}
            />
            <Pressable
              style={styles.saveBtn}
              onPress={saveName}
              accessibilityRole="button"
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.nameRow}
            accessibilityRole="button"
            accessibilityLabel="Change your name"
            onPress={() => {
              setNameInput(profile.name);
              setEditingName(true);
            }}
          >
            <Text style={styles.name}>{profile.name}</Text>
            <View style={styles.editChip}>
              <Text style={styles.editChipText}>Edit</Text>
            </View>
          </Pressable>
        )}

        <Text style={styles.id}>Player ID {profile.playerId}</Text>
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
            <Text style={styles.statSub}>{s.sub}</Text>
          </View>
        ))}
      </View>

      {/* Badges */}
      <View style={shared.card}>
        <Text style={styles.sectionTitle}>Badges</Text>

        <View style={{ gap: 10 }}>
          {badges.map((b) => (
            <View
              key={b.title}
              style={[styles.badge, !b.earned && { opacity: 0.5 }]}
            >
              <View style={[styles.badgeIcon, { backgroundColor: b.tint }]}>
                <Text style={{ fontSize: 18 }}>{b.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTitle}>{b.title}</Text>
                <Text style={styles.badgeDesc}>
                  {b.earned ? b.desc : `Locked: ${b.desc}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Avatar picker */}
      <View style={shared.card}>
        <Text style={styles.sectionTitle}>Pick an avatar</Text>

        <View style={styles.avatarGrid}>
          {AVATAR_PRESETS.map((av) => {
            const active = profile.avatar === av.id;

            return (
              <Pressable
                key={av.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.avatarItem, active && styles.avatarItemActive]}
                onPress={() => {
                  triggerHaptic("selection");
                  update({ avatar: av.id });
                }}
              >
                <Text style={{ fontSize: 24 }}>{av.label.split(" ")[0]}</Text>
                <Text
                  style={[
                    styles.avatarLabel,
                    active && { color: c.accentText },
                  ]}
                >
                  {av.label.split(" ")[1]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
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

    hero: { alignItems: "center", gap: 10, paddingVertical: 24 },

    bigAvatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 2,
      borderColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    bigAvatarEmoji: { fontSize: 42 },

    nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    name: { color: c.text, fontSize: 22, fontWeight: "800" },
    editChip: {
      backgroundColor: c.inset,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    editChipText: { color: c.textMuted, fontSize: 11, fontWeight: "700" },

    editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    nameInput: {
      backgroundColor: c.bg,
      borderColor: c.accent,
      borderWidth: 1.5,
      borderRadius: 12,
      color: c.text,
      fontSize: 16,
      fontWeight: "700",
      paddingHorizontal: 14,
      paddingVertical: 8,
      minWidth: 170,
      textAlign: "center",
    },
    saveBtn: {
      backgroundColor: c.accent,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    saveBtnText: { color: c.onAccent, fontSize: 13, fontWeight: "800" },

    id: { color: c.textDim, fontSize: 12 },

    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    stat: {
      flexBasis: "47%",
      flexGrow: 1,
      borderLeftWidth: 4,
      padding: 14,
    },
    statLabel: { color: c.textMuted, fontSize: 13 },
    statValue: {
      color: c.text,
      fontSize: 26,
      fontWeight: "800",
      marginTop: 4,
    },
    statSub: { color: c.textDim, fontSize: 12, marginTop: 2 },

    sectionTitle: {
      color: c.text,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 12,
    },

    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.bg,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
    },
    badgeIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeTitle: { color: c.text, fontSize: 14, fontWeight: "700" },
    badgeDesc: { color: c.textMuted, fontSize: 12, marginTop: 1 },

    avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    avatarItem: {
      width: "22%",
      flexGrow: 1,
      minWidth: 68,
      maxWidth: 110,
      aspectRatio: 1,
      backgroundColor: c.bg,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarItemActive: { borderColor: c.accent, backgroundColor: c.accentSoft },
    avatarLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: "600",
      marginTop: 2,
    },
  });
