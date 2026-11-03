import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const HudPill: React.FC<{ icon?: string; label: string }> = ({
  icon,
  label,
}) => (
  <View style={styles.pill}>
    {icon ? <Text style={styles.icon}>{icon}</Text> : null}
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(6, 40, 20, 0.92)",
    borderWidth: 1.5,
    borderColor: "#2f9d5b",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 5,
  },
  icon: { fontSize: 12 },
  text: {
    color: "#fff3c4",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});

export default HudPill;
