/**
 * LogIt — Welcome Screen
 * Flat orange event timeline (labels above/below), open brand,
 * gentle auto-rotating carousel with centered dots, glass CTA
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { Button } from '@/components/ui/Button';

/* ── carousel data ── */
const FEATURES = [
  {
    icon: 'ticket-outline' as const,
    title: 'Track Events',
    desc: 'Log every game, concert, and experience you attend in one place.',
  },
  {
    icon: 'book-outline' as const,
    title: 'Your Logbook',
    desc: 'Build a beautiful visual timeline of the moments that matter most.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Social Feed',
    desc: 'See what friends are logging and discover new events to attend.',
  },
  {
    icon: 'star-outline' as const,
    title: 'Rate & Review',
    desc: 'Rate your experiences, add notes, and remember every detail.',
  },
];

const SLIDE_DURATION = 6000;

/* ── orange accent ── */
const ORANGE = '#FF8A3D';
const ORANGE_GLOW = 'rgba(255, 138, 61, 0.5)';
const ORANGE_DIM = 'rgba(255, 138, 61, 0.5)';

/* ── timeline events — labels alternate above/below ── */
const TIMELINE_EVENTS = [
  { label: 'Game', position: 'top' as const },
  { label: 'Concert', position: 'bottom' as const },
  { label: 'Movie', position: 'top' as const },
  { label: 'Show', position: 'bottom' as const },
];

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();

  /* ── carousel ── */
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const advanceSlide = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setActiveIndex((prev) => (prev + 1) % FEATURES.length);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  useEffect(() => {
    const timer = setInterval(advanceSlide, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [advanceSlide]);

  const feature = FEATURES[activeIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* ─── FLAT ORANGE TIMELINE ─── */}
        <View style={styles.timelineWrap}>
          <View style={styles.timelineRow}>
            {TIMELINE_EVENTS.map((event, i) => (
              <View key={i} style={styles.timelineNode}>
                <View style={styles.timelineDot} />
                <Text
                  style={[
                    styles.timelineLabel,
                    event.position === 'top'
                      ? styles.timelineLabelTop
                      : styles.timelineLabelBottom,
                  ]}
                >
                  {event.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Connecting line behind the dots */}
          <View style={styles.timelineLine} />
        </View>

        {/* ─── BRAND — open, no box ─── */}
        <View style={styles.brandSection}>
          <Text style={styles.logoText}>LogIt</Text>
          <Text style={styles.tagline}>Log the events you live.</Text>
        </View>

        {/* ─── FEATURE CAROUSEL ─── */}
        <View style={styles.glassCard}>
          <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
            <View style={styles.slideIcon}>
              <Ionicons name={feature.icon} size={22} color={Colors.primaryContainer} />
            </View>
            <Text style={styles.slideTitle}>{feature.title}</Text>
            <Text style={styles.slideDesc}>{feature.desc}</Text>
          </Animated.View>

          {/* Centered dots */}
          <View style={styles.dotRow}>
            {FEATURES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* ─── CTA — no glass ─── */}
        <View style={styles.ctaSection}>
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/sign-up')}
            size="lg"
          />
          <View style={{ height: 8 }} />
          <Button
            title="I already have an account"
            onPress={() => router.push('/(auth)/sign-in')}
            variant="text"
            size="md"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  /* ── TIMELINE ── */
  timelineWrap: {
    position: 'relative',
    height: 80,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 8,
  },
  timelineNode: {
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ORANGE,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    zIndex: 3,
  },
  timelineLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: ORANGE_DIM,
    position: 'absolute',
    width: 70,
    textAlign: 'center',
    left: -29,
  },
  timelineLabelTop: {
    bottom: 20,
  },
  timelineLabelBottom: {
    top: 20,
  },
  timelineLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: '50%',
    marginTop: -1,
    height: 2,
    backgroundColor: ORANGE,
    opacity: 0.25,
    borderRadius: 1,
    zIndex: 1,
  },

  /* ── BRAND (open, no card) ── */
  brandSection: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  logoText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 58,
    letterSpacing: -1.5,
    color: Colors.text,
  },
  ctaSection: {
    paddingHorizontal: 4,
  },
  tagline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  /* ── GLASS CARD ── */
  glassCard: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 24,
    padding: 24,
    ...Shadows.card,
  },

  /* ── CAROUSEL SLIDE ── */
  slideContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  slideIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  slideTitle: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 18,
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  slideDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 260,
  },

  /* ── DOTS ── */
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dotActive: {
    width: 22,
    borderRadius: 4,
    backgroundColor: Colors.primaryContainer,
  },
});
