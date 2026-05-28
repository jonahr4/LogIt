/**
 * LogIt — Feed Screen
 * Real data from /api/feed endpoints. Global/Following/You tabs.
 * Spatial Green v2 design: header, tab pills, large image cards
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily, LetterSpacing } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { EditLogModal } from '@/components/ui/EditLogModal';
import { EventDetailModal, type EventDetail } from '@/components/ui/EventDetailModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

import { useAuthStore } from '@/store/authStore';

const FEED_TABS = ['Global', 'Following', 'You'] as const;
type FeedTab = (typeof FEED_TABS)[number];

// Map tab to API endpoint path
const TAB_ENDPOINTS: Record<FeedTab, string> = {
  Global: '/api/feed/global',
  Following: '/api/feed/following',
  You: '/api/feed/me',
};

/** Map a feed card from API response to EventDetail for modals */
function feedCardToEventDetail(card: any): EventDetail {
  const event = card.event || {};
  const meta = event.type_metadata || {};
  const eventType = meta.league || event.event_type || 'Custom';

  return {
    id: card.log_id,
    user: {
      name: card.user ? `@${card.user.username}` : '@unknown',
      avatar: card.user?.avatar_url || '',
    },
    timeAgo: card.logged_at ? timeAgo(card.logged_at) : '',
    title: event.title || 'Untitled',
    venue: event.venue_name || '',
    venueCity: event.venue_city || '',
    venueState: event.venue_state || '',
    date: event.event_date
      ? new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '',
    eventType,
    // Sports metadata
    homeTeamName: meta.home_team_name,
    awayTeamName: meta.away_team_name,
    homeTeamLogo: meta.home_team_logo,
    awayTeamLogo: meta.away_team_logo,
    homeScore: meta.home_score,
    awayScore: meta.away_score,
    league: meta.league,
    season: meta.season,
    sport: meta.sport,
    status: event.status,
    // Log data
    privacy: card.privacy,
    rating: card.rating || 0,
    note: card.notes || '',
    photos: (card.photos || []).map((p: any) => ({ id: p.id || '', url: p.url, firebase_path: p.firebase_path || '', display_order: p.display_order })),
    companions: (card.companions || []).map((c: any) => ({ name: c.name })),
    rootedTeam: card.rooted_team || null,
  };
}

/** Get event type icon */
function getEventIcon(eventType: string): React.ComponentProps<typeof Ionicons>['name'] {
  const t = eventType?.toLowerCase() || '';
  if (t.includes('nba') || t.includes('wnba') || t.includes('ncaa') && t.includes('basketball')) return 'basketball-outline';
  if (t.includes('nfl') || t.includes('ncaaf') || t.includes('football')) return 'american-football-outline';
  if (t.includes('mlb') || t.includes('baseball')) return 'baseball-outline';
  if (t.includes('nhl') || t.includes('hockey')) return 'ice-cream-outline';
  if (t === 'movie' || t === 'movies') return 'film-outline';
  if (t === 'concert' || t === 'concerts') return 'musical-notes-outline';
  if (t === 'restaurant' || t === 'food_drinks' || t === 'food & drinks') return 'restaurant-outline';
  if (t === 'theater' || t === 'theatre') return 'ticket-outline';
  if (t === 'sports') return 'trophy-outline';
  return 'calendar-outline';
}

/** Get secondary pill (score, runtime, etc.) */
function getSecondaryPill(card: any): { text: string; color: string } | null {
  const meta = card.event?.type_metadata || {};
  if (meta.home_score != null && meta.away_score != null) {
    return { text: `${meta.away_score} - ${meta.home_score}`, color: '#FF8A3D' };
  }
  return null;
}

