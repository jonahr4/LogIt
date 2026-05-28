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
import { Colors } from '@/constants/colors';
import { FontFamily, LetterSpacing } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { SharedModal } from '@/components/ui/SharedModal';
import { useAuthStore } from '@/store/authStore';

/* ─── Mock data for stat modals ──────────────────────────────────────── */

const MOCK_EVENTS = [
  { title: 'Celtics vs Lakers', type: 'NBA', date: 'Mar 26, 2026', rating: 5, icon: 'basketball-outline' as const, color: '#FF8A3D' },
  { title: 'Dune: Part Two', type: 'Movie', date: 'Mar 22, 2026', rating: 5, icon: 'film-outline' as const, color: '#679cff' },
  { title: 'SZA — SOS Tour', type: 'Concert', date: 'Mar 20, 2026', rating: 5, icon: 'musical-notes-outline' as const, color: '#ac89ff' },
  { title: 'Carbone', type: 'Dining', date: 'Mar 18, 2026', rating: 5, icon: 'restaurant-outline' as const, color: '#facc15' },
  { title: 'Pack vs Trojans', type: 'NCAABS', date: 'Mar 15, 2026', rating: 4, icon: 'basketball-outline' as const, color: '#FF8A3D' },
];

const MOCK_VENUES = [
  { name: 'TD Garden', city: 'Boston, MA', logs: 4, icon: 'basketball-outline' as const, color: '#FF8A3D' },
  { name: 'AMC Lincoln Square', city: 'New York, NY', logs: 2, icon: 'film-outline' as const, color: '#679cff' },
  { name: 'SoFi Stadium', city: 'Los Angeles, CA', logs: 1, icon: 'american-football-outline' as const, color: '#ac89ff' },
  { name: 'Carbone', city: 'New York, NY', logs: 1, icon: 'restaurant-outline' as const, color: '#facc15' },
];

const MOCK_TEAMS = [
  { name: 'Boston Celtics', league: 'NBA', logs: 3, color: '#00854A' },
  { name: 'NC State Wolfpack', league: 'NCAABS', logs: 2, color: '#CC0000' },
  { name: 'New England Patriots', league: 'NFL', logs: 1, color: '#002244' },
];

const MOCK_FRIENDS_LIST = [
  { name: 'Jake Wilson', username: '@jake', initial: 'J', color: '#FF8A3D', mutualEvents: 3 },
  { name: 'Emma Davis', username: '@emma', initial: 'E', color: '#facc15', mutualEvents: 2 },
  { name: 'Sarah Kim', username: '@sarah', initial: 'S', color: '#00FFC2', mutualEvents: 5 },
];

const EVENT_TYPE_BARS = [
  { type: 'Sports', count: 8, total: 15, color: '#FF8A3D', icon: 'basketball-outline' as const },
  { type: 'Movies', count: 4, total: 15, color: '#679cff', icon: 'film-outline' as const },
  { type: 'Concerts', count: 2, total: 15, color: '#ac89ff', icon: 'musical-notes-outline' as const },
  { type: 'Dining', count: 1, total: 15, color: '#facc15', icon: 'restaurant-outline' as const },
];

/* ─── Stat Detail Modal ──────────────────────────────────────────────── */

type StatModalType = 'events' | 'venues' | 'teams' | 'friends' | null;

const STAT_TITLES: Record<string, string> = { events: 'All Events', venues: 'Venues', teams: 'Teams', friends: 'Friends' };

