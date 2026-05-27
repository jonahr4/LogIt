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
  { key: 'food_drinks', label: 'Food & Drinks', icon: 'restaurant-outline' as const },
  { key: 'theater', label: 'Theater', icon: 'ticket-outline' as const },
] as const;

// ─── Trending / mock data ──────────────────────────────────────────────────────

const TRENDING_EVENTS: EventDetail[] = [
  {
    id: 'trend-1',
    user: { name: '@jonah', avatar: '' },
    timeAgo: '2h ago',
    note: '',
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
    user: { name: '@alex', avatar: '' },
    timeAgo: '5h ago',
    note: '',
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
    user: { name: '@maya', avatar: '' },
    timeAgo: '1d ago',
    note: '',
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
    user: { name: '@emma', avatar: '' },
    timeAgo: '2d ago',
    note: '',
    title: 'Carbone',
    eventType: 'food_drinks',
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

// ─── Top Rated mock data ───────────────────────────────────────────────────────

const TOP_RATED = [
  { id: 'top-1', title: 'Hamilton', eventType: 'theater', venue: 'Richard Rodgers Theatre', city: 'New York', state: 'NY', rating: 4.9, logCount: 234, icon: 'ticket-outline' as const },
  { id: 'top-2', title: 'Kendrick Lamar — GNX Tour', eventType: 'concert', venue: 'SoFi Stadium', city: 'Los Angeles', state: 'CA', rating: 4.8, logCount: 189, icon: 'musical-notes-outline' as const },
  { id: 'top-3', title: 'Celtics vs Warriors', eventType: 'NBA', venue: 'TD Garden', city: 'Boston', state: 'MA', rating: 4.8, logCount: 156, icon: 'basketball-outline' as const },
  { id: 'top-4', title: 'Oppenheimer', eventType: 'movie', venue: 'AMC IMAX', city: 'New York', state: 'NY', rating: 4.7, logCount: 312, icon: 'film-outline' as const },
  { id: 'top-5', title: 'Carbone', eventType: 'food_drinks', venue: 'Carbone', city: 'New York', state: 'NY', rating: 4.9, logCount: 87, icon: 'restaurant-outline' as const },
];

const RANK_COLORS = ['#facc15', '#c0c0c0', '#cd7f32', Colors.textMuted, Colors.textMuted];

// ─── Categories mock data ──────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Sports', icon: 'basketball-outline' as const, count: '12.4k events', color: '#FF8A3D' },
  { name: 'Movies', icon: 'film-outline' as const, count: '8.2k events', color: '#679cff' },
  { name: 'Concerts', icon: 'musical-notes-outline' as const, count: '5.7k events', color: '#ac89ff' },
  { name: 'Dining', icon: 'restaurant-outline' as const, count: '3.1k events', color: '#facc15' },
  { name: 'Theater', icon: 'ticket-outline' as const, count: '1.8k events', color: '#ff716c' },
  { name: 'Custom', icon: 'create-outline' as const, count: '924 events', color: '#00FFC2' },
];

// ─── Venues Near You mock data ─────────────────────────────────────────────────

const VENUES_NEARBY = [
  { id: 'v1', name: 'TD Garden', city: 'Boston', state: 'MA', logs: 47, rating: 4.6, icon: 'basketball-outline' as const },
  { id: 'v2', name: 'Madison Square Garden', city: 'New York', state: 'NY', logs: 83, rating: 4.8, icon: 'basketball-outline' as const },
  { id: 'v3', name: 'AMC Lincoln Square', city: 'New York', state: 'NY', logs: 31, rating: 4.3, icon: 'film-outline' as const },
  { id: 'v4', name: 'Carbone', city: 'New York', state: 'NY', logs: 22, rating: 4.9, icon: 'restaurant-outline' as const },
  { id: 'v5', name: 'SoFi Stadium', city: 'Los Angeles', state: 'CA', logs: 64, rating: 4.5, icon: 'american-football-outline' as const },
  { id: 'v6', name: 'Fenway Park', city: 'Boston', state: 'MA', logs: 55, rating: 4.7, icon: 'baseball-outline' as const },
];

// ─── Popular with friends mock data ────────────────────────────────────────────

const FRIENDS_POPULAR: (EventDetail & { friendNames: string[] })[] = [
  {
    id: 'friend-1',
    user: { name: '@jake', avatar: '' },
    timeAgo: '1d ago',
    note: '',
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
    user: { name: '@emma', avatar: '' },
    timeAgo: '2d ago',
    note: '',
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
    user: { name: '@jake', avatar: '' },
    timeAgo: '3d ago',
    note: '',
    title: "L'Artusi",
    eventType: 'food_drinks',
    date: 'Mar 21, 2026',
    venue: "L'Artusi",
    venueCity: 'New York',
    venueState: 'NY',
    rating: 5,
    cuisine: 'Italian',
    priceLevel: '$$$',
    friendNames: ['Jake', 'Emma', 'Mike', 'Rachel'],
  },
  {
    id: 'friend-4',
    user: { name: '@sarah', avatar: '' },
    timeAgo: '4d ago',
    note: '',
    title: 'Wicked',
    eventType: 'theater',
    date: 'Mar 19, 2026',
    venue: 'Gershwin Theatre',
    venueCity: 'New York',
    venueState: 'NY',
    rating: 5,
    friendNames: ['Sarah', 'Alex', 'Maya'],
  },
  {
    id: 'friend-5',
    user: { name: '@mike', avatar: '' },
    timeAgo: '5d ago',
    note: '',
    title: 'Chiefs vs Bills',
    eventType: 'NFL',
    date: 'Mar 16, 2026',
    venue: 'Arrowhead Stadium',
    venueCity: 'Kansas City',
    venueState: 'MO',
    rating: 4,
    friendNames: ['Mike', 'Jake'],
  },
];

// ─── Friends' Recent Activity mock data ────────────────────────────────────────

const FRIENDS_ACTIVITY = [
  { id: 'act-1', friend: 'Jake', initial: 'J', event: 'Celtics vs Knicks', type: 'NBA', rating: 4, note: 'Incredible atmosphere at the Garden tonight. Tatum went off...', time: '2h ago', color: '#FF8A3D' },
  { id: 'act-2', friend: 'Emma', initial: 'E', event: 'Carbone', type: 'food_drinks', rating: 5, note: 'Best Italian in NYC, hands down. The spicy rigatoni is a must...', time: '5h ago', color: '#facc15' },
  { id: 'act-3', friend: 'Sarah', initial: 'S', event: 'Dune: Part Two', type: 'movie', rating: 5, note: 'IMAX was absolutely worth it. Villeneuve is a genius...', time: '8h ago', color: '#679cff' },
  { id: 'act-4', friend: 'Mike', initial: 'M', event: 'SZA — SOS Tour', type: 'concert', rating: 5, note: "Best concert I've ever been to. Her vocals were insane live...", time: '1d ago', color: '#ac89ff' },
  { id: 'act-5', friend: 'Alex', initial: 'A', event: 'Hamilton', type: 'theater', rating: 5, note: 'Act 2 opener gave me actual chills. Orchestra seats worth it...', time: '2d ago', color: '#ff716c' },
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
        if (activeFilter === 'food_drinks') return ['food_drinks', 'restaurant', 'dining', 'nightlife', 'bar', 'club'].includes(t);
        if (activeFilter === 'theater') return ['theater', 'theatre', 'broadway'].includes(t);
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

        {/* ⭐ Top Rated */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>⭐ TOP RATED</Text>
          {TOP_RATED.map((item, index) => (
            <GlassCard key={item.id} borderRadius={16} style={styles.resultCard}>
              <View style={styles.resultLeft}>
                <View style={[styles.rankCircle, { borderColor: RANK_COLORS[index] || Colors.textMuted }]}>
                  <Text style={[styles.rankText, { color: RANK_COLORS[index] || Colors.textMuted }]}>
                    #{index + 1}
                  </Text>
                </View>
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.resultMeta}>
                  {item.venue} · {item.city}, {item.state}
                </Text>
              </View>
              <View style={styles.resultRight}>
                <View style={styles.logCountBadge}>
                  <Ionicons name={'people-outline' as const} size={12} color={Colors.primaryContainer} />
                  <Text style={styles.logCountText}>{item.logCount}</Text>
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name={'star' as const} size={12} color="#facc15" />
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* 🎯 Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🎯 CATEGORIES</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.name} activeOpacity={0.7} style={styles.categoryCardWrapper}>
                <GlassCard borderRadius={16} style={styles.categoryCard}>
                  <View style={[styles.categoryAccent, { backgroundColor: cat.color }]} />
                  <View style={styles.categoryContent}>
                    <View style={[styles.categoryIconCircle, { backgroundColor: `${cat.color}18` }]}>
                      <Ionicons name={cat.icon} size={24} color={cat.color} />
                    </View>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryCount}>{cat.count}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 📍 Venues Near You */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📍 VENUES NEAR YOU</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.venueScroll}
          >
            {VENUES_NEARBY.map((venue) => (
              <GlassCard key={venue.id} borderRadius={16} style={styles.venueCard}>
                <View style={styles.venueIconRow}>
                  <View style={styles.venueIconCircle}>
                    <Ionicons name={venue.icon} size={20} color={Colors.primaryContainer} />
                  </View>
                </View>
                <Text style={styles.venueName} numberOfLines={1}>{venue.name}</Text>
                <Text style={styles.venueLocation}>{venue.city}, {venue.state}</Text>
                <View style={styles.venueBottom}>
                  <View style={styles.venueLogBadge}>
                    <Ionicons name={'bookmark-outline' as const} size={10} color={Colors.primaryContainer} />
                    <Text style={styles.venueLogText}>{venue.logs} logs</Text>
                  </View>
                  <View style={styles.venueRating}>
                    <Ionicons name={'star' as const} size={10} color="#facc15" />
                    <Text style={styles.venueRatingText}>{venue.rating.toFixed(1)}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </ScrollView>
        </View>

        {/* 👥 Popular with Friends */}
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

        {/* 🎬 Friends' Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🎬 FRIENDS' RECENT ACTIVITY</Text>

          {FRIENDS_ACTIVITY.map((activity) => (
            <GlassCard key={activity.id} borderRadius={16} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={[styles.activityAvatar, { borderColor: `${activity.color}60` }]}>
                  <Text style={[styles.activityAvatarText, { color: activity.color }]}>
                    {activity.initial}
                  </Text>
                </View>
                <View style={styles.activityHeaderInfo}>
                  <Text style={styles.activityFriendText}>
                    <Text style={styles.activityFriendName}>{activity.friend}</Text>
                    {' '}logged{' '}
                    <Text style={styles.activityEventName}>{activity.event}</Text>
                  </Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
              <View style={styles.activityBody}>
                <View style={styles.activityStars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons
                      key={`star-${i}`}
                      name={i < activity.rating ? 'star' as const : 'star-outline' as const}
                      size={12}
                      color={i < activity.rating ? '#facc15' : Colors.textMuted}
                    />
                  ))}
                </View>
                <Text style={styles.activityNote} numberOfLines={1}>{activity.note}</Text>
              </View>
            </GlassCard>
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
  if (['food_drinks', 'restaurant', 'dining', 'nightlife', 'bar', 'club'].includes(t)) return 'restaurant-outline';
  if (['theater', 'theatre', 'broadway'].includes(t)) return 'ticket-outline';
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
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.base,
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
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: LetterSpacing.wide,
  },
  filterChipTextActive: {
    color: Colors.primaryContainer,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
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
    fontFamily: FontFamily.bodyRegular,
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
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  resultMeta: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resultDate: {
    fontFamily: FontFamily.bodyRegular,
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
    fontFamily: FontFamily.bodySemiBold,
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

  // Rank circle (Top Rated)
  rankCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 16,
  },

  // Categories grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCardWrapper: {
    width: '48%' as any,
  },
  categoryCard: {
    padding: 0,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  categoryAccent: {
    width: 4,
  },
  categoryContent: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  categoryCount: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Venues
  venueScroll: {
    gap: 10,
  },
  venueCard: {
    width: 160,
    padding: 16,
    gap: 8,
  },
  venueIconRow: {
    marginBottom: 4,
  },
  venueIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  venueLocation: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  venueBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  venueLogBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
  },
  venueLogText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: Colors.primaryContainer,
  },
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  venueRatingText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: '#facc15',
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
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: Colors.primaryContainer,
  },
  friendText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Activity cards (Friends' Recent Activity)
  activityCard: {
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityAvatarText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 14,
  },
  activityHeaderInfo: {
    flex: 1,
  },
  activityFriendText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  activityFriendName: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.text,
  },
  activityEventName: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.text,
  },
  activityTime: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.textMuted,
    marginTop: 2,
  },
  activityBody: {
    paddingLeft: 46,
    gap: 4,
  },
  activityStars: {
    flexDirection: 'row',
    gap: 2,
  },
  activityNote: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
