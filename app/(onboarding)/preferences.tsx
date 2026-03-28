/**
 * Log It — Event Preferences Screen (Onboarding Step 2)
 * Spatial Green v2: glass cards, pulsing progress, orbs
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { EventTypes, PrivacyLevels, type EventType, type PrivacyLevel } from '@/constants/config';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

const EVENT_TYPE_CONFIG: Record<EventType, { icon: keyof typeof Ionicons.glyphMap; label: string; description: string }> = {
  sports: { icon: 'american-football-outline', label: 'Sports', description: 'Games, matches, races' },
  movie: { icon: 'film-outline', label: 'Movies', description: 'Theater screenings' },
  concert: { icon: 'musical-notes-outline', label: 'Concerts', description: 'Shows, festivals, tours' },
  restaurant: { icon: 'restaurant-outline', label: 'Restaurants', description: 'Dining experiences' },
  manual: { icon: 'create-outline', label: 'Custom', description: 'Anything else' },
};

const PRIVACY_CONFIG: Record<PrivacyLevel, { icon: keyof typeof Ionicons.glyphMap; label: string; description: string }> = {
  public: { icon: 'globe-outline', label: 'Public', description: 'Everyone can see your logs' },
  friends: { icon: 'people-outline', label: 'Friends Only', description: 'Only friends can see your logs' },
  private: { icon: 'lock-closed-outline', label: 'Private', description: 'Only you can see your logs' },
};

export default function PreferencesScreen() {
  const params = useLocalSearchParams<{
    firstName: string;
    lastName: string;
    username: string;
    displayName: string;
  }>();

  const [selectedTypes, setSelectedTypes] = useState<EventType[]>(['sports']);
  const [defaultPrivacy, setDefaultPrivacy] = useState<PrivacyLevel>('public');
  const { completeOnboarding, isLoading } = useAuthStore();

  // Pulse animation for active progress bar
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const toggleEventType = (type: EventType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding({
        username: params.username!,
        first_name: params.firstName!,
        last_name: params.lastName!,
        display_name: params.displayName!,
        event_preferences: selectedTypes,
        default_privacy: defaultPrivacy,
      });
      router.replace('/(onboarding)/done');
    } catch {
      // Error handled by store
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Spatial orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Progress indicator — green bars, active pulses */}
        <View style={styles.progress}>
          <View style={[styles.progressBar, styles.progressComplete]} />
          <Animated.View style={[styles.progressBar, styles.progressActive, { opacity: pulseAnim }]} />
          <View style={styles.progressBar} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>What Do You Log?</Text>
          <Text style={styles.subtitle}>
            Choose the types of events you attend. You can change these anytime.
          </Text>
        </View>

        {/* Event Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EVENT TYPES</Text>
          <View style={styles.grid}>
            {EventTypes.filter((t) => t !== 'manual').map((type) => {
              const config = EVENT_TYPE_CONFIG[type];
              const selected = selectedTypes.includes(type);
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeCard, selected && styles.typeCardSelected]}
                  onPress={() => toggleEventType(type)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.typeIconContainer, selected && styles.typeIconContainerSelected]}>
                    <Ionicons
                      name={config.icon}
                      size={24}
                      color={selected ? Colors.primaryContainer : Colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                    {config.label}
                  </Text>
                  <Text style={styles.typeDescription}>{config.description}</Text>
                  {selected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={14} color={Colors.onPrimary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Privacy Default */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DEFAULT PRIVACY</Text>
          <Text style={styles.sectionHint}>
            Choose who can see your logs by default. You can change this per log.
          </Text>
          <View style={styles.privacyOptions}>
            {PrivacyLevels.map((level) => {
              const config = PRIVACY_CONFIG[level];
              const selected = defaultPrivacy === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.privacyOption, selected && styles.privacyOptionSelected]}
                  onPress={() => setDefaultPrivacy(level)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.privacyIconContainer, selected && styles.privacyIconContainerSelected]}>
                    <Ionicons
                      name={config.icon}
                      size={18}
                      color={selected ? Colors.primaryContainer : Colors.textMuted}
                    />
                  </View>
                  <View style={styles.privacyText}>
                    <Text style={[styles.privacyLabel, selected && styles.privacyLabelSelected]}>
                      {config.label}
                    </Text>
                    <Text style={styles.privacyDescription}>{config.description}</Text>
                  </View>
                  {selected ? (
                    <View style={styles.radioSelected}>
                      <View style={styles.radioInner} />
                    </View>
                  ) : (
                    <View style={styles.radioUnselected} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Finish Setup"
            onPress={handleComplete}
            loading={isLoading}
          />
          <Button
            title="Skip for now"
            onPress={handleComplete}
            variant="text"
            size="sm"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 28,
    paddingTop: 16,
  },

  // Spatial orbs
  orb1: {
    position: 'absolute',
    top: -60,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
  },
  orb2: {
    position: 'absolute',
    bottom: -40,
    right: -80,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  backText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },

  // Progress bars
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outline,
  },
  progressActive: {
    backgroundColor: Colors.primaryContainer,
  },
  progressComplete: {
    backgroundColor: Colors.primary,
  },

  header: {
    marginBottom: 28,
  },
  title: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 32,
    letterSpacing: -1,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 12,
  },
  sectionHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 12,
  },

  // Event type cards — glass
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    backgroundColor: Colors.glass,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    position: 'relative',
    ...Shadows.card,
  },
  typeCardSelected: {
    borderColor: 'rgba(0, 255, 194, 0.3)',
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  typeIconContainerSelected: {
    backgroundColor: 'rgba(0, 255, 194, 0.1)',
    borderColor: 'rgba(0, 255, 194, 0.2)',
  },
  typeLabel: {
    ...Typography.bodySemiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  typeLabelSelected: {
    color: Colors.primaryContainer,
  },
  typeDescription: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Privacy options — glass cards
  privacyOptions: {
    gap: 12,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.glass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.card,
  },
  privacyOptionSelected: {
    borderColor: 'rgba(0, 255, 194, 0.3)',
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
  },
  privacyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  privacyIconContainerSelected: {
    backgroundColor: 'rgba(0, 255, 194, 0.1)',
    borderColor: 'rgba(0, 255, 194, 0.2)',
  },
  privacyText: {
    flex: 1,
  },
  privacyLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  privacyLabelSelected: {
    color: Colors.primaryContainer,
  },
  privacyDescription: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryContainer,
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.outline,
  },
  footer: {
    gap: 8,
    paddingTop: 16,
  },
});