function StatDetailModal({ type, onClose }: { type: StatModalType; onClose: () => void }) {
  return (
    <SharedModal
      visible={!!type}
      onClose={onClose}
      title={type ? STAT_TITLES[type] : ''}
      scrollPadding={{ paddingHorizontal: 16, paddingTop: 12 }}
    >
      <View style={sm.list}>
        {type === 'events' && MOCK_EVENTS.map((e, i) => (
          <View key={i} style={sm.row}>
            <View style={[sm.rowIcon, { backgroundColor: `${e.color}18` }]}>
              <Ionicons name={e.icon} size={18} color={e.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sm.rowTitle}>{e.title}</Text>
              <Text style={sm.rowSub}>{e.type} · {e.date}</Text>
            </View>
            <View style={sm.ratingPill}>
              <Ionicons name="star" size={11} color="#facc15" />
              <Text style={sm.ratingText}>{e.rating}.0</Text>
            </View>
          </View>
        ))}

        {type === 'venues' && MOCK_VENUES.map((v, i) => (
          <View key={i} style={sm.row}>
            <View style={[sm.rowIcon, { backgroundColor: `${v.color}18` }]}>
              <Ionicons name={v.icon} size={18} color={v.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sm.rowTitle}>{v.name}</Text>
              <Text style={sm.rowSub}>{v.city}</Text>
            </View>
            <Text style={sm.countText}>{v.logs} logs</Text>
          </View>
        ))}

        {type === 'teams' && MOCK_TEAMS.map((t, i) => (
          <View key={i} style={sm.row}>
            <View style={[sm.rowIcon, { backgroundColor: `${t.color}25` }]}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: t.color }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sm.rowTitle}>{t.name}</Text>
              <Text style={sm.rowSub}>{t.league}</Text>
            </View>
            <Text style={sm.countText}>{t.logs} logs</Text>
          </View>
        ))}

        {type === 'friends' && MOCK_FRIENDS_LIST.map((f, i) => (
          <View key={i} style={sm.row}>
            <View style={[sm.avatar, { backgroundColor: `${f.color}25` }]}>
              <Text style={[sm.avatarInitial, { color: f.color }]}>{f.initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sm.rowTitle}>{f.name}</Text>
              <Text style={sm.rowSub}>{f.username}</Text>
            </View>
            <Text style={sm.countText}>{f.mutualEvents} mutual</Text>
          </View>
        ))}
      </View>
    </SharedModal>
  );
}

const BORDER = 'rgba(255, 255, 255, 0.1)';

const sm = StyleSheet.create({
  list: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: BORDER },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.text, letterSpacing: 0.2 },
  rowSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(250, 204, 21, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  ratingText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: '#facc15' },
  countText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.textMuted },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headlineBold, fontSize: 16 },
});

