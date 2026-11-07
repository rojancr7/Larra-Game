import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Avatar from "../components/Avatar";
import {
  AVATAR_PRESETS,
  PlayerProfile,
  loadProfile,
  saveProfile,
} from "../services/storage";
import { deleteCustomAvatar, pickCustomAvatar } from "../utils/avatarStorage";

export default function AvatarPickerScreen() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fbbf24" />
      </View>
    );
  }

  const update = async (next: PlayerProfile) => {
    setProfile(next);
    await saveProfile(next);
  };

  const selectPreset = async (id: string) => {
    // Switching to a preset removes the custom photo to free space
    await deleteCustomAvatar(profile.avatarFile);
    await update({ ...profile, avatar: id, avatarFile: undefined });
  };

  const uploadPhoto = async (source: "gallery" | "camera") => {
    setBusy(true);
    const result = await pickCustomAvatar(source);
    setBusy(false);

    if (result.ok) {
      const oldFile = profile.avatarFile;
      await update({ ...profile, avatarFile: result.fileName });
      await deleteCustomAvatar(oldFile); // remove the replaced photo
      return;
    }
    if (result.reason === "permission") {
      Alert.alert(
        "Permission needed",
        `Allow ${source === "camera" ? "camera" : "photo"} access in Settings to use your own picture.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open settings", onPress: () => Linking.openSettings() },
        ],
      );
    } else if (result.reason === "error") {
      Alert.alert("Could not save photo", "Please try a different picture.");
    }
  };

  const removePhoto = async () => {
    await deleteCustomAvatar(profile.avatarFile);
    await update({ ...profile, avatarFile: undefined });
  };

  const chooseSource = () =>
    Alert.alert("Upload your photo", "Your photo stays on this device only.", [
      { text: "Choose from gallery", onPress: () => uploadPhoto("gallery") },
      { text: "Take a photo", onPress: () => uploadPhoto("camera") },
      { text: "Cancel", style: "cancel" },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.preview}>
        <Avatar
          avatar={profile.avatar}
          avatarFile={profile.avatarFile}
          size={120}
        />
        <Text style={styles.name}>{profile.name}</Text>
      </View>

      <Text style={styles.heading}>Your photo</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={chooseSource}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.primaryText}>
              {profile.avatarFile ? "Change photo" : "Upload photo"}
            </Text>
          )}
        </TouchableOpacity>
        {profile.avatarFile ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={removePhoto}>
            <Text style={styles.secondaryText}>Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.hint}>
        Saved only on this device. It is not uploaded anywhere.
      </Text>

      <Text style={styles.heading}>Or pick a badge</Text>
      <View style={styles.grid}>
        {AVATAR_PRESETS.map((a) => {
          const isSelected = !profile.avatarFile && profile.avatar === a.id;
          return (
            <TouchableOpacity
              key={a.id}
              style={styles.cell}
              onPress={() => selectPreset(a.id)}
            >
              {/* Show the preset itself in the grid, never the custom photo */}
              <Avatar avatar={a.id} size={76} />
              <Text style={[styles.label, isSelected && styles.labelActive]}>
                {a.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
  },
  container: { padding: 20, backgroundColor: "#0b1220", minHeight: "100%" },
  preview: { alignItems: "center", marginVertical: 20 },
  name: { color: "#e2e8f0", fontSize: 20, fontWeight: "700", marginTop: 12 },
  heading: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  row: { flexDirection: "row", gap: 12 },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#fbbf24",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: { color: "#0f172a", fontWeight: "800", fontSize: 15 },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ef4444",
    alignItems: "center",
  },
  secondaryText: { color: "#ef4444", fontWeight: "700" },
  hint: { color: "#94a3b8", fontSize: 12, marginTop: 8 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 18,
  },
  cell: { width: "25%", alignItems: "center" },
  label: { color: "#94a3b8", fontSize: 12, marginTop: 6 },
  labelActive: { color: "#fbbf24", fontWeight: "700" },
});
