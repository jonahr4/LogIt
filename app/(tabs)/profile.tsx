/**
 * LogIt — Profile Screen
 * Spatial Green v2: Avatar, stats hero, settings menu
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';

import { useAuthStore } from '@/store/authStore';

/* ─── Settings Modal ─────────────────────────────────────────────────── */

type SettingsRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
};

function SettingsRow({ icon, label, subtitle, rightElement, onPress, danger }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={modalStyles.row}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={modalStyles.rowLeft}>
        <View
          style={[
            modalStyles.iconCircle,
            danger && modalStyles.iconCircleDanger,
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={danger ? Colors.error : Colors.textMuted}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              modalStyles.rowLabel,
              danger && { color: Colors.error },
            ]}
          >
            {label}
          </Text>
          {subtitle ? (
            <Text style={modalStyles.rowSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {rightElement ?? (
        <Ionicons
          name={'chevron-forward' as const}
          size={18}
          color={Colors.textMuted}
        />
      )}
    </TouchableOpacity>
  );
}

function SettingsDivider() {
  return <View style={modalStyles.divider} />;
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={modalStyles.sectionHeader}>{title}</Text>;
}

function SettingsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  // Privacy toggles
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);
  const [showActivityStatus, setShowActivityStatus] = useState(true);

  // Notification toggles
  const [pushNotifications, setPushNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [friendRequests, setFriendRequests] = useState(true);
  const [commentsReactions, setCommentsReactions] = useState(false);
  const [postEventPrompts, setPostEventPrompts] = useState(true);
  const [weeklyRecap, setWeeklyRecap] = useState(false);

  const renderSwitch = (value: boolean, onValueChange: (v: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{
        false: 'rgba(255,255,255,0.1)',
        true: 'rgba(0, 255, 194, 0.35)',
      }}
      thumbColor="#ffffff"
      ios_backgroundColor="rgba(255,255,255,0.1)"
    />
  );

  const renderPill = (label: string) => (
    <View style={modalStyles.valuePill}>
      <Text style={modalStyles.valuePillText}>{label}</Text>
    </View>
  );

  const renderRightText = (text: string) => (
    <Text style={modalStyles.rightText}>{text}</Text>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={modalStyles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>Settings</Text>
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name={'close' as const} size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={modalStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Account & Profile */}
            <SectionHeader title="Account & Profile" />
            <View style={modalStyles.sectionCard}>
              <SettingsRow icon={'person-circle-outline' as const} label="Edit Profile" />
              <SettingsDivider />
              <SettingsRow icon={'mail-outline' as const} label="Change Email" />
              <SettingsDivider />
              <SettingsRow icon={'key-outline' as const} label="Change Password" />
              <SettingsDivider />
              <SettingsRow
                icon={'link-outline' as const}
                label="Linked Accounts"
                subtitle="Google, Apple"
              />
            </View>

            {/* Privacy */}
            <SectionHeader title="Privacy" />
            <View style={modalStyles.sectionCard}>
              <SettingsRow
                icon={'shield-outline' as const}
                label="Default Privacy"
                rightElement={renderPill('Public')}
              />
              <SettingsDivider />
              <SettingsRow
                icon={'eye-outline' as const}
                label="Profile Visibility"
                rightElement={renderSwitch(profileVisibility, setProfileVisibility)}
              />
              <SettingsDivider />
              <SettingsRow
                icon={'person-add-outline' as const}
                label="Allow Friend Requests"
                rightElement={renderSwitch(allowFriendRequests, setAllowFriendRequests)}
              />
              <SettingsDivider />
              <SettingsRow
                icon={'radio-outline' as const}
                label="Show Activity Status"
                rightElement={renderSwitch(showActivityStatus, setShowActivityStatus)}
              />
            </View>

            {/* Notifications */}
            <SectionHeader title="Notifications" />
            <View style={modalStyles.sectionCard}>
              <SettingsRow
                icon={'notifications-outline' as const}
                label="Push Notifications"
                rightElement={renderSwitch(pushNotifications, setPushNotifications)}
              />
              <SettingsDivider />
              <SettingsRow
                icon={'alarm-outline' as const}
                label="Event Reminders"
                rightElement={renderSwitch(eventReminders, setEventReminders)}
              />
              <SettingsDivider />
              <SettingsRow
                icon={'people-outline' as const}
                label="Friend Requests"
                rightElement={renderSwitch(friendRequests, setFriendRequests)}
              />
              <SettingsDivider />
              <SettingsRow
                icon={'chatbubble-outline' as const}
                label="Comments & Reactions"
                rightElement={renderSwitch(commentsReactions, setCommentsReactions)}
              />
              <SettingsDivider />
              <SettingsRow
                icon={'camera-outline' as const}
                label="Post-Event Prompts"
                rightElement={renderSwitch(postEventPrompts, setPostEventPrompts)}
              />
              <SettingsDivider />
              <SettingsRow
                icon={'calendar-outline' as const}
                label="Weekly Recap"
                rightElement={renderSwitch(weeklyRecap, setWeeklyRecap)}
              />
            </View>

            {/* Preferences */}
            <SectionHeader title="Preferences" />
            <View style={modalStyles.sectionCard}>
              <SettingsRow
                icon={'flag-outline' as const}
                label="My Teams"
                subtitle="Manage your favorite teams"
              />
              <SettingsDivider />
              <SettingsRow icon={'heart-outline' as const} label="Favorite Event Types" />
              <SettingsDivider />
              <SettingsRow icon={'globe-outline' as const} label="Units & Format" />
            </View>

            {/* Data & Storage */}
            <SectionHeader title="Data & Storage" />
            <View style={modalStyles.sectionCard}>
              <SettingsRow icon={'trash-outline' as const} label="Clear Cache" />
              <SettingsDivider />
              <SettingsRow icon={'download-outline' as const} label="Export My Data" />
              <SettingsDivider />
              <SettingsRow
                icon={'pie-chart-outline' as const}
                label="Storage Usage"
                subtitle="12.3 MB"
              />
            </View>

            {/* Support */}
            <SectionHeader title="Support" />
            <View style={modalStyles.sectionCard}>
              <SettingsRow icon={'help-circle-outline' as const} label="Help & FAQ" />
              <SettingsDivider />
              <SettingsRow icon={'bug-outline' as const} label="Report a Bug" />
              <SettingsDivider />
              <SettingsRow icon={'star-outline' as const} label="Rate LogIt" />
              <SettingsDivider />
              <SettingsRow icon={'chatbox-outline' as const} label="Contact Us" />
            </View>

            {/* About */}
            <SectionHeader title="About" />
            <View style={modalStyles.sectionCard}>
              <SettingsRow icon={'document-text-outline' as const} label="Terms of Service" />
              <SettingsDivider />
              <SettingsRow icon={'lock-closed-outline' as const} label="Privacy Policy" />
              <SettingsDivider />
              <SettingsRow
                icon={'information-circle-outline' as const}
                label="App Version"
                rightElement={renderRightText('1.0.0 (build 1)')}
              />
            </View>

            {/* Danger Zone */}
            <SectionHeader title="Danger Zone" />
            <View style={modalStyles.sectionCard}>
              <SettingsRow
                icon={'warning-outline' as const}
                label="Delete Account"
                danger
              />
            </View>

            {/* Bottom spacer */}
            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  headerTitle: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 24,
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDanger: {
    backgroundColor: 'rgba(255, 113, 108, 0.1)',
    borderColor: 'rgba(255, 113, 108, 0.2)',
  },
  rowLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  rowSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.glassBorder,
    marginLeft: 76,
  },
  valuePill: {
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  valuePillText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  rightText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
  },
});

/* ─── Profile Screen ─────────────────────────────────────────────────── */

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const initials = user?.display_name
    ? user.display_name.charAt(0).toUpperCase()
    : '?';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.gearButton}
          onPress={() => setSettingsVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name={'settings-outline' as const} size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

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
          <TouchableOpacity style={styles.settingsRow} onPress={() => setSettingsVisible(true)}>
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

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Header row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    ...Typography.pageHeader,
    color: Colors.text,
  },
  gearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
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
