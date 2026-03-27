/**
 * LogIt — Tabs Layout
 * Floating pill-shaped bottom nav bar matching spatial-green-v2
 * Custom tab bar: Home, Logbook, + (add), Profile
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';

type TabDef = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
  isAdd?: boolean;
};

const TABS: TabDef[] = [
  { name: 'feed', icon: 'home-outline', iconFilled: 'home' },
  { name: 'logbook', icon: 'book-outline', iconFilled: 'book' },
  { name: 'add-log', icon: 'add', iconFilled: 'add', isAdd: true },
  { name: 'profile', icon: 'person-outline', iconFilled: 'person' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={({ state, navigation }) => (
        <View style={[styles.navOuter, { bottom: bottomOffset + 8 }]}>
          <View style={styles.navBar}>
            {TABS.map((tab, index) => {
              const isFocused = state.index === index;

              if (tab.isAdd) {
                return (
                  <React.Fragment key={tab.name}>
                    <View style={styles.divider} />
                    <TouchableOpacity
                      onPress={() => navigation.navigate(tab.name)}
                      activeOpacity={0.85}
                      style={[styles.addButton, Shadows.glowPrimary]}
                    >
                      <Ionicons name="add" size={28} color={Colors.onPrimary} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                  </React.Fragment>
                );
              }

              return (
                <TouchableOpacity
                  key={tab.name}
                  onPress={() => navigation.navigate(tab.name)}
                  activeOpacity={0.7}
                  style={[
                    styles.navItem,
                    isFocused && styles.navItemActive,
                  ]}
                >
                  <Ionicons
                    name={isFocused ? tab.iconFilled : tab.icon}
                    size={24}
                    color={isFocused ? Colors.text : Colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    >
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="logbook" options={{ title: 'Logbook' }} />
      <Tabs.Screen name="add-log" options={{ title: 'Log' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.card,
    minWidth: 280,
  },
  navItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
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
  },
});
