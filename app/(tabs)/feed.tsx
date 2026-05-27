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
  TouchableWithoutFeedback,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { OrbBackground } from '@/components/ui/OrbBackground';
import { EditLogModal } from '@/components/ui/EditLogModal';
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
  if ((t === 'food_drinks' || t === 'food & drinks') && card.priceLevel) return { text: card.priceLevel, color: '#facc15' };
  if (t === 'nightlife' && card.vibe) return { text: card.vibe, color: '#00FFC2' };
  if ((t === 'theater' || t === 'theatre') && (card as any).showType) return { text: (card as any).showType, color: '#ac89ff' };
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
    score: '108 - 112',
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
    score: '104 - 98',
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
    score: '24 - 31',
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
  // ── Food & Drinks (merged restaurant + nightlife) ──
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
    eventType: 'Food & Drinks',
    eventIcon: 'restaurant-outline',
    cuisine: 'Italian-American',
    priceLevel: '$$$$',
    venueType: 'Restaurant',
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
  // ── Theater ──
  {
    id: '7',
    user: { name: '@jake', avatar: 'https://i.pravatar.cc/100?img=15' },
    timeAgo: '2 days ago',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=800&auto=format&fit=crop',
    title: 'Hamilton',
    venue: 'Richard Rodgers Theatre',
    venueCity: 'New York',
    venueState: 'NY',
    date: 'Mar 10, 2026',
    eventType: 'Theater',
    eventIcon: 'ticket-outline',
    showName: 'Hamilton',
    showType: 'Musical',
    performer: 'Broadway Cast',
    seatSection: 'Orchestra',
    privacy: 'public',
    rating: 5,
    note: 'Absolutely incredible. The Act 2 opener gave me chills. Orchestra seats were worth every penny. Lin-Manuel is a genius.',
    companions: [
      { name: 'Alex', avatar: 'https://i.pravatar.cc/100?img=1' },
      { name: 'Maya', avatar: 'https://i.pravatar.cc/100?img=9' },
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FeedTab>('Following');
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [editEvent, setEditEvent] = useState<EventDetail | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const userInitial = (user?.first_name?.[0] || user?.display_name?.[0] || user?.username?.[0] || '?').toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandText}>LogIt</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowNotifications(!showNotifications)}
            activeOpacity={0.7}
          >
            <Ionicons name={'notifications-outline' as const} size={20} color={Colors.textMuted} />
            {/* Unread badge dot */}
            <View style={styles.unreadDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerAvatarText}>{userInitial}</Text>
          </TouchableOpacity>
        </View>
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
        onEdit={(ev) => setEditEvent(ev)}
      />

      <EditLogModal
        visible={!!editEvent}
        event={editEvent}
        onClose={() => setEditEvent(null)}
        onSave={(data) => {
          console.log('Saved log:', data);
          setEditEvent(null);
        }}
      />

      {/* Notifications dropdown overlay */}
      {showNotifications && (
        <NotificationsDropdown onClose={() => setShowNotifications(false)} />
      )}
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
                  {Array.from({ length: 5 }).map((_, i) => {
                    const threshold = i + 1;
                    const r = card.rating || 0;
                    const iconName = r >= threshold
                      ? 'star' as const
                      : r >= threshold - 0.5
                        ? 'star-half' as const
                        : 'star-outline' as const;
                    return (
                      <Ionicons key={`star-${i}`} name={iconName} size={14} color={r > i ? '#facc15' : Colors.textMuted} />
                    );
                  })}
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

/* ── Notifications Modal ── */

const MOCK_NOTIFICATIONS = [
  { id: '1', icon: 'basketball-outline' as const, text: 'Celtics vs Lakers starts in 2 hours!', time: '2h ago', color: '#FF8A3D' },
  { id: '2', icon: 'camera-outline' as const, text: 'How was the game last night? Add a log!', time: '5h ago', color: '#679cff' },
  { id: '3', icon: 'person-add-outline' as const, text: '@sarah tagged you as a companion', time: '1d ago', color: '#00FFC2' },
  { id: '4', icon: 'flame-outline' as const, text: '3 friends also logged Celtics vs Lakers', time: '1d ago', color: '#ac89ff' },
  { id: '5', icon: 'trophy-outline' as const, text: "You've logged 10 events! 🎉", time: '3d ago', color: '#facc15' },
  { id: '6', icon: 'heart-outline' as const, text: '@mike liked your Dune review', time: '3d ago', color: '#ff716c' },
];

function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={notifStyles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Dropdown panel */}
      <View style={notifStyles.dropdown}>
        {/* Header */}
        <View style={notifStyles.header}>
          <Text style={notifStyles.title}>Notifications</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name={'close' as const} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Items */}
        <ScrollView
          style={notifStyles.scrollArea}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {MOCK_NOTIFICATIONS.map((item) => (
            <TouchableOpacity key={item.id} style={notifStyles.row} activeOpacity={0.6}>
              <View style={notifStyles.iconWrap}>
                <View style={[notifStyles.dot, { backgroundColor: item.color }]} />
                <View style={[notifStyles.iconCircle, { borderColor: `${item.color}30` }]}>
                  <Ionicons name={item.icon} size={16} color={item.color} />
                </View>
              </View>
              <Text style={notifStyles.text} numberOfLines={2}>
                {item.text}
              </Text>
              <Text style={notifStyles.time}>{item.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer */}
        <TouchableOpacity style={notifStyles.footer} activeOpacity={0.7}>
          <Text style={notifStyles.footerText}>View All Notifications</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const notifStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 90,
  },
  dropdown: {
    position: 'absolute',
    top: 4,
    right: 16,
    width: SCREEN_WIDTH - 48,
    maxHeight: 420,
    backgroundColor: Colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    zIndex: 100,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  title: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  scrollArea: {
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  iconWrap: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 7,
    height: 7,
    borderRadius: 4,
    zIndex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glassSurface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
  },
  time: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1,
    color: Colors.textMuted,
  },
  footer: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  footerText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.primaryContainer,
    letterSpacing: 0.3,
  },
});

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
    ...Typography.pageHeader,
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff716c',
    borderWidth: 1.5,
    borderColor: Colors.glass,
  },
  headerAvatarText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.primaryContainer,
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
