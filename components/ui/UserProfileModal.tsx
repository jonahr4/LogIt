/**
 * UserProfileModal — BeReal-inspired user profile popup.
 *
 * Shown when tapping any avatar/username across the app. Uses SharedModal
 * for the glass shell, adds a large photo hero, display name, friendship
 * duration, mutual-friend avatars, and a contextual action button.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { SharedModal } from '@/components/ui/SharedModal';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string | null; // null = don't show
}

interface ProfileUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Friendship {
  friendship_id: string;
  status: 'accepted' | 'pending_incoming' | 'pending_outgoing' | 'none';
  since: string; // ISO date
}

interface MutualFriend {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface ProfileResponse {
  user: ProfileUser;
  friendship: Friendship | null;
  mutual_friends: MutualFriend[];
  mutual_friends_count: number;
  is_self: boolean;
}

// ─── Avatar color derivation ──────────────────────────────────────────────────

const AVATAR_COLORS = ['#FF8A3D', '#679cff', '#ac89ff', '#00FFC2', '#facc15', '#ff716c'];

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function getRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years >= 1) return `${years} year${years > 1 ? 's' : ''}`;
  if (months >= 1) return `${months} month${months > 1 ? 's' : ''}`;
  if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  if (days >= 1) return `${days} day${days > 1 ? 's' : ''}`;
  return 'today';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UserProfileModal({ visible, onClose, userId }: UserProfileModalProps) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch profile data when modal opens
  const fetchProfile = useCallback(async (id: string) => {
    setLoading(true);
    setProfile(null);
    try {
      const data = await api.get<ProfileResponse>('/api/users/profile', { id });
      setProfile(data);
    } catch (err) {
      console.warn('UserProfileModal fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible && userId) {
      fetchProfile(userId);
    }
    if (!visible) {
      setProfile(null);
    }
  }, [visible, userId]);

  // ─── Actions ──────────────────────────────────────────────────────────────────

  const handleAddFriend = useCallback(async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await api.post('/api/friends/request', { addressee_id: userId });
      // Optimistically update friendship status
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              friendship: {
                friendship_id: '',
                status: 'pending_outgoing',
                since: new Date().toISOString(),
              },
            }
          : prev,
      );
    } catch (err) {
      console.warn('Add friend error:', err);
    } finally {
      setActionLoading(false);
    }
  }, [userId]);

  const handleAcceptRequest = useCallback(async () => {
    if (!profile?.friendship?.friendship_id) return;
    setActionLoading(true);
    try {
      await api.post('/api/friends/respond', {
        friendship_id: profile.friendship.friendship_id,
        action: 'accept',
      });
      // Optimistically update
      setProfile((prev) =>
        prev && prev.friendship
          ? {
              ...prev,
              friendship: { ...prev.friendship, status: 'accepted', since: new Date().toISOString() },
            }
          : prev,
      );
    } catch (err) {
      console.warn('Accept request error:', err);
    } finally {
      setActionLoading(false);
    }
  }, [profile?.friendship?.friendship_id]);

  // ─── Derived values ───────────────────────────────────────────────────────────

  const user = profile?.user;
  const friendship = profile?.friendship;
  const friendshipStatus = friendship?.status ?? 'none';
  const mutualFriends = profile?.mutual_friends ?? [];
  const mutualCount = profile?.mutual_friends_count ?? 0;
  const isSelf = profile?.is_self ?? false;

  const avatarColor = user ? getAvatarColor(user.username) : AVATAR_COLORS[0];
  const initial = user ? (user.display_name || user.username || '?')[0].toUpperCase() : '?';

  // Title shown in SharedModal header
  const headerTitle = user ? `@${user.username}` : 'Profile';

  return (
    <SharedModal visible={visible} onClose={onClose} title={headerTitle} noScroll>
      {loading || !profile ? (
        /* ── Loading state ────────────────────────────────────────────────── */
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
        </View>
      ) : (
        <View style={s.content}>
          {/* ── Hero photo / avatar area ─────────────────────────────────── */}
          <View style={s.heroContainer}>
            {user?.avatar_url ? (
              <>
                <Image source={{ uri: user.avatar_url }} style={s.heroImage} resizeMode="cover" />
                {/* Gradient fade at bottom for readability */}
                <LinearGradient
                  colors={['transparent', 'rgba(3, 7, 18, 0.85)']}
                  style={s.heroGradient}
                />
              </>
            ) : (
              /* Fallback: giant initial letter over subtle gradient */
              <LinearGradient
                colors={[`${avatarColor}18`, `${avatarColor}06`, 'rgba(3, 7, 18, 0.9)']}
                style={s.heroFallback}
              >
                <View style={[s.heroInitialCircle, { borderColor: `${avatarColor}35` }]}>
                  <Text style={[s.heroInitialLetter, { color: avatarColor }]}>{initial}</Text>
                </View>
              </LinearGradient>
            )}
          </View>

          {/* ── Name area ────────────────────────────────────────────────── */}
          <View style={s.nameArea}>
            <Text style={s.displayName}>{user?.display_name}</Text>

            {/* Friends for X time */}
            {friendshipStatus === 'accepted' && friendship?.since && (
              <Text style={s.friendsSince}>
                Friends for {getRelativeTime(friendship.since)}
              </Text>
            )}

            {/* Bio */}
            {user?.bio ? <Text style={s.bio}>{user.bio}</Text> : null}
          </View>

          {/* ── Mutual friends row ───────────────────────────────────────── */}
          <View style={s.mutualRow}>
            {mutualCount > 0 ? (
              <>
                {/* Stacked avatar circles (up to 3) */}
                <View style={s.mutualAvatars}>
                  {mutualFriends.slice(0, 3).map((mf, idx) => {
                    const mfColor = getAvatarColor(mf.username);
                    const mfInitial = (mf.display_name || mf.username || '?')[0].toUpperCase();
                    return (
                      <View
                        key={mf.id}
                        style={[
                          s.mutualAvatar,
                          {
                            backgroundColor: `${mfColor}20`,
                            borderColor: `${mfColor}50`,
                            marginLeft: idx > 0 ? -8 : 0,
                            zIndex: 3 - idx,
                          },
                        ]}
                      >
                        <Text style={[s.mutualAvatarLetter, { color: mfColor }]}>{mfInitial}</Text>
                      </View>
                    );
                  })}
                  {/* "+N" badge if more than shown */}
                  {mutualCount > 3 && (
                    <View style={[s.mutualAvatar, s.mutualBadge, { marginLeft: -8, zIndex: 0 }]}>
                      <Text style={s.mutualBadgeText}>+{mutualCount - 3}</Text>
                    </View>
                  )}
                </View>

                {/* Descriptive text */}
                <Text style={s.mutualText} numberOfLines={2}>
                  {buildMutualText(mutualFriends, mutualCount)}
                </Text>
              </>
            ) : (
              <Text style={s.mutualTextNone}>No mutual friends</Text>
            )}
          </View>

          {/* ── Action button ────────────────────────────────────────────── */}
          {!isSelf && (
            <View style={s.actionArea}>
              <ActionButton
                status={friendshipStatus}
                loading={actionLoading}
                onAddFriend={handleAddFriend}
                onAcceptRequest={handleAcceptRequest}
              />
            </View>
          )}
        </View>
      )}
    </SharedModal>
  );
}

