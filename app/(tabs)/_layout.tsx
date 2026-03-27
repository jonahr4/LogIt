/**
 * Log It — Tabs Layout
 * Main tab bar: Feed, Logbook, Add Log (+), Profile
 */

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/colors';

function TabBarIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
      {focused && <View style={styles.activeGlow} />}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="🏠" label="Feed" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="logbook"
        options={{
          title: 'Logbook',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="📖" label="Logbook" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-log"
        options={{
          title: 'Log',
          tabBarIcon: ({ focused }) => (
            <View style={styles.addButton}>
              <Text style={styles.addButtonIcon}>＋</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderTopWidth: 1,
    borderTopColor: Colors.outline,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    elevation: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 4,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabIconActive: {
    fontSize: 24,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  activeGlow: {
    position: 'absolute',
    top: -8,
    width: 40,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.brandGlow,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.brandGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonIcon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.onPrimary,
  },
});
