import React from 'react';
import { Tabs } from 'expo-router';
import { Home, User, Clock, ShoppingBag, Settings } from 'lucide-react-native';
import { TopBar } from '../components/TopBar';
import { C } from '../theme/appTheme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        header: () => <TopBar />,
        tabBarActiveTintColor: C.amber,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: 'rgba(15, 23, 42, 0.97)',
          borderTopColor: C.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }: { color: any; size: number; focused: boolean }) => (
            <Home size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }: { color: any; size: number; focused: boolean }) => (
            <User size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size, focused }: { color: any; size: number; focused: boolean }) => (
            <Clock size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          tabBarIcon: ({ color, size, focused }: { color: any; size: number; focused: boolean }) => (
            <ShoppingBag size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }: { color: any; size: number; focused: boolean }) => (
            <Settings size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          tabBarButton: () => null,
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="online"
        options={{
          tabBarButton: () => null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
