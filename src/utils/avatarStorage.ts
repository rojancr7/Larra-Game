/**
 * Custom avatar storage – 100% on-device. No server, no database.
 *
 * Install:
 *   npx expo install expo-image-picker expo-file-system expo-image-manipulator
 *
 * NOTE: On Expo SDK 54+, change the FileSystem import to:
 *   import * as FileSystem from 'expo-file-system/legacy';
 */
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const AVATAR_DIR = `${FileSystem.documentDirectory}avatars/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(AVATAR_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(AVATAR_DIR, { intermediates: true });
  }
}

/** Rebuilds the full path from a stored file name. */
export function avatarFileToUri(fileName?: string): string | undefined {
  return fileName ? `${AVATAR_DIR}${fileName}` : undefined;
}

export type PickResult =
  | { ok: true; fileName: string }
  | { ok: false; reason: "permission" | "cancelled" | "error" };

/**
 * Opens the gallery (or camera), crops to a square, shrinks to 400x400,
 * and saves into the app's private folder. Returns the file NAME to store
 * in the profile.
 */
export async function pickCustomAvatar(
  source: "gallery" | "camera" = "gallery",
): Promise<PickResult> {
  try {
    const perm =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: "permission" };

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    };
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets?.length) {
      return { ok: false, reason: "cancelled" };
    }

    // Shrink so the file stays small (~30–80 KB)
    const resized = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
    );

    await ensureDir();
    const fileName = `avatar_${Date.now()}.jpg`;
    await FileSystem.copyAsync({
      from: resized.uri,
      to: `${AVATAR_DIR}${fileName}`,
    });
    return { ok: true, fileName };
  } catch (err) {
    console.warn("pickCustomAvatar failed:", err);
    return { ok: false, reason: "error" };
  }
}

/** Deletes a stored custom photo (call when replacing or removing it). */
export async function deleteCustomAvatar(fileName?: string): Promise<void> {
  if (!fileName) return;
  try {
    await FileSystem.deleteAsync(`${AVATAR_DIR}${fileName}`, {
      idempotent: true,
    });
  } catch (err) {
    console.warn("deleteCustomAvatar failed:", err);
  }
}
