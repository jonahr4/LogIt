/**
 * LogIt — Tabs Layout
 * Floating pill nav bar matching spatial-green-v2 design
 * Ionicons, glass background, green + button, divider lines
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrbBackground } from '@/components/ui/OrbBackground';
import { BlurView } from 'expo-blur';

type TabIconName = keyof typeof Ionicons.glyphMap;

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  const tabs: { key: string; icon: TabIconName; iconFilled: TabIconName; isAdd?: boolean }[] = [
    { key: 'feed', icon: 'home-outline', iconFilled: 'home' },
    { key: 'logbook', icon: 'book-outline', iconFilled: 'book' },
    { key: 'add-log', icon: 'add', iconFilled: 'add', isAdd: true },
    { key: 'profile', icon: 'person-outline', iconFilled: 'person' },
  ];

  return (
    <View style={[styles.navContainer, { bottom: bottomOffset }]}>
      <BlurView intensity={60} tint="dark" style={styles.navBar}>
        {tabs.map((tab, index) => {
          const routeIndex = state.routes.findIndex((r: any) => r.name === tab.key);
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const route = state.routes[routeIndex];
            if (!route) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Divider before the + button
          if (index === 2) {
            return (
              <React.Fragment key={tab.key}>
                <View style={styles.divider} />
                <TouchableOpacity
                  onPress={onPress}
                  activeOpacity={0.8}
                  style={styles.addButton}
                >
                  <Ionicons name="add" size={28} color={Colors.onPrimary} />
                </TouchableOpacity>
                <View style={styles.divider} />
              </React.Fragment>
            );
          }

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
            >
              <Ionicons
                name={isFocused ? tab.iconFilled : tab.icon}
                size={24}
                color={isFocused ? Colors.text : Colors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <OrbBackground />
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
        <Tabs.Screen name="logbook" options={{ title: 'Logbook' }} />
        <Tabs.Screen name="add-log" options={{ title: 'Log' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 20, 0.45)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
    ...Shadows.card,
  },
  tabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 2,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowPrimary,
  },
});
