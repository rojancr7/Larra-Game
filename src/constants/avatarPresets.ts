/**
 * Avatar preset definitions.
 * Each entry maps an ID to its local asset image and a tint color.
 * NOTE: React Native requires static require() calls for bundled images.
 */

export interface AvatarPreset {
  id: string;
  label: string;
  color: string;
  image: ReturnType<typeof require>;
}

export const AVATAR_PRESET_LIST: AvatarPreset[] = [
  {
    id: "king",
    label: "King",
    color: "#fbbf24",
    image: require("../../assets/avatar/king.jpg"),
  },
  {
    id: "queen",
    label: "Queen",
    color: "#f472b6",
    image: require("../../assets/avatar/queen.jpg"),
  },
  {
    id: "ace",
    label: "Ace",
    color: "#60a5fa",
    image: require("../../assets/avatar/ace.jpg"),
  },
  {
    id: "tiger",
    label: "Tiger",
    color: "#fb923c",
    image: require("../../assets/avatar/tiger.jpg"),
  },
  {
    id: "lion",
    label: "Lion",
    color: "#facc15",
    image: require("../../assets/avatar/lion.jpg"),
  },
  {
    id: "eagle",
    label: "Eagle",
    color: "#a78bfa",
    // NOTE: file on disk is "edgle.jpg" (typo in filename preserved)
    image: require("../../assets/avatar/edgle.jpg"),
  },
  {
    id: "wolf",
    label: "Wolf",
    color: "#94a3b8",
    image: require("../../assets/avatar/wolf.jpg"),
  },
  {
    id: "dragon",
    label: "Dragon",
    color: "#ef4444",
    image: require("../../assets/avatar/dragon.jpg"),
  },
];

/** Look up a preset by id. Falls back to "king" if the id is not found. */
export function getAvatarPreset(id: string): AvatarPreset {
  return (
    AVATAR_PRESET_LIST.find((p) => p.id === id) ?? AVATAR_PRESET_LIST[0]
  );
}
