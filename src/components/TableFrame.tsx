import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
    Defs,
    LinearGradient,
    RadialGradient,
    Rect,
    Stop,
} from "react-native-svg";
import { feltPalette, useTableScale } from "../constants/theme";
import type { BoardColor } from "../services/storage";

interface TableFrameProps {
  boardColor?: BoardColor;
  children?: React.ReactNode;
}

/** Wood frame, felt with vignette, and a thin gold inner line. Children render on top. */
export const TableFrame: React.FC<TableFrameProps> = ({
  boardColor = "classic-green",
  children,
}) => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { s } = useTableScale();
  const felt = feltPalette[boardColor] || feltPalette["classic-green"];
  const frame = Math.round(24 * s);
  const { w, h } = size;

  return (
    <View
      style={styles.root}
      onLayout={(e) =>
        setSize({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      {w > 0 && (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#7a4d27" />
              <Stop offset="0.5" stopColor="#5a3719" />
              <Stop offset="1" stopColor="#2e1a0b" />
            </LinearGradient>
            <RadialGradient id="felt" cx="50%" cy="48%" rx="60%" ry="65%">
              <Stop offset="0" stopColor={felt.center} />
              <Stop offset="1" stopColor={felt.edge} />
            </RadialGradient>
            <RadialGradient id="vig" cx="50%" cy="50%" rx="72%" ry="75%">
              <Stop offset="0.55" stopColor="#000" stopOpacity="0" />
              <Stop offset="1" stopColor="#000" stopOpacity="0.55" />
            </RadialGradient>
          </Defs>

          <Rect x={0} y={0} width={w} height={h} fill="url(#wood)" />
          <Rect
            x={frame * 0.4}
            y={frame * 0.4}
            width={w - frame * 0.8}
            height={h - frame * 0.8}
            rx={26 * s}
            fill="none"
            stroke="#1d1008"
            strokeOpacity={0.6}
            strokeWidth={2}
          />
          <Rect
            x={frame}
            y={frame}
            width={w - frame * 2}
            height={h - frame * 2}
            rx={20 * s}
            fill="url(#felt)"
          />
          <Rect
            x={frame}
            y={frame}
            width={w - frame * 2}
            height={h - frame * 2}
            rx={20 * s}
            fill="url(#vig)"
          />
          <Rect
            x={frame + 14 * s}
            y={frame + 14 * s}
            width={w - (frame + 14 * s) * 2}
            height={h - (frame + 14 * s) * 2}
            rx={14 * s}
            fill="none"
            stroke="#eab308"
            strokeOpacity={0.35}
            strokeWidth={1.5}
          />
        </Svg>
      )}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1d1008" },
});

export default TableFrame;
