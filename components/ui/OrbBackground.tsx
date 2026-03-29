/**
 * LogIt — OrbBackground Component
 * Flowing green-tinted gradient background matching spatial-green-v2.html
 * Uses stacked LinearGradients for a smooth atmospheric wash
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function OrbBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top-left → center: green tinted wash */}
      <LinearGradient
        colors={[
          'rgba(0, 255, 194, 0.12)',
          'rgba(0, 255, 194, 0.04)',
          'transparent',
        ]}
        locations={[0, 0.4, 0.85]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Bottom-right → center: second green wash */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(0, 255, 194, 0.03)',
          'rgba(0, 255, 194, 0.10)',
        ]}
        locations={[0.2, 0.6, 1]}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
