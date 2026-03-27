/**
 * Log It — Onboarding Done Screen
 * Success celebration → navigate to Feed
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function DoneScreen() {
  const { user } = useAuthStore();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Atmospheric glow */}
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      <View style={styles.content}>
        {/* Progress indicator */}
        <View style={styles.progress}>
          <View style={[styles.progressDot, styles.progressComplete]} />
          <View style={[styles.progressDot, styles.progressComplete]} />
          <View style={[styles.progressDot, styles.progressComplete]} />
        </View>

        <View style={styles.center}>
          <Animated.View
            style={[
              styles.checkCircle,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.checkIcon}>✓</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim }}>
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
  glowCircle1: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 255, 194, 0.1)',
  },
  glowCircle2: {
    position: 'absolute',
    top: '40%',
    right: '10%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(103, 156, 255, 0.08)',
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  progressDot: {
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
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  checkIcon: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.onPrimary,
  },
  title: {
    ...Typography.h1,
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
