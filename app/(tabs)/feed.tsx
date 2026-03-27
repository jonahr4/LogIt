/**
 * LogIt — Feed Screen
 * Spatial Green v2: header bar, tab pills, large spatial cards
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { OrbBackground } from '@/components/ui/OrbBackground';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { TabPill } from '@/components/ui/TabPill';

const FEED_TABS = ['Global', 'Following', 'You'];

// Demo data — will be replaced with real API data
const DEMO_CARD = {
  user: { name: '@jonah', avatar: 'https://i.pravatar.cc/100?img=33' },
  timeAgo: '2 hours ago',
  title: 'Celtics vs Lakers',
  venue: 'Crypto.com Arena',
  eventType: 'NBA',
  eventIcon: 'basketball-outline' as keyof typeof Ionicons.glyphMap,
  score: '112 - 108',
  rating: 5,
  notes: '"Incredible game, went to OT! Tatum was on fire in the 4th quarter."',
  image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
};

function StarRating({ count }: { count: number }) {
  return (
    <View style={styles.stars}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          <Ionicons name="star" size={14} color="#facc15" />
        </View>
      ))}
    </View>
  );
}

export default function FeedScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(1);

  return (
    <View style={styles.container}>
      <OrbBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>LogIt</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tab pills */}
          <TabPill tabs={FEED_TABS} activeIndex={activeTab} onTabPress={setActiveTab} />

          {/* Feed card */}
          <TouchableOpacity activeOpacity={0.95}>
            <GlassPanel borderRadius={32} style={styles.card}>
              <View style={styles.cardInner}>
                {/* User row */}
                <View style={styles.userRow}>
                  <Image source={{ uri: DEMO_CARD.user.avatar }} style={styles.avatar} />
                  <View>
                    <Text style={styles.userName}>
                      {DEMO_CARD.user.name}{' '}
                      <Text style={styles.userAction}>logged this</Text>
                    </Text>
                    <Text style={styles.timeAgo}>{DEMO_CARD.timeAgo}</Text>
                  </View>
                </View>

                {/* Image block */}
                <View style={styles.imageContainer}>
                  <Image source={{ uri: DEMO_CARD.image }} style={styles.cardImage} />

                  {/* Gradient overlay text */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                    style={styles.imageOverlay}
                  >
                    <Text style={styles.cardTitle}>{DEMO_CARD.title}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardVenue}>{DEMO_CARD.venue}</Text>
                      <StarRating count={DEMO_CARD.rating} />
                    </View>
                  </LinearGradient>

                  {/* Event type pill — top left */}
                  <View style={styles.eventPill}>
                    <Ionicons name={DEMO_CARD.eventIcon} size={12} color="#fff" />
                    <Text style={styles.eventPillText}>{DEMO_CARD.eventType}</Text>
                  </View>

                  {/* Score pill — top right */}
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillText}>{DEMO_CARD.score}</Text>
                  </View>
                </View>

                {/* Notes */}
                <Text style={styles.notes}>{DEMO_CARD.notes}</Text>
              </View>
            </GlassPanel>
          </TouchableOpacity>

          {/* Empty state for other tabs */}
          {activeTab !== 1 && (
            <View style={styles.emptyState}>
              <Ionicons
                name={activeTab === 0 ? 'globe-outline' : 'person-outline'}
                size={48}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 0 ? 'Nothing here yet' : 'Your activity'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 0
                  ? 'Public logs from the community will appear here.'
                  : 'Your logged events will show up here.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  logo: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 20,
    letterSpacing: 6,
    color: Colors.primaryContainer,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 255, 194, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
    gap: 20,
  },

  // Card
  card: {
    padding: 4,
  },
  cardInner: {
    padding: 14,
    gap: 14,
  },
  userRow: {
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
  userName: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.text,
  },
  userAction: {
    fontFamily: FontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  timeAgo: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Image
  imageContainer: {
    width: '100%',
    height: 240,
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
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 60,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 22,
    color: '#fff',
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardVenue: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },

  // Pills
  eventPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventPillText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#fff',
  },
  scorePill: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scorePillText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 13,
    letterSpacing: 2,
    color: Colors.primaryContainer,
  },

  // Notes
  notes: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textMuted,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },

  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
