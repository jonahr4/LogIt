/**
 * LogIt — GlassCard Component
 * Spatial-green-v2 glass panel: dark translucent bg, subtle border, shadow
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle, type ViewProps } from 'react-native';
import { Colors, Shadows } from '@/constants/colors';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
  /** Slightly darker variant for nested glass surfaces */
  variant?: 'default' | 'inset';
}

export function GlassCard({
  children,
  borderRadius = 24,
  style,
  variant = 'default',
  ...rest
}: GlassCardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === 'inset' && styles.inset,
        { borderRadius },
        Shadows.card,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  inset: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    shadowOpacity: 0,
    elevation: 0,
  },
});
