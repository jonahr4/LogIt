/**
 * LogIt — Feed Screen
 * Spatial Green v2 design: header, tab pills, large image cards
 */

import React, { useState } from 'react';
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
import { Typography, FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { OrbBackground } from '@/components/ui/OrbBackground';
import { EventDetailModal, type EventDetail } from '@/components/ui/EventDetailModal';

import { useAuthStore } from '@/store/authStore';

const FEED_TABS = ['Global', 'Following', 'You'] as const;
type FeedTab = (typeof FEED_TABS)[number];

type MockCard = EventDetail & {
  image: string;
  eventIcon: React.ComponentProps<typeof Ionicons>['name'];
  score?: string;
  timeAgo: string;
  secondaryPill?: string;
  secondaryPillColor?: string;
};

function getSecondaryPill(card: MockCard): { text: string; color: string } | null {
  const t = card.eventType?.toLowerCase() || '';
  if (card.score) return { text: card.score, color: '#FF8A3D' };
  if (t === 'movie' && card.runtime) return { text: `${card.runtime} min`, color: '#679cff' };
  if (t === 'concert' && card.genre) return { text: card.genre, color: '#ac89ff' };
  if (t === 'restaurant' && card.priceLevel) return { text: card.priceLevel, color: '#facc15' };
  if (t === 'nightlife' && card.vibe) return { text: card.vibe, color: '#00FFC2' };
  return null;
}

const MOCK_CARDS: MockCard[] = [
  // ── Sports (NBA) ──
  {
    id: '1',
    user: { name: '@jonah', avatar: 'https://i.pravatar.cc/100?img=33' },
    timeAgo: '2 hours ago',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
    title: 'Celtics vs Lakers',
    venue: 'Crypto.com Arena',
    venueCity: 'Los Angeles',
    venueState: 'CA',
    date: 'Mar 15, 2026',
    eventType: 'NBA',
    eventIcon: 'basketball-outline',
    score: '112 - 108',
    status: 'FINAL • OT',
    homeTeamName: 'Celtics',
    awayTeamName: 'Lakers',
    homeTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/Boston_Celtics.svg/1200px-Boston_Celtics.svg.png',
    awayTeamLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Los_Angeles_Lakers_logo.svg/1200px-Los_Angeles_Lakers_logo.svg.png',
    homeScore: 112,
    awayScore: 108,
    league: 'NBA',
    season: '2025-26',
    sport: 'basketball',
    privacy: 'public',
    rating: 5,
    note: 'Incredible game, went to OT! Tatum was on fire in the 4th quarter. Sat in section 301, great view of the court. The energy was electric.',
    photos: [
      'https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=400&auto=format&fit=crop',
    ],
    companions: [
      { name: 'Alex', avatar: 'https://i.pravatar.cc/100?img=1' },
      { name: 'Sarah', avatar: 'https://i.pravatar.cc/100?img=2' },
    ],
  },
  {
    id: '2',
    user: { name: '@sarah', avatar: 'https://i.pravatar.cc/100?img=5' },
    timeAgo: '5 hours ago',
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=800&auto=format&fit=crop',
    title: 'Knicks vs 76ers',
    venue: 'Madison Square Garden',
    venueCity: 'New York',
    venueState: 'NY',
    date: 'Mar 14, 2026',
    eventType: 'NBA',
    eventIcon: 'basketball-outline',
    score: '98 - 104',
    status: 'FINAL',
    homeTeamName: 'Knicks',
    awayTeamName: '76ers',
    homeTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/25/New_York_Knicks_logo.svg/1200px-New_York_Knicks_logo.svg.png',
    awayTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Philadelphia_76ers_logo.svg/1200px-Philadelphia_76ers_logo.svg.png',
    homeScore: 98,
    awayScore: 104,
    league: 'NBA',
    season: '2025-26',
    sport: 'basketball',
    privacy: 'friends',
    rating: 4,
    note: 'MSG was electric tonight. Brunson with 42 points! Lost but still an amazing atmosphere.',
    companions: [
      { name: 'Mike', avatar: 'https://i.pravatar.cc/100?img=7' },
    ],
  },
  // ── Sports (NFL) ──
  {
    id: '3',
    user: { name: '@mike', avatar: 'https://i.pravatar.cc/100?img=12' },
    timeAgo: '1 day ago',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=800&auto=format&fit=crop',
    title: 'Chiefs vs Eagles',
    venue: 'Arrowhead Stadium',
    venueCity: 'Kansas City',
    venueState: 'MO',
    date: 'Mar 12, 2026',
    eventType: 'NFL',
    eventIcon: 'american-football-outline',
    score: '31 - 24',
    status: 'FINAL',
    homeTeamName: 'Chiefs',
    awayTeamName: 'Eagles',
    homeScore: 31,
    awayScore: 24,
    league: 'NFL',
    season: '2025-26',
    sport: 'football',
    privacy: 'public',
    rating: 5,
    note: 'Mahomes threw 4 TDs. Tailgate was unreal — best BBQ I\'ve ever had. Seats were 10 rows up on the 50.',
    photos: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400&auto=format&fit=crop',
    ],
    companions: [
      { name: 'Dad' },
      { name: 'Jake', avatar: 'https://i.pravatar.cc/100?img=15' },
    ],
  },
  // ── Movie ──
  {
    id: '4',
    user: { name: '@alex', avatar: 'https://i.pravatar.cc/100?img=1' },
    timeAgo: '3 hours ago',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    title: 'Dune: Part Two',
    venue: 'AMC Lincoln Square',
    venueCity: 'New York',
    venueState: 'NY',
    date: 'Mar 14, 2026',
    eventType: 'Movie',
    eventIcon: 'film-outline',
    director: 'Denis Villeneuve',
    genre: 'Sci-Fi',
    runtime: 166,
    cast: ['Timothée Chalamet', 'Zendaya', 'Austin Butler', 'Florence Pugh'],
    watchedAt: 'IMAX',
    theaterName: 'AMC Lincoln Square',
    privacy: 'public',
    rating: 5,
    note: 'Absolutely stunning in IMAX. The sandworm riding sequence was breathtaking. Denis Villeneuve outdid himself.',
    photos: [
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400&auto=format&fit=crop',
    ],
    companions: [
      { name: 'Sarah', avatar: 'https://i.pravatar.cc/100?img=2' },
    ],
  },
  // ── Concert ──
  {
    id: '5',
    user: { name: '@maya', avatar: 'https://i.pravatar.cc/100?img=9' },
    timeAgo: '8 hours ago',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=800&auto=format&fit=crop',
    title: 'SZA',
    venue: 'Madison Square Garden',
    venueCity: 'New York',
    venueState: 'NY',
    date: 'Mar 13, 2026',
    eventType: 'Concert',
    eventIcon: 'musical-notes-outline',
    artist: 'SZA',
    tourName: 'SOS Tour',
    opener: 'Omar Apollo',
    genre: 'R&B',
    setlist: ['Kill Bill', 'Snooze', 'Shirt', 'Love Galore', 'Kiss Me More', 'Good Days'],
    privacy: 'public',
    rating: 5,
    note: 'SZA\'s vocals were insane live. She played for almost 2 hours straight. Omar Apollo opened and was incredible too.',
    photos: [
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=400&auto=format&fit=crop',
    ],
    companions: [
      { name: 'Lily', avatar: 'https://i.pravatar.cc/100?img=10' },
      { name: 'Marcus', avatar: 'https://i.pravatar.cc/100?img=11' },
    ],
  },
  // ── Restaurant ──
  {
    id: '6',
    user: { name: '@emma', avatar: 'https://i.pravatar.cc/100?img=20' },
    timeAgo: '1 day ago',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
    title: 'Carbone',
    venue: 'Carbone',
    venueCity: 'New York',
    venueState: 'NY',
    date: 'Mar 12, 2026',
    eventType: 'Restaurant',
    eventIcon: 'restaurant-outline',
    cuisine: 'Italian-American',
    priceLevel: '$$$$',
    privacy: 'public',
    rating: 4,
    note: 'Finally got a reservation. The spicy rigatoni lived up to the hype. Veal parm was unreal. Definitely going back.',
    photos: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop',
    ],
    companions: [
      { name: 'Tom', avatar: 'https://i.pravatar.cc/100?img=22' },
    ],
  },
  // ── Nightlife ──
  {
    id: '7',
    user: { name: '@jake', avatar: 'https://i.pravatar.cc/100?img=15' },
    timeAgo: '12 hours ago',
    image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=800&auto=format&fit=crop',
    title: 'Marquee NYC',
    venue: 'Marquee New York',
    venueCity: 'New York',
    venueState: 'NY',
    date: 'Mar 14, 2026',
    eventType: 'Nightlife',
    eventIcon: 'wine-outline',
    venueType: 'Club',
    vibe: 'High-Energy',
    dressCode: 'Smart Casual',
    musicGenre: 'House / EDM',
    priceLevel: '$$$',
    privacy: 'friends',
    rating: 4,
    note: 'Incredible night. DJ was spinning house all night. Great energy on the dance floor. VIP was absolutely worth it.',
    photos: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400&auto=format&fit=crop',
    ],
    companions: [
      { name: 'Alex', avatar: 'https://i.pravatar.cc/100?img=1' },
      { name: 'Maya', avatar: 'https://i.pravatar.cc/100?img=9' },
      { name: 'Chris' },
    ],
  },
  // ── Custom ──
  {
    id: '8',
    user: { name: '@jonah', avatar: 'https://i.pravatar.cc/100?img=33' },
    timeAgo: '2 days ago',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?q=80&w=800&auto=format&fit=crop',
    title: 'Graduation Day',
    venue: 'Boston University',
    venueCity: 'Boston',
    venueState: 'MA',
    date: 'May 18, 2025',
    eventType: 'Custom',
    eventIcon: 'calendar-outline',
    privacy: 'public',
    rating: 5,
    note: 'Finally walked across that stage. 4 years of hard work paid off. So grateful for everyone who came out to celebrate.',
    photos: [
      'https://images.unsplash.com/photo-1627556704302-624286467c65?q=80&w=400&auto=format&fit=crop',
    ],
    companions: [
      { name: 'Mom' },
      { name: 'Dad' },
      { name: 'Sarah', avatar: 'https://i.pravatar.cc/100?img=2' },
    ],
  },
];

