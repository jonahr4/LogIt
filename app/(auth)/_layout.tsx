/**
 * Log It — Auth Group Layout
 */

import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { OrbBackground } from '@/components/ui/OrbBackground';

export default function AuthLayout() {
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
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack>
    </View>
  );
}
