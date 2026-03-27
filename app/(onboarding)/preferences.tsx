/**
 * Log It — Event Preferences Screen (Onboarding Step 2)
 * Choose event types + default privacy
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { EventTypes, PrivacyLevels, type EventType, type PrivacyLevel } from '@/constants/config';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

const EVENT_TYPE_CONFIG: Record<EventType, { icon: string; label: string; description: string }> = {
  sports: { icon: '🏟️', label: 'Sports', description: 'Games, matches, races' },
  movie: { icon: '🎬', label: 'Movies', description: 'Theater screenings' },
  concert: { icon: '🎵', label: 'Concerts', description: 'Shows, festivals, tours' },
  restaurant: { icon: '🍽️', label: 'Restaurants', description: 'Dining experiences' },
  manual: { icon: '✏️', label: 'Custom', description: 'Anything else' },
};

const PRIVACY_CONFIG: Record<PrivacyLevel, { icon: string; label: string; description: string }> = {
  public: { icon: '🌍', label: 'Public', description: 'Everyone can see your logs' },
  friends: { icon: '👥', label: 'Friends Only', description: 'Only friends can see your logs' },
  private: { icon: '🔒', label: 'Private', description: 'Only you can see your logs' },
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        <View style={styles.progress}>
          <View style={[styles.progressDot, styles.progressComplete]} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
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
                  <Text style={styles.typeIcon}>{config.icon}</Text>
                  <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                    {config.label}
                  </Text>
                  <Text style={styles.typeDescription}>{config.description}</Text>
                  {selected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
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
                  <Text style={styles.privacyIcon}>{config.icon}</Text>
                  <View style={styles.privacyText}>
                    <Text style={[styles.privacyLabel, selected && styles.privacyLabelSelected]}>
                      {config.label}
                    </Text>
                    <Text style={styles.privacyDescription}>{config.description}</Text>
                  </View>
                  {selected && (
                    <View style={styles.radioSelected}>
                      <View style={styles.radioInner} />
                    </View>
                  )}
                  {!selected && <View style={styles.radioUnselected} />}
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
    backgroundColor: Colors.background,
  },
  content: {
    padding: 28,
    paddingTop: 24,
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
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
    marginBottom: 32,
  },
  title: {
    ...Typography.h2,
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
    ...Typography.labelUppercase,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  sectionHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outline,
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: Colors.primaryContainer,
    backgroundColor: 'rgba(0, 253, 193, 0.08)',
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  typeLabel: {
    ...Typography.bodySemiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  typeLabelSelected: {
    color: Colors.primary,
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
  checkmarkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onPrimary,
  },
  privacyOptions: {
    gap: 12,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  privacyOptionSelected: {
    borderColor: Colors.primaryContainer,
    backgroundColor: 'rgba(0, 253, 193, 0.08)',
  },
  privacyIcon: {
    fontSize: 20,
  },
  privacyText: {
    flex: 1,
  },
  privacyLabel: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  privacyLabelSelected: {
    color: Colors.primary,
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
