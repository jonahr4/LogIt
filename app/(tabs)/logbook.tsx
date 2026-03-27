/**
 * Log It — Logbook Screen (placeholder for Phase 1)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function LogbookScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Logbook</Text>
        <Text style={styles.count}>0 events logged</Text>
      </View>
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📖</Text>
        <Text style={styles.emptyTitle}>No logs yet</Text>
        <Text style={styles.emptySubtitle}>
          Your event history will appear here once you start logging.
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
  count: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginTop: 4,
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
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
