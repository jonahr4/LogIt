/**
 * Log It — Welcome Screen
 * First screen: app branding, tagline, CTA
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Atmospheric glow */}
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      <View style={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Text style={styles.logoIcon}>🏟️</Text>
          <Text style={styles.logoText}>Log It</Text>
          <Text style={styles.tagline}>Log the events you live.</Text>
        </View>

        {/* Feature highlights */}
        <View style={styles.features}>
          <FeatureItem icon="🎫" text="Track every event you attend" />
          <FeatureItem icon="📊" text="Build your personal logbook" />
          <FeatureItem icon="🌍" text="Discover what others are logging" />
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/sign-up')}
            size="lg"
          />
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

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
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
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  glowCircle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
  },
  glowCircle2: {
    position: 'absolute',
    top: 200,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(103, 156, 255, 0.06)',
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: 80,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  logoText: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: 12,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  features: {
    gap: 20,
    paddingVertical: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
  },
  ctas: {
    gap: 8,
  },
});
