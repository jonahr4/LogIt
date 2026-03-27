/**
 * Log It — Welcome Screen
 * Spatial Green v2 design: orbs, glass panels, branded typography
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Spatial orbs — matching spatial-green-v2 */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <View style={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>LOG IT</Text>
          <Text style={styles.tagline}>Log the events you live.</Text>
        </View>

        {/* Feature highlights — glass cards */}
        <View style={styles.features}>
          <FeatureItem
            iconName="ticket-outline"
            text="Track every event you attend"
          />
          <FeatureItem
            iconName="book-outline"
            text="Build your personal logbook"
          />
          <FeatureItem
            iconName="globe-outline"
            text="Discover what others are logging"
          />
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

function FeatureItem({ iconName, text }: { iconName: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={iconName} size={20} color={Colors.primaryContainer} />
      </View>
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

  // Spatial orbs — large blurred green glows
  orb1: {
    position: 'absolute',
    top: -100,
    left: -80,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
  },
  orb2: {
    position: 'absolute',
    bottom: 40,
    right: -120,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    paddingTop: 100,
  },
  logoText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 40,
    letterSpacing: 8,
    color: Colors.primaryContainer,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 255, 194, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Feature cards — glass style
  features: {
    gap: 12,
    paddingVertical: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.glass,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.card,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 194, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.2)',
  },
  featureText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
  },

  // CTAs
  ctas: {
    gap: 8,
  },
});
