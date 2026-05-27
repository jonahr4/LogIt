/**
 * SocialModal — Full-screen social hub (Notifications + Friends)
 * BeReal-inspired simple friends interface.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';

// ─── Types ────────────────────────────────────────────────────────────────────

type SocialTab = 'notifications' | 'friends';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS = [
  { id: '1', icon: 'basketball-outline' as const, text: 'Celtics vs Lakers starts in 2 hours!', time: '2h ago', color: '#FF8A3D' },
  { id: '2', icon: 'camera-outline' as const, text: 'How was the game last night? Add a log!', time: '5h ago', color: '#679cff' },
  { id: '3', icon: 'person-add-outline' as const, text: '@sarah tagged you as a companion', time: '1d ago', color: '#00FFC2' },
  { id: '4', icon: 'flame-outline' as const, text: '3 friends also logged Celtics vs Lakers', time: '1d ago', color: '#ac89ff' },
  { id: '5', icon: 'trophy-outline' as const, text: "You've logged 10 events! 🎉", time: '3d ago', color: '#facc15' },
  { id: '6', icon: 'heart-outline' as const, text: '@mike liked your Dune review', time: '3d ago', color: '#ff716c' },
  { id: '7', icon: 'people-outline' as const, text: '@emma started following you', time: '4d ago', color: '#00FFC2' },
  { id: '8', icon: 'star-outline' as const, text: 'Your Carbone review got 5 likes!', time: '5d ago', color: '#facc15' },
];

const FRIEND_REQUESTS = [
  { id: 'req-1', name: 'Alex Chen', username: '@alexc', initial: 'A', color: '#679cff', mutuals: 4 },
  { id: 'req-2', name: 'Maya Johnson', username: '@maya_j', initial: 'M', color: '#ac89ff', mutuals: 2 },
];

const MY_FRIENDS = [
  { id: 'f-1', name: 'Jake Wilson', username: '@jake', initial: 'J', color: '#FF8A3D', lastLog: 'Celtics vs Knicks', lastLogTime: '2h ago' },
  { id: 'f-2', name: 'Emma Davis', username: '@emma', initial: 'E', color: '#facc15', lastLog: 'Carbone', lastLogTime: '5h ago' },
  { id: 'f-3', name: 'Sarah Kim', username: '@sarah', initial: 'S', color: '#00FFC2', lastLog: 'Dune: Part Two', lastLogTime: '8h ago' },
  { id: 'f-4', name: 'Mike Thompson', username: '@mike', initial: 'M', color: '#ff716c', lastLog: 'SZA — SOS Tour', lastLogTime: '1d ago' },
  { id: 'f-5', name: 'Chris Lee', username: '@chris', initial: 'C', color: '#679cff', lastLog: 'Oppenheimer', lastLogTime: '2d ago' },
  { id: 'f-6', name: 'Rachel Park', username: '@rachel', initial: 'R', color: '#ac89ff', lastLog: "L'Artusi", lastLogTime: '3d ago' },
];

const SUGGESTED_FRIENDS = [
  { id: 's-1', name: 'Daniel Rivera', username: '@dan_r', initial: 'D', color: '#FF8A3D', mutuals: 3 },
  { id: 's-2', name: 'Olivia Nguyen', username: '@livng', initial: 'O', color: '#00FFC2', mutuals: 5 },
  { id: 's-3', name: 'James Park', username: '@jpark', initial: 'J', color: '#facc15', mutuals: 2 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function SocialModal({ visible, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<SocialTab>('notifications');
  const [friendSearch, setFriendSearch] = useState('');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Social</Text>
          <TouchableOpacity onPress={onClose} style={s.closeButton} activeOpacity={0.7}>
            <Ionicons name={'close' as const} size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab pills */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tabPill, activeTab === 'notifications' && s.tabPillActive]}
            onPress={() => setActiveTab('notifications')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={16}
              color={activeTab === 'notifications' ? Colors.primaryContainer : Colors.textMuted}
            />
            <Text style={[s.tabText, activeTab === 'notifications' && s.tabTextActive]}>
              Notifications
            </Text>
            {/* Badge count */}
            <View style={s.tabBadge}>
              <Text style={s.tabBadgeText}>{MOCK_NOTIFICATIONS.length}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tabPill, activeTab === 'friends' && s.tabPillActive]}
            onPress={() => setActiveTab('friends')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'friends' ? Colors.primaryContainer : Colors.textMuted}
            />
            <Text style={[s.tabText, activeTab === 'friends' && s.tabTextActive]}>
              Friends
            </Text>
            {FRIEND_REQUESTS.length > 0 && (
              <View style={[s.tabBadge, { backgroundColor: '#ff716c' }]}>
                <Text style={s.tabBadgeText}>{FRIEND_REQUESTS.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'notifications' ? (
            <NotificationsTab />
          ) : (
            <FriendsTab search={friendSearch} onSearchChange={setFriendSearch} />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  return (
    <View style={s.tabContent}>
      {/* Today section */}
      <Text style={s.sectionLabel}>TODAY</Text>
      {MOCK_NOTIFICATIONS.slice(0, 3).map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}

      {/* This week */}
      <Text style={[s.sectionLabel, { marginTop: 24 }]}>THIS WEEK</Text>
      {MOCK_NOTIFICATIONS.slice(3, 6).map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}

      {/* Earlier */}
      <Text style={[s.sectionLabel, { marginTop: 24 }]}>EARLIER</Text>
      {MOCK_NOTIFICATIONS.slice(6).map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}
    </View>
  );
}

function NotificationRow({ item }: { item: typeof MOCK_NOTIFICATIONS[0] }) {
  return (
    <TouchableOpacity style={s.notifRow} activeOpacity={0.6}>
      <View style={s.notifIconWrap}>
        <View style={[s.notifDot, { backgroundColor: item.color }]} />
        <View style={[s.notifIconCircle, { borderColor: `${item.color}30` }]}>
          <Ionicons name={item.icon} size={18} color={item.color} />
        </View>
      </View>
      <View style={s.notifTextWrap}>
        <Text style={s.notifText} numberOfLines={2}>{item.text}</Text>
        <Text style={s.notifTime}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Friends Tab ──────────────────────────────────────────────────────────────

function FriendsTab({ search, onSearchChange }: { search: string; onSearchChange: (t: string) => void }) {
  const filteredFriends = search
    ? MY_FRIENDS.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.username.toLowerCase().includes(search.toLowerCase())
      )
    : MY_FRIENDS;

  return (
    <View style={s.tabContent}>
      {/* Search */}
      <View style={s.friendSearchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={s.friendSearchInput}
          placeholder="Search friends..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={onSearchChange}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Friend Requests */}
      {FRIEND_REQUESTS.length > 0 && (
        <>
          <Text style={s.sectionLabel}>FRIEND REQUESTS</Text>
          {FRIEND_REQUESTS.map((req) => (
            <View key={req.id} style={s.friendRow}>
              <View style={[s.friendAvatar, { backgroundColor: `${req.color}25`, borderColor: `${req.color}40` }]}>
                <Text style={[s.friendAvatarText, { color: req.color }]}>{req.initial}</Text>
              </View>
              <View style={s.friendInfo}>
                <Text style={s.friendName}>{req.name}</Text>
                <Text style={s.friendSub}>{req.username} · {req.mutuals} mutual friends</Text>
              </View>
              <View style={s.requestButtons}>
                <TouchableOpacity style={s.acceptButton} activeOpacity={0.7}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={s.declineButton} activeOpacity={0.7}>
                  <Ionicons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {/* My Friends */}
      <View style={s.friendsHeaderRow}>
        <Text style={s.sectionLabel}>MY FRIENDS</Text>
        <Text style={s.friendCount}>{MY_FRIENDS.length}</Text>
      </View>
      {filteredFriends.map((friend) => (
        <TouchableOpacity key={friend.id} style={s.friendRow} activeOpacity={0.6}>
          <View style={[s.friendAvatar, { backgroundColor: `${friend.color}25`, borderColor: `${friend.color}40` }]}>
            <Text style={[s.friendAvatarText, { color: friend.color }]}>{friend.initial}</Text>
          </View>
          <View style={s.friendInfo}>
            <Text style={s.friendName}>{friend.name}</Text>
            <Text style={s.friendSub} numberOfLines={1}>
              {friend.lastLog} · {friend.lastLogTime}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}

      {filteredFriends.length === 0 && search.length > 0 && (
        <View style={s.emptyState}>
          <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
          <Text style={s.emptyStateText}>No friends match "{search}"</Text>
        </View>
      )}

      {/* Suggested / People you may know */}
      <Text style={[s.sectionLabel, { marginTop: 28 }]}>PEOPLE YOU MAY KNOW</Text>
      {SUGGESTED_FRIENDS.map((person) => (
        <View key={person.id} style={s.friendRow}>
          <View style={[s.friendAvatar, { backgroundColor: `${person.color}25`, borderColor: `${person.color}40` }]}>
            <Text style={[s.friendAvatarText, { color: person.color }]}>{person.initial}</Text>
          </View>
          <View style={s.friendInfo}>
            <Text style={s.friendName}>{person.name}</Text>
            <Text style={s.friendSub}>{person.username} · {person.mutuals} mutual friends</Text>
          </View>
          <TouchableOpacity style={s.addButton} activeOpacity={0.7}>
            <Ionicons name="person-add-outline" size={14} color={Colors.primaryContainer} />
            <Text style={s.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Invite */}
      <TouchableOpacity style={s.inviteCard} activeOpacity={0.7}>
        <View style={s.inviteIconCircle}>
          <Ionicons name="share-outline" size={22} color={Colors.primaryContainer} />
        </View>
        <View style={s.inviteTextWrap}>
          <Text style={s.inviteTitle}>Invite Friends to LogIt</Text>
          <Text style={s.inviteSub}>Share your invite link</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  headerTitle: {
    ...Typography.pageHeader,
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

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  tabPillActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  tabText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primaryContainer,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  tabBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.onPrimary,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  // Section
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 12,
  },

  // ─── Notifications ─────────────────────────────────────────────────

  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  notifIconWrap: {
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  notifIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.glassSurface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTextWrap: {
    flex: 1,
    gap: 3,
  },
  notifText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  notifTime: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.textMuted,
  },

  // ─── Friends ────────────────────────────────────────────────────────

  friendSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  friendSearchInput: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },

  friendsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  friendCount: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.glass,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
  },
  friendInfo: {
    flex: 1,
    gap: 2,
  },
  friendName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  friendSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Request buttons
  requestButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  addButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.primaryContainer,
  },

  // Invite card
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  inviteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteTextWrap: {
    flex: 1,
    gap: 2,
  },
  inviteTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  inviteSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyStateText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
