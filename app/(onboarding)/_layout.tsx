/**
 * Log It — Onboarding Group Layout
 */

import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { OrbBackground } from '@/components/ui/OrbBackground';

export default function OnboardingLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <OrbBackground />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="done" />
      </Stack>
    </View>
  );
}
