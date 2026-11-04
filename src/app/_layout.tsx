import { Tabs } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Clock, Home, Settings, ShoppingBag, User } from "lucide-react-native";
import { useMemo } from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import { TopBar } from "../components/TopBar";
import { C } from "../theme/appTheme";

const MAX_BAR_WIDTH = 640; // tab bar width on laptop / desktop
const WIDE_BREAKPOINT = 768; // tablet / laptop

const tabIcon =
  (Icon: LucideIcon) =>
  ({ color, focused }: { color: unknown; size: number; focused: boolean }) => (
    <Icon size={22} color={String(color)} strokeWidth={focused ? 2.5 : 1.8} />
  );

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const tabBarStyle = useMemo(() => {
    // Center the bar and keep it from stretching across a huge screen
    const sideMargin = isWide ? Math.max(0, (width - MAX_BAR_WIDTH) / 2) : 0;

    return {
      backgroundColor: "rgba(15, 23, 42, 0.97)",
      borderTopColor: C.border,
      borderTopWidth: isWide ? 0 : 1,
      height: isWide ? 68 : Platform.OS === "ios" ? 84 : 64,
      paddingTop: 6,
      paddingBottom: isWide ? 8 : Platform.OS === "ios" ? 24 : 8,
      marginHorizontal: sideMargin,
      marginBottom: isWide ? 12 : 0,
      borderRadius: isWide ? 22 : 0,
      borderWidth: isWide ? 1 : 0,
      borderColor: C.border,
      overflow: "hidden" as const,
    };
  }, [isWide, width]);

  return (
    // Same background behind the floating bar on wide screens
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Tabs
        screenOptions={{
          header: () => <TopBar />,
          tabBarActiveTintColor: C.amber,
          tabBarInactiveTintColor: C.muted,

          // KEY FIX: stops the "icons stuck on one side" layout on wide screens
          tabBarLabelPosition: "below-icon",

          tabBarStyle,
          tabBarItemStyle: {
            flex: 1, // every tab gets equal width
            alignItems: "center",
            justifyContent: "center",
          },
          tabBarLabelStyle: {
            fontSize: isWide ? 12 : 11,
            fontWeight: "700",
            marginTop: 2,
          },
          sceneStyle: { backgroundColor: C.bg },
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
