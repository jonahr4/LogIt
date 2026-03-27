/**
 * LogIt — GlassPanel Component
 * Reusable glass-morphism card matching spatial-green-v2 design
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle, type ViewProps } from 'react-native';
import { Colors, Shadows } from '@/constants/colors';

interface GlassPanelProps extends ViewProps {
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export function GlassPanel({
  borderRadius = 24,
  style,
  children,
  ...rest
}: GlassPanelProps) {
  return (
    <View
      style={[
        styles.panel,
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
  panel: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
});
