/**
 * LogIt — Profile Screen
 * Spatial Green v2: avatar with glow, stats bento, settings menu
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
import { Typography, FontFamily } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { OrbBackground } from '@/components/ui/OrbBackground';
import { GlassPanel } from '@/components/ui/GlassPanel';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  const displayName = user?.display_name || user?.first_name || 'User';
  const username = user?.username || 'username';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <OrbBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile card */}
          <GlassPanel borderRadius={32} style={styles.profileCard}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
                <Ionicons name="pencil" size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.displayName}>{displayName}</Text>

            {/* Username pill */}
            <View style={styles.usernamePill}>
              <Text style={styles.usernameText}>@{username}</Text>
            </View>
          </GlassPanel>

          {/* Stats bento */}
          <View style={styles.statsGrid}>
            {/* Total logs — full width */}
            <GlassPanel borderRadius={32} style={styles.totalLogCard}>
              <View style={styles.totalLogOverlay} />
              <Text style={styles.statLabel}>Total Logs</Text>
              <View style={styles.totalLogRow}>
                <Text style={styles.totalLogValue}>0</Text>
                <Ionicons
                  name="pricetag"
                  size={56}
                  color={Colors.primaryContainer}
                  style={styles.totalLogIcon}
                />
              </View>
            </GlassPanel>

            {/* Two column stats */}
            <View style={styles.statsRow}>
              <GlassPanel borderRadius={28} style={styles.statCard}>
                <Text style={styles.statValue}>0</Text>
                <View style={styles.statBadge}>
                  <Ionicons name="business-outline" size={11} color={Colors.primaryContainer} />
                  <Text style={styles.statBadgeText}>Venues</Text>
                </View>
              </GlassPanel>

              <GlassPanel borderRadius={28} style={styles.statCard}>
                <Text style={styles.statValue}>0</Text>
                <View style={styles.statBadge}>
                  <Ionicons name="flag-outline" size={11} color={Colors.primaryContainer} />
                  <Text style={styles.statBadgeText}>Teams</Text>
                </View>
              </GlassPanel>
            </View>
          </View>

          {/* Settings menu */}
          <GlassPanel borderRadius={28} style={styles.settingsMenu}>
            {/* App Settings */}
            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="settings-outline" size={20} color={Colors.textMuted} />
                </View>
                <Text style={styles.menuRowText}>App Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Friends */}
            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name="people-outline" size={20} color={Colors.textMuted} />
                </View>
                <Text style={styles.menuRowText}>Friends (0)</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Log Out */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={signOut}
            >
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIconWrap, styles.menuIconDanger]}>
                  <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                </View>
                <Text style={[styles.menuRowText, styles.menuRowDanger]}>Log Out</Text>
              </View>
            </TouchableOpacity>
          </GlassPanel>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
    gap: 16,
    paddingTop: 24,
  },

  // Profile card
  profileCard: {
    padding: 32,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(0, 255, 194, 0.5)',
    ...Shadows.glowPrimary,
  },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(0, 255, 194, 0.5)',
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowPrimary,
  },
  avatarInitials: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 44,
    color: Colors.primary,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  usernameText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },

  // Stats bento
  statsGrid: {
    gap: 12,
  },
  totalLogCard: {
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  totalLogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  statLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  totalLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLogValue: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 72,
    color: Colors.text,
    lineHeight: 80,
  },
  totalLogIcon: {
    marginTop: -8,
    textShadowColor: 'rgba(0, 255, 194, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  statValue: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 40,
    color: Colors.text,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  statBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.text,
  },

  // Settings menu
  settingsMenu: {
    marginTop: 8,
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: 'rgba(255, 113, 108, 0.1)',
    borderColor: 'rgba(255, 113, 108, 0.2)',
  },
  menuRowText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  menuRowDanger: {
    color: Colors.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.glassBorder,
    marginHorizontal: 0,
  },
});