/** Format time ago */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}D AGO`;
  const weeks = Math.floor(days / 7);
  return `${weeks}W AGO`;
}

export default function FeedScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<FeedTab>('Global');
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [editEvent, setEditEvent] = useState<EventDetail | null>(null);

  // Feed data state
  const [feedData, setFeedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 20;

  const fetchFeed = useCallback(async (tab: FeedTab, reset = true) => {
    try {
      if (reset) {
        setIsLoading(true);
        setError(null);
      }

      const currentOffset = reset ? 0 : offset;
      const response = await api.get<any>(TAB_ENDPOINTS[tab], {
        limit: String(LIMIT),
        offset: String(currentOffset),
      });

      const newCards = response.data || [];

      if (reset) {
        setFeedData(newCards);
        setOffset(LIMIT);
      } else {
        setFeedData(prev => [...prev, ...newCards]);
        setOffset(prev => prev + LIMIT);
      }

      setHasMore(response.pagination?.has_more || false);
    } catch (err: any) {
      console.warn('Feed fetch error:', err);
      if (reset) {
        setError(err?.error?.message || 'Failed to load feed');
        setFeedData([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [offset]);

  // Fetch on mount and tab change
  useEffect(() => {
    fetchFeed(activeTab, true);
  }, [activeTab]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchFeed(activeTab, true);
  }, [activeTab, fetchFeed]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    fetchFeed(activeTab, false);
  }, [activeTab, fetchFeed, isLoadingMore, hasMore]);

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 200;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  /** Empty state per tab */
  const renderEmptyState = () => {
    if (isLoading) return null;

    const configs: Record<FeedTab, { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; subtitle: string }> = {
      Global: { icon: 'earth-outline', title: 'No public logs yet', subtitle: 'Be the first to log an event!' },
      Following: { icon: 'people-outline', title: 'No friend activity', subtitle: 'Add friends to see their logs here' },
      You: { icon: 'bookmarks-outline', title: 'No logs yet', subtitle: 'Start logging events to see them here' },
    };

    const config = configs[activeTab];

    return (
      <View style={styles.emptyState}>
        <GlassCard borderRadius={24} style={styles.emptyCard}>
          <Ionicons name={config.icon} size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>{config.title}</Text>
          <Text style={styles.emptySubtitle}>{config.subtitle}</Text>
        </GlassCard>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageHeader title="Feed" />

      {/* STICKY HEADER — tab pills */}
      <View style={styles.stickyHeader}>
        <GlassCard borderRadius={999} style={styles.tabContainer}>
          {FEED_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </GlassCard>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primaryContainer}
          />
        }
      >
        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primaryContainer} />
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <GlassCard borderRadius={16} style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
          </GlassCard>
        )}

        {/* Empty state */}
        {!isLoading && !error && feedData.length === 0 && renderEmptyState()}

        {/* Feed cards */}
        {feedData.map((card) => (
          <FeedCard
            key={card.log_id}
            card={card}
            onPress={() => setSelectedEvent(feedCardToEventDetail(card))}
          />
        ))}

        {/* Load more indicator */}
        {isLoadingMore && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.primaryContainer} />
          </View>
        )}

        {/* Bottom spacer for floating nav */}
        <View style={{ height: 140 }} />
      </ScrollView>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(ev) => setEditEvent(ev)}
      />

      <EditLogModal
        visible={!!editEvent}
        event={editEvent}
        onClose={() => setEditEvent(null)}
        onSave={(data) => {
          console.log('Saved log:', data);
          setEditEvent(null);
          handleRefresh();
        }}
      />

    </SafeAreaView>
  );
}

function FeedCard({
  card,
  onPress,
}: {
  card: any;
  onPress: () => void;
}) {
  const event = card.event || {};
  const meta = event.type_metadata || {};
  const eventType = meta.league || event.event_type || 'Custom';
  const eventIcon = getEventIcon(eventType);
  const pill = getSecondaryPill(card);
  const userAvatar = card.user?.avatar_url;
  const username = card.user?.username ? `@${card.user.username}` : 'Unknown';
  const eventTitle = event.title || 'Untitled';
  const venueName = event.venue_name || '';
  const rating = card.rating || 0;
  const notes = card.notes || '';
  const loggedAt = card.logged_at ? timeAgo(card.logged_at) : '';

  // Use first photo as card image, or event image, or a fallback
  const photos = (card.photos || []).map((p: any) => p.url || p);
  const cardImage = photos[0] || event.image_url || meta.home_team_logo;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <GlassCard borderRadius={32} style={styles.card}>
        <View style={styles.cardInner}>
          {/* User info */}
          <View style={styles.cardHeader}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarFallbackText}>
                  {card.user?.display_name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.cardUserText}>
                <Text style={styles.cardUsername}>{username} </Text>
                <Text style={styles.cardAction}>logged this</Text>
              </Text>
              <Text style={styles.cardTime}>{loggedAt}</Text>
            </View>
          </View>

          {/* Large image */}
          {cardImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: cardImage }} style={styles.cardImage} />

              {/* Gradient overlay with info */}
              <View style={styles.imageOverlay}>
                <Text style={styles.cardTitle}>{eventTitle}</Text>
                <View style={styles.imageBottom}>
                  <Text style={styles.cardVenue}>{venueName.toUpperCase()}</Text>
                  <View style={styles.starsRow}>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const threshold = i + 1;
                      const iconName = rating >= threshold
                        ? 'star' as const
                        : rating >= threshold - 0.5
                          ? 'star-half' as const
                          : 'star-outline' as const;
                      return (
                        <Ionicons key={`star-${i}`} name={iconName} size={14} color={rating > i ? '#facc15' : Colors.textMuted} />
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Event type pill (top left) */}
              <View style={styles.eventPill}>
                <Ionicons name={eventIcon} size={13} color="#fff" />
                <Text style={styles.eventPillText}>{eventType.toUpperCase()}</Text>
              </View>

              {/* Secondary pill (top right) — score */}
              {pill && (
                <View style={[styles.scorePill, { borderColor: `${pill.color}35` }]}>
                  <Text style={[styles.scoreText, { color: pill.color }]}>{pill.text}</Text>
                </View>
              )}
            </View>
          ) : (
            /* No image fallback — title card */
            <GlassCard borderRadius={24} style={styles.noImageCard}>
              <Ionicons name={eventIcon} size={32} color={Colors.primaryContainer} />
              <Text style={styles.noImageTitle}>{eventTitle}</Text>
              <Text style={styles.noImageVenue}>{venueName}</Text>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const threshold = i + 1;
                  const iconName = rating >= threshold
                    ? 'star' as const
                    : rating >= threshold - 0.5
                      ? 'star-half' as const
                      : 'star-outline' as const;
                  return (
                    <Ionicons key={`star-${i}`} name={iconName} size={14} color={rating > i ? '#facc15' : Colors.textMuted} />
                  );
                })}
              </View>
            </GlassCard>
          )}

          {/* Note */}
          {notes ? (
            <Text style={styles.noteText} numberOfLines={2}>{notes}</Text>
          ) : null}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },

  // Sticky header — matches logbook/explore
  stickyHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 6,
    gap: 4,
  },
  tabPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  tabPillActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  tabText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: LetterSpacing.wide,
  },
  tabTextActive: {
    color: Colors.primaryContainer,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.textMuted,
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  errorText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: '#ff6b6b',
    flex: 1,
  },

  // Empty state
  emptyState: {
    paddingTop: 40,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 18,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Card
  card: {
    padding: 4,
    overflow: 'hidden',
  },
  cardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 28,
    padding: 16,
    gap: 14,
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  avatarFallback: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 16,
    color: Colors.primaryContainer,
  },
  cardUserText: {
    fontSize: 13,
  },
  cardUsername: {
    fontFamily: FontFamily.bodyMedium,
    color: Colors.text,
  },
  cardAction: {
    fontFamily: FontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  cardTime: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Image
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 60,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 22,
    color: '#fff',
    marginBottom: 4,
  },
  imageBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardVenue: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },

  // Overlay pills
  eventPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  eventPillText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 2,
    color: '#fff',
  },
  scorePill: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 61, 0.35)',
  },
  scoreText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 13,
    letterSpacing: 2,
    color: '#FF8A3D',
  },

  // No image fallback
  noImageCard: {
    alignItems: 'center',
    padding: 28,
    gap: 8,
  },
  noImageTitle: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 20,
    color: Colors.text,
    textAlign: 'center',
  },
  noImageVenue: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Note
  noteText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
});
