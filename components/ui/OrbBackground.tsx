/**
 * LogIt — OrbBackground Component
 * Spatial orbs: two large green glow circles for atmospheric depth
 * Matches spatial-green-v2 .orb-1 and .orb-2
 */

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

export function OrbBackground() {
  const { width } = useWindowDimensions();
  const orbSize = width * 0.8;

  return (
    <>
      <View
        style={[
          styles.orb,
          {
            top: -orbSize * 0.2,
            left: -orbSize * 0.2,
            width: orbSize,
            height: orbSize,
            borderRadius: orbSize / 2,
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            bottom: orbSize * 0.06,
            right: -orbSize * 0.3,
            width: orbSize * 1.1,
            height: orbSize * 1.1,
            borderRadius: (orbSize * 1.1) / 2,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 255, 194, 0.12)',
    zIndex: -1,
  },
});