/* ─── Profile Screen ─────────────────────────────────────────────────── */

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const [statModal, setStatModal] = useState<StatModalType>(null);

  const initials = user?.display_name
    ? user.display_name.charAt(0).toUpperCase()
    : '?';

  const STATS = [
    { label: 'Events', value: 15, key: 'events' as const },
    { label: 'Venues', value: 5, key: 'venues' as const },
    { label: 'Teams', value: 3, key: 'teams' as const },
    { label: 'Friends', value: 3, key: 'friends' as const },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageHeader title="Profile" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Compact profile header ─── */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarRing}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.displayName} numberOfLines={1}>
              {user?.display_name || 'User'}
            </Text>
            <Text style={styles.username}>
              @{user?.username || 'username'} · Member since 2026
            </Text>
          </View>
        </View>

        {/* ─── Top 4 Events ─── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>TOP 4</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.top4Row}
          >
            {TOP_4.map((item, i) => (
              <TouchableOpacity key={i} style={styles.top4Card} activeOpacity={0.7}>
                <View style={[styles.top4Icon, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.top4Title} numberOfLines={2}>{item.title}</Text>
                <View style={styles.top4Rating}>
                  <Ionicons name="star" size={10} color="#facc15" />
                  <Text style={styles.top4RatingText}>{item.rating}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ─── Inline stats row ─── */}
        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <TouchableOpacity
              key={stat.key}
              style={styles.statItem}
              onPress={() => setStatModal(stat.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.statNumber}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Event type breakdown ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>EVENT BREAKDOWN</Text>
          <GlassCard borderRadius={20} style={styles.breakdownCard}>
            {EVENT_TYPE_BARS.map((bar, i) => (
              <View key={bar.type}>
                <View style={styles.barRow}>
                  <Ionicons name={bar.icon} size={14} color={bar.color} />
                  <Text style={styles.barLabel}>{bar.type}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max((bar.count / bar.total) * 100, 8)}%`,
                          backgroundColor: bar.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barCount}>{bar.count}</Text>
                </View>
                {i < EVENT_TYPE_BARS.length - 1 && <View style={styles.barDivider} />}
              </View>
            ))}
          </GlassCard>
        </View>

        {/* ─── Stats Highlights ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>HIGHLIGHTS</Text>
          <View style={styles.highlightsGrid}>
            {STAT_HIGHLIGHTS.map((h, i) => (
              <View key={i} style={styles.highlightCard}>
                <Text style={styles.highlightEmoji}>{h.emoji}</Text>
                <Text style={styles.highlightLabel}>{h.label}</Text>
                <Text style={styles.highlightValue}>{h.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Action buttons ─── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={16} color={Colors.primaryContainer} />
            <Text style={styles.actionBtnText}>Share Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={16} color={Colors.primaryContainer} />
            <Text style={styles.actionBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <StatDetailModal type={statModal} onClose={() => setStatModal(null)} />
    </SafeAreaView>
  );
}

/* ─── Additional mock data ───────────────────────────────────────────── */

const TOP_4 = [
  { title: 'Celtics vs Lakers', icon: 'basketball-outline' as const, color: '#FF8A3D', rating: '5.0' },
  { title: 'Dune: Part Two', icon: 'film-outline' as const, color: '#679cff', rating: '5.0' },
  { title: 'SZA — SOS Tour', icon: 'musical-notes-outline' as const, color: '#ac89ff', rating: '5.0' },
  { title: 'Carbone', icon: 'restaurant-outline' as const, color: '#facc15', rating: '4.5' },
];

// 12 weeks × 7 days — 0=none, 1=one event, 2=two, 3+=three+
const ACTIVITY_WEEKS: number[][] = [
  [0,0,1,0,0,0,0], [0,1,0,0,1,0,0], [0,0,0,1,0,0,1], [1,0,0,0,0,1,0],
  [0,0,2,0,0,0,0], [0,1,0,1,0,0,0], [1,0,0,0,1,0,2], [0,0,1,0,0,1,0],
  [0,1,0,0,2,0,0], [1,0,0,1,0,0,3], [0,0,1,0,1,0,0], [0,1,0,0,0,1,0],
];

const STAT_HIGHLIGHTS = [
  { emoji: '🔥', label: 'Current streak', value: '3 events' },
  { emoji: '📍', label: 'Most visited', value: 'TD Garden (4x)' },
  { emoji: '⭐', label: 'Avg rating', value: '4.8' },
  { emoji: '🎫', label: 'First log', value: 'Jan 15, 2026' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },

  // Compact profile header
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarRing: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(45, 212, 191, 0.35)', padding: 2 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 26 },
  avatarFallback: { width: '100%', height: '100%', borderRadius: 26, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FontFamily.headlineExtraBold, fontSize: 20, color: Colors.primaryContainer },
  infoCol: { flex: 1 },
  displayName: { fontFamily: FontFamily.headlineExtraBold, fontSize: 22, letterSpacing: -0.3, color: Colors.text },
  username: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.textMuted, marginTop: 3 },

  // Stats row
  statsRow: { flexDirection: 'row', backgroundColor: Colors.glass, borderRadius: 20, borderWidth: 1, borderColor: Colors.glassBorder, paddingVertical: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNumber: { fontFamily: FontFamily.headlineExtraBold, fontSize: 22, color: Colors.text },
  statLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.5, color: Colors.textMuted, textTransform: 'uppercase' },

  // Section
  sectionWrap: { gap: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.5, color: Colors.textMuted, marginLeft: 4 },
  sectionSubtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.textMuted, marginRight: 4 },
  editLink: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.primaryContainer, marginRight: 4 },

  // Event type bars
  breakdownCard: { padding: 16, gap: 0 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  barLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.text, width: 70, letterSpacing: LetterSpacing.wide },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, opacity: 0.85 },
  barCount: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.textMuted, width: 24, textAlign: 'right' },
  barDivider: { height: 1, backgroundColor: Colors.glassBorder, marginLeft: 24 },

  // Top 4
  top4Row: { gap: 10 },
  top4Card: {
    width: 90,
    backgroundColor: Colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  top4Icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  top4Title: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  top4Rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  top4RatingText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: '#facc15',
  },

  // Activity Heatmap
  heatmapCard: { padding: 16, gap: 12 },
  heatmapGrid: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  heatmapCol: { gap: 4 },
  heatmapDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  heatmapDot0: { backgroundColor: 'rgba(255, 255, 255, 0.06)' },
  heatmapDot1: { backgroundColor: 'rgba(45, 212, 191, 0.25)' },
  heatmapDot2: { backgroundColor: 'rgba(45, 212, 191, 0.5)' },
  heatmapDot3: { backgroundColor: 'rgba(45, 212, 191, 0.85)' },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  heatmapLegendText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 9,
    color: Colors.textMuted,
  },
  heatmapLegendDot: { width: 10, height: 10 },

  // Stats Highlights
  highlightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  highlightCard: {
    width: '47%' as any,
    backgroundColor: Colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 14,
    gap: 4,
  },
  highlightEmoji: { fontSize: 20 },
  highlightLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  highlightValue: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 14,
    color: Colors.text,
  },

  // Action buttons
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(45, 212, 191, 0.25)', backgroundColor: 'rgba(45, 212, 191, 0.06)' },
  actionBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.primaryContainer, letterSpacing: 0.3 },
});
