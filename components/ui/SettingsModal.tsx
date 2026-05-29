/**
 * SettingsModal — Full settings hub
 * Uses SharedModal for the unified shell; only contains settings-specific content.
 */

import React, { useState } from 'react';
import { Switch } from 'react-native';
import { Colors } from '@/constants/colors';
import {
  SharedModal,
  ModalSectionHeader,
  ModalSectionCard,
  ModalRow,
  ModalDivider,
  ModalPill,
  ModalRightText,
} from '@/components/ui/SharedModal';
import { EditProfileModal } from '@/components/ui/EditProfileModal';
import { useAuthStore } from '@/store/authStore';

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: Props) {
  const { signOut } = useAuthStore();
  const [showEditProfile, setShowEditProfile] = useState(false);

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
      trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(0, 255, 194, 0.35)' }}
      thumbColor="#ffffff"
      ios_backgroundColor="rgba(255,255,255,0.1)"
    />
  );

  return (
    <>
      <SharedModal visible={visible} onClose={onClose} title="Settings">
        {/* Account & Profile */}
        <ModalSectionHeader title="Account & Profile" />
        <ModalSectionCard>
          <ModalRow icon={'person-circle-outline' as const} label="Edit Profile" onPress={() => setShowEditProfile(true)} />
          <ModalDivider />
          <ModalRow icon={'mail-outline' as const} label="Change Email" subtitle="Coming soon" />
          <ModalDivider />
          <ModalRow icon={'key-outline' as const} label="Change Password" subtitle="Coming soon" />
        </ModalSectionCard>

        {/* Privacy */}
        <ModalSectionHeader title="Privacy" />
        <ModalSectionCard>
          <ModalRow icon={'shield-outline' as const} label="Default Privacy" rightElement={<ModalPill label="Public" />} />
          <ModalDivider />
          <ModalRow icon={'eye-outline' as const} label="Profile Visibility" rightElement={renderSwitch(profileVisibility, setProfileVisibility)} />
          <ModalDivider />
          <ModalRow icon={'person-add-outline' as const} label="Allow Friend Requests" rightElement={renderSwitch(allowFriendRequests, setAllowFriendRequests)} />
          <ModalDivider />
          <ModalRow icon={'radio-outline' as const} label="Show Activity Status" rightElement={renderSwitch(showActivityStatus, setShowActivityStatus)} />
        </ModalSectionCard>

        {/* Notifications */}
        <ModalSectionHeader title="Notifications" />
        <ModalSectionCard>
          <ModalRow icon={'notifications-outline' as const} label="Push Notifications" rightElement={renderSwitch(pushNotifications, setPushNotifications)} />
          <ModalDivider />
          <ModalRow icon={'alarm-outline' as const} label="Event Reminders" rightElement={renderSwitch(eventReminders, setEventReminders)} />
          <ModalDivider />
          <ModalRow icon={'people-outline' as const} label="Friend Requests" rightElement={renderSwitch(friendRequests, setFriendRequests)} />
          <ModalDivider />
          <ModalRow icon={'chatbubble-outline' as const} label="Comments & Reactions" rightElement={renderSwitch(commentsReactions, setCommentsReactions)} />
          <ModalDivider />
          <ModalRow icon={'camera-outline' as const} label="Post-Event Prompts" rightElement={renderSwitch(postEventPrompts, setPostEventPrompts)} />
          <ModalDivider />
          <ModalRow icon={'calendar-outline' as const} label="Weekly Recap" rightElement={renderSwitch(weeklyRecap, setWeeklyRecap)} />
        </ModalSectionCard>

        {/* Preferences */}
        <ModalSectionHeader title="Preferences" />
        <ModalSectionCard>
          <ModalRow icon={'flag-outline' as const} label="My Teams" subtitle="Manage your favorite teams" />
          <ModalDivider />
          <ModalRow icon={'heart-outline' as const} label="Favorite Event Types" />
          <ModalDivider />
          <ModalRow icon={'globe-outline' as const} label="Units & Format" />
        </ModalSectionCard>

        {/* Data & Storage */}
        <ModalSectionHeader title="Data & Storage" />
        <ModalSectionCard>
          <ModalRow icon={'trash-outline' as const} label="Clear Cache" />
          <ModalDivider />
          <ModalRow icon={'download-outline' as const} label="Export My Data" />
          <ModalDivider />
          <ModalRow icon={'pie-chart-outline' as const} label="Storage Usage" subtitle="12.3 MB" />
        </ModalSectionCard>

        {/* Support */}
        <ModalSectionHeader title="Support" />
        <ModalSectionCard>
          <ModalRow icon={'help-circle-outline' as const} label="Help & FAQ" />
          <ModalDivider />
          <ModalRow icon={'bug-outline' as const} label="Report a Bug" />
          <ModalDivider />
          <ModalRow icon={'star-outline' as const} label="Rate LogIt" />
          <ModalDivider />
          <ModalRow icon={'chatbox-outline' as const} label="Contact Us" />
        </ModalSectionCard>

        {/* About */}
        <ModalSectionHeader title="About" />
        <ModalSectionCard>
          <ModalRow icon={'document-text-outline' as const} label="Terms of Service" />
          <ModalDivider />
          <ModalRow icon={'lock-closed-outline' as const} label="Privacy Policy" />
          <ModalDivider />
          <ModalRow icon={'information-circle-outline' as const} label="App Version" rightElement={<ModalRightText text="1.0.0 (build 1)" />} />
        </ModalSectionCard>

        {/* Log Out */}
        <ModalSectionHeader title="" />
        <ModalSectionCard>
          <ModalRow icon={'log-out-outline' as const} label="Log Out" danger onPress={signOut} />
        </ModalSectionCard>

        {/* Danger Zone */}
        <ModalSectionHeader title="Danger Zone" />
        <ModalSectionCard>
          <ModalRow icon={'warning-outline' as const} label="Delete Account" danger />
        </ModalSectionCard>
      </SharedModal>

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
    </>
  );
}
