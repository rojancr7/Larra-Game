import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/theme";
import { getAvatarPreset } from "../services/storage";
import { avatarFileToUri } from "../utils/avatarStorage";

interface AvatarProps {
  /** Preset id: 'king' | 'queen' | 'ace' | 'tiger' | 'lion' | 'eagle' | 'wolf' | 'dragon' */
  avatar?: string;
  /** File name of a custom photo saved on this device (profile.avatarFile) */
  avatarFile?: string;
  /** Legacy: only used if no `avatar` and no `avatarFile` is given */
  emoji?: string;
  /** Overrides the preset color used for the background tint */
  color?: string;
  /** Name pill under the avatar. Leave empty to hide it. */
  name?: string;
  size?: number;
  /** Green/yellow status dot. Leave undefined to hide it. */
  ready?: boolean;
  highlight?: boolean;
}

/** Circular gold ring avatar with a name pill overlapping its bottom edge. */
export const Avatar: React.FC<AvatarProps> = ({
  avatar,
  avatarFile,
  emoji,
  color,
  name,
  size = 52,
  ready,
  highlight,
}) => {
  const [customFailed, setCustomFailed] = useState(false);
  useEffect(() => setCustomFailed(false), [avatarFile]);

  const customUri = avatarFileToUri(avatarFile);
  const useEmojiFallback = !avatar && !customUri && !!emoji;
  const preset = getAvatarPreset(avatar ?? "king");
  const tint = color ?? preset.color;

  // Custom photo first, then preset image. Bad/missing photo falls back to preset.
  const source = customUri && !customFailed ? { uri: customUri } : preset.image;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: tint + "44",
            shadowOpacity: highlight ? 0.9 : 0.4,
          },
        ]}
      >
        {useEmojiFallback ? (
          <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
        ) : (
          <Image
            source={source}
            onError={() => setCustomFailed(true)}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        {ready !== undefined && (
          <View
            style={[
              styles.dot,
              { backgroundColor: ready ? "#22c55e" : "#eab308" },
            ]}
          />
        )}
      </View>
      {!!name && (
        <View style={[styles.pill, { marginTop: -size * 0.2 }]}>
          <Text style={styles.pillText} numberOfLines={1}>
            {name}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  ring: {
    borderWidth: 3,
    borderColor: colors.goldMid,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: colors.gold,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  image: { width: "100%", height: "100%" },
  dot: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#0b1a10",
  },
  pill: {
    backgroundColor: colors.woodDeep,
    borderWidth: 1.5,
    borderColor: colors.goldDark,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 1,
    maxWidth: 110,
  },
  pillText: { color: colors.cream, fontSize: 11, fontWeight: "700" },
});

export default Avatar;
