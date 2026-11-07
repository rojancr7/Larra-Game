import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../components/Avatar";
import { triggerHaptic } from "../services/audioHaptics";
import {
  DEFAULT_PROFILE,
  loadProfile,
  PlayerProfile,
} from "../services/storage";
import { C, serif } from "../theme/appTheme";

// Logo lives at <project root>/assets/images/logo.jpg
const LOGO = require("../../assets/images/logo.jpg");

export function TopBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);

  // Reload whenever a tab gains focus so stats and avatar update
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadProfile().then((p) => active && setProfile(p));
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>
      <StatusBar style="light" />

      <View style={styles.brand}>
        <Image
          source={LOGO}
          style={styles.logo}
          resizeMode="cover"
          accessibilityLabel="Larra logo"
        />
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>LARRA</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>pro</Text>
            </View>
          </View>
          <Text style={styles.tagline}>Tactical Partition Card Arena</Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.stat}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statText}>{profile.matchesWon}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statText}>{profile.totalPoints}</Text>
        </View>
        <Pressable
          accessibilityLabel="Open profile"
          onPress={() => {
            triggerHaptic("selection");
            router.navigate("/profile" as any);
          }}
          style={styles.avatarWrap}
        >
          <Avatar
            avatar={profile.avatar}
            avatarFile={profile.avatarFile}
            size={36}
          />
          <View style={styles.online} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#0E0B1D",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.amber,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandName: {
    color: C.amber,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1.5,
    fontFamily: serif,
  },
  pill: {
    backgroundColor: C.amberSoft,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  pillText: { color: C.amberLight, fontSize: 9, fontWeight: "700" },
  tagline: { color: C.muted, fontSize: 10 },
  right: { flexDirection: "row", alignItems: "center", gap: 6 },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(2, 6, 23, 0.8)",
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statIcon: { fontSize: 11 },
  statText: { color: C.text, fontSize: 12, fontWeight: "800" },
  avatarWrap: {
    width: 36,
    height: 36,
    marginLeft: 2,
  },
  online: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.emerald,
    borderWidth: 2,
    borderColor: C.surface,
  },
});
