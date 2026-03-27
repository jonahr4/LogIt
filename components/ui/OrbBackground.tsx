/**
 * LogIt — OrbBackground Component
 * Atmospheric green orbs matching spatial-green-v2 design
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

export function OrbBackground() {
  return (
    <>
      <View style={styles.orb1} />
      <View style={styles.orb2} />
    </>
  );
}

const styles = StyleSheet.create({
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
});
