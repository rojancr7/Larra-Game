import React, { createContext, useContext, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { ThemeDef } from "../constants/themeManifest";
import { useAppTheme } from "../services/themeManager";

interface BoardLayoutContextType {
  boardSize: number;
  boardLeft: number;
  boardTop: number;
  scale: number; // boardSize / 1600
  theme: ThemeDef;
}

export const BoardLayoutContext = createContext<BoardLayoutContextType>({
  boardSize: 600,
  boardLeft: 0,
  boardTop: 0,
  scale: 600 / 1600,
  theme: null as any,
});

export const useBoardLayout = () => useContext(BoardLayoutContext);

interface TableFrameProps {
  children?: React.ReactNode;
}

/**
 * Renders the 1600x1600 1:1 board without stretching.
 * Background frame is rendered using theme.ui.wood and theme.ui.panel.
 */
export const TableFrame: React.FC<TableFrameProps> = ({ children }) => {
  const theme = useAppTheme();
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const { w, h } = layout;

  // Board is 1:1 aspect ratio. Scale to fit screen height in landscape (or min of w, h)
  const boardSize = Math.max(1, Math.min(w || 800, h || 400));
  const boardLeft = Math.max(0, (w - boardSize) / 2);
  const boardTop = Math.max(0, (h - boardSize) / 2);
  const scale = boardSize / 1600;

  const contextValue: BoardLayoutContextType = {
    boardSize,
    boardLeft,
    boardTop,
    scale,
    theme,
  };

  return (
    <View
      style={[styles.root, { backgroundColor: theme.ui.wood }]}
      onLayout={(e) =>
        setLayout({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      {w > 0 && h > 0 && (
        <BoardLayoutContext.Provider value={contextValue}>
          {/* Centered 1:1 Board Image */}
          <View
            style={[
              styles.boardContainer,
              {
                width: boardSize,
                height: boardSize,
                left: boardLeft,
                top: boardTop,
              },
            ]}
          >
            <Image
              source={theme.boardSource}
              style={styles.boardImage}
              resizeMode="contain"
            />
          </View>

          {/* Live UI layered directly ON TOP of the board image */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {children}
          </View>
        </BoardLayoutContext.Provider>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  boardContainer: {
    position: "absolute",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  boardImage: {
    width: "100%",
    height: "100%",
  },
});

export default TableFrame;
