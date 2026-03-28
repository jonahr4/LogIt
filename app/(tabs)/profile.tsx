/**
 * LogIt — Profile Screen
 * Spatial Green v2: Avatar, stats hero, settings menu
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';

import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  const initials = user?.display_name
    ? user.display_name.charAt(0).toUpperCase()
    : '?';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <GlassCard borderRadius={32} style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarRing}>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.displayName}>
            {user?.display_name || 'User'}
          </Text>
          <View style={styles.usernamePill}>
            <Text style={styles.usernameText}>
              @{user?.username || 'username'}
            </Text>
          </View>
        </GlassCard>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {/* Total Logs — full width hero */}
          <GlassCard borderRadius={32} style={styles.totalLogsCard}>
            <Text style={styles.statLabel}>TOTAL LOGS</Text>
            <View style={styles.totalLogsRow}>
              <Text style={styles.totalLogsNumber}>0</Text>
              <Ionicons
                name="layers"
                size={60}
                color={Colors.primaryContainer}
                style={styles.totalLogsIcon}
              />
            </View>
          </GlassCard>

          {/* Venues */}
          <GlassCard borderRadius={28} style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <View style={styles.statPill}>
              <Ionicons name="business-outline" size={12} color={Colors.primaryContainer} />
              <Text style={styles.statPillText}>VENUES</Text>
            </View>
          </GlassCard>

          {/* Teams */}
          <GlassCard borderRadius={28} style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <View style={styles.statPill}>
              <Ionicons name="flag-outline" size={12} color={Colors.primaryContainer} />
              <Text style={styles.statPillText}>TEAMS</Text>
            </View>
          </GlassCard>
        </View>

        {/* Settings menu */}
        <GlassCard borderRadius={28} style={styles.settingsCard}>
          {/* App Settings */}
          <TouchableOpacity style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <View style={styles.settingsIconCircle}>
                <Ionicons name="settings-outline" size={20} color={Colors.textMuted} />
              </View>
              <Text style={styles.settingsLabel}>App Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.settingsDivider} />

          {/* Friends */}
          <TouchableOpacity style={styles.settingsRow}>
            <View style={styles.settingsLeft}>
              <View style={styles.settingsIconCircle}>
                <Ionicons name="people-outline" size={20} color={Colors.textMuted} />
              </View>
              <Text style={styles.settingsLabel}>Friends (0)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.settingsDivider} />

          {/* Log Out */}
          <TouchableOpacity style={styles.logoutRow} onPress={signOut}>
            <View style={styles.settingsLeft}>
              <View style={styles.logoutIconCircle}>
                <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              </View>
              <Text style={styles.logoutLabel}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </GlassCard>

        {/* Bottom spacer */}
        <View style={{ height: 140 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 20,
  },

  // Profile card
  profileCard: {
    padding: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(0, 255, 194, 0.4)',
    padding: 4,
    ...Shadows.glowPrimary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 42,
    color: Colors.primaryContainer,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: -8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  displayName: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.text,
    marginBottom: 8,
  },
  usernamePill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  usernameText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  totalLogsCard: {
    width: '100%',
    padding: 24,
    overflow: 'hidden',
  },
  totalLogsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLogsNumber: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 80,
    color: Colors.text,
    lineHeight: 88,
  },
  totalLogsIcon: {
    opacity: 0.8,
  },
  statLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statNumber: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 44,
    color: Colors.text,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  statPillText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.text,
  },

  // Settings
  settingsCard: {
    overflow: 'hidden',
    marginTop: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingsIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: Colors.glassBorder,
    marginLeft: 76,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  logoutIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 113, 108, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 113, 108, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.error,
    letterSpacing: 0.3,
  },
});
