import { Tabs } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Clock, Home, Settings, ShoppingBag, User } from "lucide-react-native";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ViewStyle } from "react-native";
import { Platform, useWindowDimensions, View } from "react-native";
import { TopBar } from "../components/TopBar";

type ThemeColors = {
  bg: string;
  surface: string;
  border: string;
  accent: string;
  textMuted: string;
};

const colors: ThemeColors = {
  bg: "#0f172a",
  surface: "#1e293b",
  border: "#334155",
  accent: "#38bdf8",
  textMuted: "#94a3b8",
};

const ThemeContext = createContext({ c: colors, isWide: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const value = useMemo(() => ({ c: colors, isWide: width >= 768 }), [width]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

const MAX_BAR_WIDTH = 640; // tab bar width on laptop / desktop

const tabIcon =
  (Icon: LucideIcon) =>
  ({ color, focused }: { color: unknown; size: number; focused: boolean }) => (
    <Icon
      size={22}
      color={typeof color === "string" ? color : undefined}
      strokeWidth={focused ? 2.5 : 1.8}
    />
  );

function TabsInner() {
  const { c, isWide } = useTheme();

  const tabBarStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: c.surface,
      borderTopColor: c.border,
      borderTopWidth: isWide ? 0 : 1,
      height: isWide ? 68 : Platform.OS === "ios" ? 84 : 64,
      paddingTop: 6,
      paddingBottom: isWide ? 8 : Platform.OS === "ios" ? 24 : 8,
      // Floating, centered bar on laptops
      alignSelf: "center",
      width: "100%",
      maxWidth: isWide ? MAX_BAR_WIDTH : undefined,
      marginBottom: isWide ? 12 : 0,
      borderRadius: isWide ? 22 : 0,
      borderWidth: isWide ? 1 : 0,
      borderColor: c.border,
      overflow: "hidden",
    }),
    [isWide, c],
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Tabs
        screenOptions={{
          header: () => <TopBar />,
          tabBarActiveTintColor: c.accent,
          tabBarInactiveTintColor: c.textMuted,
          tabBarLabelPosition: "below-icon",
          tabBarStyle,
          tabBarItemStyle: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          },
          tabBarLabelStyle: {
            fontSize: isWide ? 12 : 11,
            fontWeight: "700",
            marginTop: 2,
          },
          sceneStyle: { backgroundColor: c.bg },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Home", tabBarIcon: tabIcon(Home) }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: "Profile", tabBarIcon: tabIcon(User) }}
        />
        <Tabs.Screen
          name="history"
          options={{ title: "History", tabBarIcon: tabIcon(Clock) }}
        />
        <Tabs.Screen
          name="store"
          options={{ title: "Store", tabBarIcon: tabIcon(ShoppingBag) }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: "Settings", tabBarIcon: tabIcon(Settings) }}
        />

        {/* Hidden routes (not shown in the tab bar) */}
        <Tabs.Screen
          name="game"
          options={{
            href: null,
            tabBarStyle: { display: "none" },
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="online"
          options={{ href: null, headerShown: false }}
        />
      </Tabs>
    </View>
  );
}

// Root of the app: the provider has to sit ABOVE anything that calls useTheme()
export default function RootLayout() {
  return (
    <ThemeProvider>
      <TabsInner />
    </ThemeProvider>
  );
}
