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

import { useAuthStore } from '@/store/authStore';

const FEED_TABS = ['Global', 'Following', 'You'] as const;
type FeedTab = (typeof FEED_TABS)[number];

// Mock data for feed cards
const MOCK_CARDS = [
  {
    id: '1',
    user: { name: '@jonah', avatar: 'https://i.pravatar.cc/100?img=33' },
    timeAgo: '2 hours ago',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
    title: 'Celtics vs Lakers',
    venue: 'Crypto.com Arena',
    eventType: 'NBA',
    eventIcon: 'basketball-outline' as const,
    score: '112 - 108',
    rating: 5,
    note: '"Incredible game, went to OT! Tatum was on fire in the 4th quarter."',
  },
  {
    id: '2',
    user: { name: '@sarah', avatar: 'https://i.pravatar.cc/100?img=5' },
    timeAgo: '5 hours ago',
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=800&auto=format&fit=crop',
    title: 'Knicks vs 76ers',
    venue: 'Madison Square Garden',
    eventType: 'NBA',
    eventIcon: 'basketball-outline' as const,
    score: '98 - 104',
    rating: 4,
    note: '"MSG was electric tonight. Brunson with 42 points!"',
  },
];

export default function FeedScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<FeedTab>('Following');

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
          <FeedCard key={card.id} card={card} />
        ))}

        {/* Bottom spacer for floating nav */}
        <View style={{ height: 140 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FeedCard({ card }: { card: (typeof MOCK_CARDS)[0] }) {
  return (
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

          {/* Score pill (top right) */}
          <View style={styles.scorePill}>
            <Text style={styles.scoreText}>{card.score}</Text>
          </View>
        </View>

        {/* Note */}
        <Text style={styles.noteText}>{card.note}</Text>
      </View>
    </GlassCard>
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
    // Simulated gradient with layered views
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
    borderColor: 'rgba(255,255,255,0.1)'
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
