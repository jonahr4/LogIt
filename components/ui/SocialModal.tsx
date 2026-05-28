/**
 * SocialModal — Notifications + Friends hub
 * Uses SharedModal for the unified shell; only contains content-specific UI.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily, LetterSpacing } from '@/constants/typography';
import { SharedModal } from '@/components/ui/SharedModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type SocialTab = 'notifications' | 'friends';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS = [
  { id: '1', icon: 'basketball-outline' as const, text: 'Celtics vs Lakers starts in 2 hours!', time: '2h ago', color: '#FF8A3D', isNew: true },
  { id: '2', icon: 'camera-outline' as const, text: 'How was the game last night? Add a log!', time: '5h ago', color: '#679cff', isNew: true },
  { id: '3', icon: 'person-add-outline' as const, text: '@sarah tagged you as a companion', time: '1d ago', color: '#00FFC2', isNew: true },
  { id: '4', icon: 'flame-outline' as const, text: '3 friends also logged Celtics vs Lakers', time: '1d ago', color: '#ac89ff', isNew: false },
  { id: '5', icon: 'trophy-outline' as const, text: "You've logged 10 events! 🎉", time: '3d ago', color: '#facc15', isNew: false },
  { id: '6', icon: 'heart-outline' as const, text: '@mike liked your Dune review', time: '3d ago', color: '#ff716c', isNew: false },
  { id: '7', icon: 'people-outline' as const, text: '@emma started following you', time: '4d ago', color: '#00FFC2', isNew: false },
  { id: '8', icon: 'star-outline' as const, text: 'Your Carbone review got 5 likes!', time: '5d ago', color: '#facc15', isNew: false },
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

const BORDER = 'rgba(255, 255, 255, 0.1)';

// ─── Component ────────────────────────────────────────────────────────────────

export function SocialModal({ visible, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<SocialTab>('notifications');
  const [friendSearch, setFriendSearch] = useState('');

  const tabSelector = (
    <View>
      <View style={s.tabRow}>
        {(['notifications', 'friends'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const icon = tab === 'notifications' ? 'notifications-outline' : 'people-outline';
          const label = tab === 'notifications' ? 'Notifications' : 'Friends';
          const badge = tab === 'notifications'
            ? MOCK_NOTIFICATIONS.filter(n => n.isNew).length
            : FRIEND_REQUESTS.length;

          return (
            <TouchableOpacity
              key={tab}
              style={[s.tabPill, isActive && s.tabPillActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Ionicons name={icon as any} size={15} color={isActive ? Colors.primaryContainer : Colors.textMuted} />
              <Text style={[s.tabText, isActive && s.tabTextActive]}>{label}</Text>
              {badge > 0 && (
                <View style={[s.badge, tab === 'friends' && { backgroundColor: '#ff716c' }]}>
                  <Text style={s.badgeText}>{badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={s.tabDivider} />
    </View>
  );

  return (
    <SharedModal
      visible={visible}
      onClose={onClose}
      title="Social"
      stickyContent={tabSelector}
    >
      <View style={s.tabContent}>
        {activeTab === 'notifications' ? (
          <NotificationsTab />
        ) : (
          <FriendsTab search={friendSearch} onSearchChange={setFriendSearch} />
        )}
      </View>
    </SharedModal>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const newItems = MOCK_NOTIFICATIONS.filter(n => n.isNew);
  const olderItems = MOCK_NOTIFICATIONS.filter(n => !n.isNew);

  return (
    <View>
      {newItems.length > 0 && (
        <>
          <Text style={s.miniLabel}>NEW</Text>
          {newItems.map((item) => <NotifRow key={item.id} item={item} />)}
        </>
      )}
      {olderItems.length > 0 && (
        <>
          <Text style={[s.miniLabel, { marginTop: 24 }]}>EARLIER</Text>
          {olderItems.map((item) => <NotifRow key={item.id} item={item} />)}
        </>
      )}
    </View>
  );
}

function NotifRow({ item }: { item: typeof MOCK_NOTIFICATIONS[0] }) {
  return (
    <TouchableOpacity style={s.notifRow} activeOpacity={0.6}>
      <View style={[s.notifIcon, { backgroundColor: `${item.color}15`, borderColor: `${item.color}30` }]}>
        <Ionicons name={item.icon} size={18} color={item.color} />
      </View>
      <View style={s.notifBody}>
        <Text style={s.notifText} numberOfLines={2}>{item.text}</Text>
        <Text style={s.notifTime}>{item.time}</Text>
      </View>
      {item.isNew && <View style={[s.newDot, { backgroundColor: item.color }]} />}
    </TouchableOpacity>
  );
}

// ─── Friends Tab ──────────────────────────────────────────────────────────────

function FriendsTab({ search, onSearchChange }: { search: string; onSearchChange: (t: string) => void }) {
  const filtered = search
    ? MY_FRIENDS.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.username.toLowerCase().includes(search.toLowerCase())
      )
    : MY_FRIENDS;

  return (
    <View>
      {/* Search */}
      <View style={s.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Find friends..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={onSearchChange}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Requests */}
      {FRIEND_REQUESTS.length > 0 && (
        <>
          <Text style={s.miniLabel}>REQUESTS</Text>
          {FRIEND_REQUESTS.map((req) => (
            <View key={req.id} style={s.friendRow}>
              <View style={[s.avatar, { backgroundColor: `${req.color}20`, borderColor: `${req.color}35` }]}>
                <Text style={[s.avatarLetter, { color: req.color }]}>{req.initial}</Text>
              </View>
              <View style={s.friendInfo}>
                <Text style={s.friendName}>{req.name}</Text>
                <Text style={s.friendMeta}>{req.mutuals} mutual friends</Text>
              </View>
              <TouchableOpacity style={s.acceptBtn} activeOpacity={0.7}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={s.declineBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* My Friends */}
      <View style={s.sectionRow}>
        <Text style={s.miniLabel}>FRIENDS</Text>
        <View style={s.countPill}>
          <Text style={s.countText}>{MY_FRIENDS.length}</Text>
        </View>
      </View>
      {filtered.map((f) => (
        <TouchableOpacity key={f.id} style={s.friendRow} activeOpacity={0.6}>
          <View style={[s.avatar, { backgroundColor: `${f.color}20`, borderColor: `${f.color}35` }]}>
            <Text style={[s.avatarLetter, { color: f.color }]}>{f.initial}</Text>
          </View>
          <View style={s.friendInfo}>
            <Text style={s.friendName}>{f.name}</Text>
            <Text style={s.friendMeta} numberOfLines={1}>{f.lastLog} · {f.lastLogTime}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}

      {filtered.length === 0 && search.length > 0 && (
        <View style={s.empty}>
          <Ionicons name="search-outline" size={28} color={Colors.textMuted} />
          <Text style={s.emptyText}>No results for "{search}"</Text>
        </View>
      )}

      {/* Suggested */}
      <Text style={[s.miniLabel, { marginTop: 28 }]}>SUGGESTED</Text>
      {SUGGESTED_FRIENDS.map((p) => (
        <View key={p.id} style={s.friendRow}>
          <View style={[s.avatar, { backgroundColor: `${p.color}20`, borderColor: `${p.color}35` }]}>
            <Text style={[s.avatarLetter, { color: p.color }]}>{p.initial}</Text>
          </View>
          <View style={s.friendInfo}>
            <Text style={s.friendName}>{p.name}</Text>
            <Text style={s.friendMeta}>{p.mutuals} mutual friends</Text>
          </View>
          <TouchableOpacity style={s.addBtn} activeOpacity={0.7}>
            <Text style={s.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Invite */}
      <TouchableOpacity style={s.inviteRow} activeOpacity={0.7}>
        <Ionicons name="share-outline" size={18} color={Colors.primaryContainer} />
        <Text style={s.inviteText}>Invite Friends to LogIt</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Content-specific styles (NOT modal shell — that's in SharedModal) ────────

const s = StyleSheet.create({
  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabPillActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  tabText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primaryContainer,
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: Colors.onPrimary,
  },

  tabDivider: {
    height: 1,
    backgroundColor: BORDER,
  },
  tabContent: { paddingHorizontal: 16, paddingTop: 4 },

  // Section label
  miniLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 10,
  },

  // ─── Notifications ─────────────────────────────────────────────────

  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: {
    flex: 1,
    gap: 2,
  },
  notifText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  notifTime: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // ─── Friends ────────────────────────────────────────────────────────

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    marginBottom: 10,
  },
  countPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.textMuted,
  },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
  },
  friendInfo: {
    flex: 1,
    gap: 1,
  },
  friendName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  friendMeta: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Buttons
  acceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  addBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.primaryContainer,
  },

  // Invite
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  inviteText: {
    flex: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  emptyText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
