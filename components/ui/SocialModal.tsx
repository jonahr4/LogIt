/**
 * SocialModal — Notifications + Friends hub
 * Uses SharedModal for the unified shell; only contains content-specific UI.
 * Friends tab wired to real API: search users, send/accept/decline requests, friend list with mutual count.
 * Notifications tab stays mock for now.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { SharedModal } from '@/components/ui/SharedModal';
import { UserProfileModal } from '@/components/ui/UserProfileModal';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type SocialTab = 'notifications' | 'friends';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Mock Notifications (stays mock for now) ──────────────────────────────────

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

const BORDER = 'rgba(255, 255, 255, 0.1)';

// ─── Avatar colors for letter avatars ─────────────────────────────────────────
const AVATAR_COLORS = ['#FF8A3D', '#679cff', '#ac89ff', '#00FFC2', '#facc15', '#ff716c'];

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SocialModal({ visible, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<SocialTab>('notifications');
  const [friendSearch, setFriendSearch] = useState('');

  // Friends data state
  const [friends, setFriends] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [requestingTo, setRequestingTo] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch friends list when modal opens on friends tab
  const fetchFriendsList = useCallback(async () => {
    setIsLoadingFriends(true);
    try {
      const data = await api.get<any>('/api/friends/list');
      setFriends(data.friends || []);
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
    } catch (err) {
      console.warn('Friends list error:', err);
    } finally {
      setIsLoadingFriends(false);
    }
  }, []);

  useEffect(() => {
    if (visible && activeTab === 'friends') {
      fetchFriendsList();
    }
  }, [visible, activeTab]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (friendSearch.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await api.get<any>('/api/friends/search', { q: friendSearch });
        setSearchResults(data.users || []);
      } catch (err) {
        console.warn('Friend search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [friendSearch]);

  // Send friend request
  const handleSendRequest = useCallback(async (userId: string) => {
    setRequestingTo(userId);
    try {
      await api.post('/api/friends/request', { addressee_id: userId });
      // Update search results to reflect new status
      setSearchResults(prev => prev.map(u =>
        u.id === userId ? { ...u, friendship_status: 'pending_outgoing' } : u
      ));
      // Refresh friends list
      fetchFriendsList();
    } catch (err: any) {
      console.warn('Friend request error:', err);
      // If auto-accepted (mutual request), refresh
      if (err?.error?.code !== 'CONFLICT') return;
      fetchFriendsList();
    } finally {
      setRequestingTo(null);
    }
  }, [fetchFriendsList]);

  // Respond to request
  const handleRespond = useCallback(async (friendshipId: string, action: 'accept' | 'decline') => {
    setRespondingTo(friendshipId);
    try {
      await api.post('/api/friends/respond', { friendship_id: friendshipId, action });
      fetchFriendsList();
    } catch (err) {
      console.warn('Friend respond error:', err);
    } finally {
      setRespondingTo(null);
    }
  }, [fetchFriendsList]);

  // Remove friend
  const handleRemoveFriend = useCallback(async (friendshipId: string) => {
    try {
      await api.delete('/api/friends/remove', { friendship_id: friendshipId });
      fetchFriendsList();
    } catch (err) {
      console.warn('Friend remove error:', err);
    }
  }, [fetchFriendsList]);

  const tabSelector = (
    <View>
      <View style={s.tabRow}>
        {(['notifications', 'friends'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const icon = tab === 'notifications' ? 'notifications-outline' : 'people-outline';
          const label = tab === 'notifications' ? 'Notifications' : 'Friends';
          const badge = tab === 'notifications'
            ? MOCK_NOTIFICATIONS.filter(n => n.isNew).length
            : incoming.length;

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
    <>
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
            <FriendsTab
              search={friendSearch}
              onSearchChange={setFriendSearch}
              friends={friends}
              incoming={incoming}
              outgoing={outgoing}
              searchResults={searchResults}
              isLoading={isLoadingFriends}
              isSearching={isSearching}
              respondingTo={respondingTo}
              requestingTo={requestingTo}
              onSendRequest={handleSendRequest}
              onRespond={handleRespond}
              onRemoveFriend={handleRemoveFriend}
              onUserPress={(userId) => setProfileUserId(userId)}
            />
          )}
        </View>
      </SharedModal>

      <UserProfileModal
        visible={!!profileUserId}
        onClose={() => setProfileUserId(null)}
        userId={profileUserId}
      />
    </>
  );
}

// ─── Notifications Tab (stays mock) ───────────────────────────────────────────

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

// ─── Friends Tab (real data) ──────────────────────────────────────────────────

interface FriendsTabProps {
  search: string;
  onSearchChange: (t: string) => void;
  friends: any[];
  incoming: any[];
  outgoing: any[];
  searchResults: any[];
  isLoading: boolean;
  isSearching: boolean;
  respondingTo: string | null;
  requestingTo: string | null;
  onSendRequest: (userId: string) => void;
  onRespond: (friendshipId: string, action: 'accept' | 'decline') => void;
  onRemoveFriend: (friendshipId: string) => void;
  onUserPress: (userId: string) => void;
}

function FriendsTab({
  search, onSearchChange,
  friends, incoming, outgoing, searchResults,
  isLoading, isSearching, respondingTo, requestingTo,
  onSendRequest, onRespond, onRemoveFriend, onUserPress,
}: FriendsTabProps) {
  const isSearchMode = search.length >= 2;

  // Filter local friends when searching (for quick in-list filtering)
  const filteredFriends = search.length > 0 && !isSearchMode
    ? friends.filter(f =>
        f.user.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        f.user.username?.toLowerCase().includes(search.toLowerCase())
      )
    : friends;

  return (
    <View>
      {/* Search */}
      <View style={s.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search users..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearching && <ActivityIndicator size="small" color={Colors.primaryContainer} />}
        {search.length > 0 && !isSearching && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results (when actively searching) */}
      {isSearchMode && (
        <>
          <Text style={s.miniLabel}>SEARCH RESULTS</Text>
          {isSearching && searchResults.length === 0 && (
            <View style={s.empty}>
              <ActivityIndicator size="small" color={Colors.primaryContainer} />
              <Text style={s.emptyText}>Searching...</Text>
            </View>
          )}
          {!isSearching && searchResults.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="search-outline" size={28} color={Colors.textMuted} />
              <Text style={s.emptyText}>No users found for "{search}"</Text>
            </View>
          )}
          {searchResults.map((user) => {
            const color = getAvatarColor(user.username || user.id);
            const status = user.friendship_status;
            const isRequesting = requestingTo === user.id;

            return (
              <TouchableOpacity key={user.id} style={s.friendRow} activeOpacity={0.6} onPress={() => onUserPress(user.id)}>
                <View style={[s.avatar, { backgroundColor: `${color}20`, borderColor: `${color}35` }]}>
                  <Text style={[s.avatarLetter, { color }]}>{(user.display_name || user.username || '?')[0].toUpperCase()}</Text>
                </View>
                <View style={s.friendInfo}>
                  <Text style={s.friendName}>{user.display_name || user.username}</Text>
                  <Text style={s.friendMeta}>@{user.username}</Text>
                </View>
                {status === 'none' && (
                  <TouchableOpacity
                    style={s.addBtn}
                    activeOpacity={0.7}
                    onPress={() => onSendRequest(user.id)}
                    disabled={isRequesting}
                  >
                    {isRequesting ? (
                      <ActivityIndicator size="small" color={Colors.primaryContainer} />
                    ) : (
                      <Text style={s.addBtnText}>Add</Text>
                    )}
                  </TouchableOpacity>
                )}
                {status === 'pending_outgoing' && (
                  <View style={s.pendingPill}>
                    <Text style={s.pendingText}>Pending</Text>
                  </View>
                )}
                {status === 'pending_incoming' && (
                  <TouchableOpacity style={s.acceptBtn} activeOpacity={0.7}>
                    <Text style={s.addBtnText}>Accept</Text>
                  </TouchableOpacity>
                )}
                {status === 'accepted' && (
                  <View style={s.friendsPill}>
                    <Ionicons name="checkmark" size={12} color={Colors.primaryContainer} />
                    <Text style={s.friendsPillText}>Friends</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Non-search mode: show requests + friends list */}
      {!isSearchMode && (
        <>
          {/* Loading */}
          {isLoading && (
            <View style={s.empty}>
              <ActivityIndicator size="small" color={Colors.primaryContainer} />
              <Text style={s.emptyText}>Loading friends...</Text>
            </View>
          )}

          {/* Incoming Requests */}
          {incoming.length > 0 && (
            <>
              <Text style={s.miniLabel}>REQUESTS</Text>
              {incoming.map((req) => {
                const color = getAvatarColor(req.user.username || req.user.id);
                const isResponding = respondingTo === req.friendship_id;

                return (
                  <TouchableOpacity key={req.friendship_id} style={s.friendRow} activeOpacity={0.6} onPress={() => onUserPress(req.user.id)}>
                    <View style={[s.avatar, { backgroundColor: `${color}20`, borderColor: `${color}35` }]}>
                      <Text style={[s.avatarLetter, { color }]}>{(req.user.display_name || '?')[0].toUpperCase()}</Text>
                    </View>
                    <View style={s.friendInfo}>
                      <Text style={s.friendName}>{req.user.display_name}</Text>
                      <Text style={s.friendMeta}>@{req.user.username}</Text>
                    </View>
                    {isResponding ? (
                      <ActivityIndicator size="small" color={Colors.primaryContainer} />
                    ) : (
                      <>
                        <TouchableOpacity
                          style={s.acceptBtn}
                          activeOpacity={0.7}
                          onPress={() => onRespond(req.friendship_id, 'accept')}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.declineBtn}
                          activeOpacity={0.7}
                          onPress={() => onRespond(req.friendship_id, 'decline')}
                        >
                          <Ionicons name="close" size={16} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Outgoing Requests */}
          {outgoing.length > 0 && (
            <>
              <Text style={s.miniLabel}>SENT REQUESTS</Text>
              {outgoing.map((req) => {
                const color = getAvatarColor(req.user.username || req.user.id);
                return (
                  <TouchableOpacity key={req.friendship_id} style={s.friendRow} activeOpacity={0.6} onPress={() => onUserPress(req.user.id)}>
                    <View style={[s.avatar, { backgroundColor: `${color}20`, borderColor: `${color}35` }]}>
                      <Text style={[s.avatarLetter, { color }]}>{(req.user.display_name || '?')[0].toUpperCase()}</Text>
                    </View>
                    <View style={s.friendInfo}>
                      <Text style={s.friendName}>{req.user.display_name}</Text>
                      <Text style={s.friendMeta}>@{req.user.username}</Text>
                    </View>
                    <View style={s.pendingPill}>
                      <Text style={s.pendingText}>Pending</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Friends List */}
          {!isLoading && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.miniLabel}>FRIENDS</Text>
                <View style={s.countPill}>
                  <Text style={s.countText}>{friends.length}</Text>
                </View>
              </View>

              {friends.length === 0 && (
                <View style={s.empty}>
                  <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
                  <Text style={s.emptyText}>No friends yet</Text>
                  <Text style={[s.emptyText, { fontSize: 12 }]}>Search for users above to add friends</Text>
                </View>
              )}

              {filteredFriends.map((f) => {
                const color = getAvatarColor(f.user.username || f.user.id);
                const mutualText = f.mutual_friends > 0
                  ? `${f.mutual_friends} mutual friend${f.mutual_friends > 1 ? 's' : ''}`
                  : null;

                return (
                  <TouchableOpacity key={f.friendship_id} style={s.friendRow} activeOpacity={0.6} onPress={() => onUserPress(f.user.id)}>
                    <View style={[s.avatar, { backgroundColor: `${color}20`, borderColor: `${color}35` }]}>
                      <Text style={[s.avatarLetter, { color }]}>{(f.user.display_name || '?')[0].toUpperCase()}</Text>
                    </View>
                    <View style={s.friendInfo}>
                      <Text style={s.friendName}>{f.user.display_name}</Text>
                      <Text style={s.friendMeta} numberOfLines={1}>
                        @{f.user.username}{mutualText ? ` · ${mutualText}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}

              {filteredFriends.length === 0 && search.length > 0 && friends.length > 0 && (
                <View style={s.empty}>
                  <Ionicons name="search-outline" size={28} color={Colors.textMuted} />
                  <Text style={s.emptyText}>No results for "{search}"</Text>
                </View>
              )}
            </>
          )}

          {/* Invite */}
          <TouchableOpacity style={s.inviteRow} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={18} color={Colors.primaryContainer} />
            <Text style={s.inviteText}>Invite Friends to LogIt</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        </>
      )}
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
    minWidth: 48,
    alignItems: 'center',
  },
  addBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.primaryContainer,
  },
  pendingPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  pendingText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.textMuted,
  },
  friendsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.2)',
  },
  friendsPillText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
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
