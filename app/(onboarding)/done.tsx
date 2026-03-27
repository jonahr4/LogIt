/**
 * Log It — Onboarding Done Screen
 * Spatial Green v2: circle-in-circle motif with glow, spatial orbs
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function DoneScreen() {
  const { user } = useAuthStore();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringScaleAnim = useRef(new Animated.Value(0.6)).current;
  const ringOpacityAnim = useRef(new Animated.Value(0)).current;
  const outerRingScaleAnim = useRef(new Animated.Value(0.4)).current;
  const outerRingOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance: outer ring → inner ring → check → text
    Animated.sequence([
      // Outer ring fades in and scales
      Animated.parallel([
        Animated.timing(outerRingOpacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(outerRingScaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Inner ring
      Animated.parallel([
        Animated.timing(ringOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(ringScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Check circle
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Text
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Spatial orbs — larger for celebration */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      <View style={styles.content}>
        {/* Progress indicator — all complete */}
        <View style={styles.progress}>
          <View style={[styles.progressBar, styles.progressComplete]} />
          <View style={[styles.progressBar, styles.progressComplete]} />
          <View style={[styles.progressBar, styles.progressComplete]} />
        </View>

        <View style={styles.center}>
          {/* Circle-in-circle motif */}
          <View style={styles.circleContainer}>
            {/* Outermost ring — subtle glow ring */}
            <Animated.View
              style={[
                styles.outerRing,
                {
                  transform: [{ scale: outerRingScaleAnim }],
                  opacity: outerRingOpacityAnim,
                },
              ]}
            >
              {/* Middle ring */}
              <Animated.View
                style={[
                  styles.middleRing,
                  {
                    transform: [{ scale: ringScaleAnim }],
                    opacity: ringOpacityAnim,
                  },
                ]}
              >
                {/* Inner check circle */}
                <Animated.View
                  style={[
                    styles.checkCircle,
                    { transform: [{ scale: scaleAnim }] },
                  ]}
                >
                  <Ionicons name="checkmark" size={40} color={Colors.onPrimary} />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </View>

          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
            <Text style={styles.title}>You're All Set!</Text>
            <Text style={styles.subtitle}>
              Welcome{user?.display_name ? `, ${user.display_name}` : ''}! Start logging the events you attend.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Button
            title="Start Exploring"
            onPress={() => router.replace('/(tabs)/feed')}
            size="lg"
          />
        </Animated.View>
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
    paddingHorizontal: 28,
    paddingBottom: 24,
  },

  // Spatial orbs — celebration mode
  orb1: {
    position: 'absolute',
    top: '15%',
    left: -60,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(0, 255, 194, 0.18)',
  },
  orb2: {
    position: 'absolute',
    top: '35%',
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 255, 194, 0.12)',
  },
  orb3: {
    position: 'absolute',
    bottom: '10%',
    left: '30%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
  },

  // Progress bars — all complete
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  progressBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outline,
  },
  progressComplete: {
    backgroundColor: Colors.primaryContainer,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Circle-in-circle motif
  circleContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.15)',
    backgroundColor: 'rgba(0, 255, 194, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowPrimary,
  },
  middleRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.25)',
    backgroundColor: 'rgba(0, 255, 194, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowPrimaryStrong,
  },

  title: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 36,
    letterSpacing: -1.5,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  footer: {
    paddingTop: 24,
  },
});
