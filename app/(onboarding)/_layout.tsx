/**
 * Log It — Onboarding Group Layout
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="done" />
    </Stack>
  );
}
