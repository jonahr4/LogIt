/**
 * Log It — Feed Screen (placeholder for Phase 1)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';

export default function FeedScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
      </View>
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🏟️</Text>
        <Text style={styles.emptyTitle}>Welcome{user?.display_name ? `, ${user.display_name}` : ''}!</Text>
        <Text style={styles.emptySubtitle}>
          Log your first event to see it here.{'\n'}
          Tap the + button to get started.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
