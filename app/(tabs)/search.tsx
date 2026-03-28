/**
 * LogIt — Search / Explore Screen
 * Discover events logged by other users, search by type, venue, or keyword
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { EventDetailModal, type EventDetail } from '@/components/ui/EventDetailModal';

// ─── Filter chips ──────────────────────────────────────────────────────────────

const TYPE_FILTERS = [
  { key: 'all', label: 'All', icon: 'apps-outline' as const },
  { key: 'sports', label: 'Sports', icon: 'basketball-outline' as const },
  { key: 'movie', label: 'Movies', icon: 'film-outline' as const },
  { key: 'concert', label: 'Concerts', icon: 'musical-notes-outline' as const },
  { key: 'restaurant', label: 'Dining', icon: 'restaurant-outline' as const },
  { key: 'nightlife', label: 'Nightlife', icon: 'wine-outline' as const },
] as const;

// ─── Trending / mock data ──────────────────────────────────────────────────────

const TRENDING_EVENTS: EventDetail[] = [
  {
    id: 'trend-1',
    title: 'Celtics vs Lakers',
    eventType: 'NBA',
    date: 'Mar 26, 2026',
    venue: 'TD Garden',
    venueCity: 'Boston',
    venueState: 'MA',
    rating: 5,
    homeTeamName: 'Celtics',
    awayTeamName: 'Lakers',
    homeScore: 118,
    awayScore: 104,
    status: 'FINAL',
  },
  {
    id: 'trend-2',
    title: 'Dune: Part Two',
    eventType: 'movie',
    date: 'Mar 22, 2026',
    venue: 'AMC Lincoln Square',
    venueCity: 'New York',
    venueState: 'NY',
    rating: 5,
    director: 'Denis Villeneuve',
    genre: 'Sci-Fi',
    runtime: 166,
  },
  {
    id: 'trend-3',
    title: 'SZA — SOS Tour',
    eventType: 'concert',
    date: 'Mar 20, 2026',
    venue: 'Madison Square Garden',
    venueCity: 'New York',
    venueState: 'NY',
    rating: 5,
    artist: 'SZA',
    tourName: 'SOS Tour',
  },
  {
    id: 'trend-4',
    title: 'Carbone',
    eventType: 'restaurant',
    date: 'Mar 18, 2026',
    venue: 'Carbone',
    venueCity: 'New York',
    venueState: 'NY',
    rating: 5,
    cuisine: 'Italian',
    priceLevel: '$$$$',
  },
];

const RECENT_SEARCHES = ['Celtics', 'SZA', 'Carbone NYC', 'IMAX near me', 'Rooftop bars'];

// ─── Popular with friends mock data ────────────────────────────────────────────

const FRIENDS_POPULAR: (EventDetail & { friendNames: string[] })[] = [
  {
    id: 'friend-1',
    title: 'Celtics vs Knicks',
    eventType: 'NBA',
    date: 'Mar 25, 2026',
    venue: 'TD Garden',
    venueCity: 'Boston',
    venueState: 'MA',
    rating: 4,
    homeTeamName: 'Celtics',
    awayTeamName: 'Knicks',
    homeScore: 115,
    awayScore: 108,
    status: 'FINAL',
    friendNames: ['Jake', 'Mike', 'Sarah'],
  },
  {
    id: 'friend-2',
    title: 'Oppenheimer',
    eventType: 'movie',
    date: 'Mar 23, 2026',
    venue: 'Regal Union Square',
    venueCity: 'New York',
    venueState: 'NY',
    rating: 5,
    director: 'Christopher Nolan',
    genre: 'Drama',
    runtime: 180,
    friendNames: ['Emma', 'Chris'],
  },
  {
    id: 'friend-3',
    title: 'L\'Artusi',
    eventType: 'restaurant',
    date: 'Mar 21, 2026',
    venue: 'L\'Artusi',
    venueCity: 'New York',
    venueState: 'NY',
    rating: 5,
    cuisine: 'Italian',
    priceLevel: '$$$',
    friendNames: ['Jake', 'Emma', 'Mike', 'Rachel'],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);

  const filteredTrending = activeFilter === 'all'
    ? TRENDING_EVENTS
    : TRENDING_EVENTS.filter((e) => {
        const t = e.eventType?.toLowerCase() || '';
        if (activeFilter === 'sports') return ['nba', 'nfl', 'mlb', 'nhl', 'sports'].includes(t);
        if (activeFilter === 'movie') return ['movie', 'film'].includes(t);
        if (activeFilter === 'concert') return ['concert', 'music'].includes(t);
        if (activeFilter === 'restaurant') return ['restaurant', 'dining'].includes(t);
        if (activeFilter === 'nightlife') return ['nightlife', 'bar', 'club'].includes(t);
        return true;
      });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search bar */}
        <View style={styles.searchBarContainer}>
          <GlassCard borderRadius={20} style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events, venues, people..."
              placeholderTextColor={Colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </GlassCard>
        </View>

        {/* Type filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {TYPE_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={filter.icon}
                size={14}
                color={activeFilter === filter.key ? Colors.primaryContainer : Colors.textMuted}
              />
              <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent searches (when empty) */}
        {searchText.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RECENT SEARCHES</Text>
            <View style={styles.recentSearches}>
              {RECENT_SEARCHES.map((term) => (
                <TouchableOpacity
                  key={term}
                  onPress={() => setSearchText(term)}
                  style={styles.recentChip}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.recentChipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Trending / Popular events */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {searchText.length > 0 ? 'RESULTS' : '🔥 TRENDING'}
          </Text>

          {filteredTrending.map((event) => (
            <TouchableOpacity
              key={event.id}
              onPress={() => setSelectedEvent(event)}
              activeOpacity={0.7}
            >
              <GlassCard borderRadius={16} style={styles.resultCard}>
                <View style={styles.resultLeft}>
                  <View style={styles.resultIconCircle}>
                    <Ionicons name={getTypeIcon(event.eventType)} size={20} color={Colors.primaryContainer} />
                  </View>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.resultMeta}>
                    {event.venue} · {event.venueCity}, {event.venueState}
                  </Text>
                  <Text style={styles.resultDate}>{event.date}</Text>
                </View>
                <View style={styles.resultRight}>
                  <View style={styles.logCountBadge}>
                    <Ionicons name="people-outline" size={12} color={Colors.primaryContainer} />
                    <Text style={styles.logCountText}>{Math.floor(Math.random() * 50 + 5)}</Text>
                  </View>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#facc15" />
                    <Text style={styles.ratingText}>{event.rating?.toFixed(1)}</Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}

          {filteredTrending.length === 0 && (
            <GlassCard borderRadius={16} style={styles.emptyState}>
              <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No events found for this filter.</Text>
            </GlassCard>
          )}
        </View>

        {/* Popular with Friends */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>👥 POPULAR WITH FRIENDS</Text>

          {FRIENDS_POPULAR.map((event) => (
            <TouchableOpacity
              key={event.id}
              onPress={() => setSelectedEvent(event)}
              activeOpacity={0.7}
            >
              <GlassCard borderRadius={16} style={styles.resultCard}>
                <View style={styles.resultLeft}>
                  <View style={styles.resultIconCircle}>
                    <Ionicons name={getTypeIcon(event.eventType)} size={20} color={Colors.primaryContainer} />
                  </View>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.resultMeta}>
                    {event.venue} · {event.venueCity}, {event.venueState}
                  </Text>
                  <View style={styles.friendRow}>
                    <View style={styles.friendAvatars}>
                      {event.friendNames.slice(0, 3).map((name, i) => (
                        <View key={name} style={[styles.friendAvatar, { marginLeft: i > 0 ? -6 : 0 }]}>
                          <Text style={styles.friendAvatarText}>{name[0]}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.friendText}>
                      {event.friendNames.length <= 2
                        ? event.friendNames.join(' & ')
                        : `${event.friendNames[0]} + ${event.friendNames.length - 1} friends`}
                    </Text>
                  </View>
                </View>
                <View style={styles.resultRight}>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#facc15" />
                    <Text style={styles.ratingText}>{event.rating?.toFixed(1)}</Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 140 }} />
      </ScrollView>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </SafeAreaView>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getTypeIcon(eventType?: string): React.ComponentProps<typeof Ionicons>['name'] {
  const t = eventType?.toLowerCase() || '';
  if (['nba', 'nfl', 'mlb', 'nhl', 'sports'].includes(t)) return 'basketball-outline';
  if (['movie', 'film'].includes(t)) return 'film-outline';
  if (['concert', 'music'].includes(t)) return 'musical-notes-outline';
  if (['restaurant', 'dining'].includes(t)) return 'restaurant-outline';
  if (['nightlife', 'bar', 'club'].includes(t)) return 'wine-outline';
  return 'create-outline';
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 28,
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Search bar
  searchBarContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text,
    padding: 0,
  },

  // Filter chips
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  filterChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: LetterSpacing.button,
  },
  filterChipTextActive: {
    color: Colors.primaryContainer,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // Recent searches
  recentSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  recentChipText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Result card
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  resultLeft: {},
  resultIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: Colors.text,
  },
  resultMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resultDate: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  resultRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  logCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
  },
  logCountText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.primaryContainer,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#facc15',
  },

  // Empty state
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Friend cards
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  friendAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(18, 22, 32, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 9,
    color: Colors.primaryContainer,
  },
  friendText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
});