export default function FeedScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<FeedTab>('Following');
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandText}>LogIt</Text>
        <TouchableOpacity style={styles.themeButton}>
          <Ionicons name="notifications-outline" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab selector pills */}
        <View style={styles.tabRow}>
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

        {/* Feed cards */}
        {MOCK_CARDS.map((card) => (
          <FeedCard key={card.id} card={card} onPress={() => setSelectedEvent(card)} />
        ))}

        {/* Bottom spacer for floating nav */}
        <View style={{ height: 140 }} />
      </ScrollView>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </SafeAreaView>
  );
}

function FeedCard({
  card,
  onPress,
}: {
  card: MockCard;
  onPress: () => void;
}) {
  const pill = getSecondaryPill(card);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <GlassCard borderRadius={32} style={styles.card}>
        <View style={styles.cardInner}>
          {/* User info */}
          <View style={styles.cardHeader}>
            <Image source={{ uri: card.user.avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.cardUserText}>
                <Text style={styles.cardUsername}>{card.user.name} </Text>
                <Text style={styles.cardAction}>logged this</Text>
              </Text>
              <Text style={styles.cardTime}>{card.timeAgo.toUpperCase()}</Text>
            </View>
          </View>

          {/* Large image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: card.image }} style={styles.cardImage} />

            {/* Gradient overlay with info */}
            <View style={styles.imageOverlay}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <View style={styles.imageBottom}>
                <Text style={styles.cardVenue}>{card.venue.toUpperCase()}</Text>
                <View style={styles.starsRow}>
                  {Array.from({ length: card.rating }).map((_, i) => (
                    <Ionicons key={i} name="star" size={14} color="#facc15" />
                  ))}
                </View>
              </View>
            </View>

            {/* Event type pill (top left) */}
            <View style={styles.eventPill}>
              <Ionicons name={card.eventIcon} size={13} color="#fff" />
              <Text style={styles.eventPillText}>{card.eventType}</Text>
            </View>

            {/* Secondary pill (top right) — type-aware */}
            {pill && (
              <View style={[styles.scorePill, { borderColor: `${pill.color}35` }]}>
                <Text style={[styles.scoreText, { color: pill.color }]}>{pill.text}</Text>
              </View>
            )}
          </View>

          {/* Note */}
          <Text style={styles.noteText} numberOfLines={2}>{card.note}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  brandText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: Colors.text,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },

  // Tab pills
  tabRow: {
    alignItems: 'center',
    marginBottom: 4,
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
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.3)',
  },
  tabText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primaryContainer,
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
