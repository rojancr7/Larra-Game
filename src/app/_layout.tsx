import { Tabs } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Clock, Home, Settings, ShoppingBag, User } from "lucide-react-native";
import { useMemo } from "react";
import { Platform, View } from "react-native";
import type { ColorValue } from "react-native";
import { TopBar } from "../components/TopBar";
import { ThemeProvider, useTheme } from "../theme/appTheme";

const MAX_BAR_WIDTH = 640; // tab bar width on laptop / desktop

const tabIcon =
  (Icon: LucideIcon) =>
  ({
    color,
    focused,
  }: {
    color: ColorValue | null;
    size: number;
    focused: boolean;
  }) => (
    <Icon size={22} color={String(color)} strokeWidth={focused ? 2.5 : 1.8} />
  );

function TabsLayout() {
  const { c, isWide } = useTheme();

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: c.surface,
      borderTopColor: c.border,
      borderTopWidth: isWide ? 0 : 1,
      height: isWide ? 68 : Platform.OS === "ios" ? 84 : 64,
      paddingTop: 6,
      paddingBottom: isWide ? 8 : Platform.OS === "ios" ? 24 : 8,
      alignSelf: "center" as const,
      width: "100%" as const,
      maxWidth: isWide ? MAX_BAR_WIDTH : undefined,
      marginBottom: isWide ? 12 : 0,
      borderRadius: isWide ? 22 : 0,
      borderWidth: isWide ? 1 : 0,
      borderColor: c.border,
      overflow: "hidden" as const,
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

/** Root layout – ThemeProvider must sit above everything that calls useTheme(). */
export default function RootLayout() {
  return (
    <ThemeProvider>
      <TabsLayout />
    </ThemeProvider>
  );
}
