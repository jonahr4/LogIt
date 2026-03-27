/**
 * Log It — Profile Screen (placeholder for Phase 1)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.display_name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.displayName}>{user?.display_name || 'User'}</Text>
        <Text style={styles.username}>@{user?.username || 'username'}</Text>
        {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Venues</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Sign Out"
          onPress={signOut}
          variant="danger"
          size="sm"
        />
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
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.onPrimary,
  },
  displayName: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  username: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  bio: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    marginHorizontal: 28,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.outline,
  },
  footer: {
    paddingHorizontal: 28,
    marginTop: 'auto',
    paddingBottom: 120,
  },
});