// ─── Mutual friends text builder ──────────────────────────────────────────────

function buildMutualText(friends: MutualFriend[], totalCount: number): string {
  if (totalCount === 0) return 'No mutual friends';

  // Show up to 2 usernames then "and X more"
  const names = friends.slice(0, 2).map((f) => `@${f.username}`);
  const remaining = totalCount - names.length;

  if (remaining === 0) {
    if (names.length === 1) return `Friends with ${names[0]}`;
    return `Friends with ${names[0]} and ${names[1]}`;
  }
  return `Friends with ${names.join(', ')} and ${remaining} more`;
}

// ─── Action button sub-component ──────────────────────────────────────────────

function ActionButton({
  status,
  loading,
  onAddFriend,
  onAcceptRequest,
}: {
  status: string;
  loading: boolean;
  onAddFriend: () => void;
  onAcceptRequest: () => void;
}) {
  if (loading) {
    return (
      <View style={[s.actionBtn, s.actionBtnMuted]}>
        <ActivityIndicator size="small" color={Colors.primaryContainer} />
      </View>
    );
  }

  switch (status) {
    case 'none':
      return (
        <TouchableOpacity style={[s.actionBtn, s.actionBtnGreen]} onPress={onAddFriend} activeOpacity={0.7}>
          <Ionicons name="person-add-outline" size={16} color={Colors.onPrimary} style={{ marginRight: 6 }} />
          <Text style={s.actionBtnTextDark}>Add Friend</Text>
        </TouchableOpacity>
      );

    case 'pending_outgoing':
      return (
        <View style={[s.actionBtn, s.actionBtnMuted]}>
          <Ionicons name="time-outline" size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={s.actionBtnTextMuted}>Requested</Text>
        </View>
      );

    case 'pending_incoming':
      return (
        <TouchableOpacity style={[s.actionBtn, s.actionBtnGreen]} onPress={onAcceptRequest} activeOpacity={0.7}>
          <Ionicons name="checkmark-circle-outline" size={16} color={Colors.onPrimary} style={{ marginRight: 6 }} />
          <Text style={s.actionBtnTextDark}>Accept Request</Text>
        </TouchableOpacity>
      );

    case 'accepted':
      return (
        <View style={[s.actionBtn, s.actionBtnFriends]}>
          <Ionicons name="checkmark" size={16} color={Colors.primaryContainer} style={{ marginRight: 6 }} />
          <Text style={s.actionBtnTextGreen}>Friends</Text>
        </View>
      );

    default:
      return null;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BORDER = 'rgba(255, 255, 255, 0.1)';

const s = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },

  // Content wrapper
  content: {
    flex: 1,
  },

  // ─── Hero section ─────────────────────────────────────────────────────
  heroContainer: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitialCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitialLetter: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 80,
    letterSpacing: -2,
  },

  // ─── Name area ────────────────────────────────────────────────────────
  nameArea: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  displayName: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 28,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  friendsSince: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  bio: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },

  // ─── Mutual friends row ───────────────────────────────────────────────
  mutualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  mutualAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutualAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutualAvatarLetter: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
  },
  mutualBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: BORDER,
  },
  mutualBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: Colors.textMuted,
  },
  mutualText: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  mutualTextNone: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
  },

  // ─── Action button ────────────────────────────────────────────────────
  actionArea: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    marginTop: 'auto',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionBtnGreen: {
    backgroundColor: Colors.primaryContainer,
  },
  actionBtnMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionBtnFriends: {
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.25)',
  },
  actionBtnTextDark: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.onPrimary,
  },
  actionBtnTextMuted: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.textMuted,
  },
  actionBtnTextGreen: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.primaryContainer,
  },
});
