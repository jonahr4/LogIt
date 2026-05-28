/**
 * PageHeader — Shared header for all tab screens.
 * Instagram-style: page name left, "LogIt" brand center, social button right.
 * Brand has a layered text-shadow glow + decorative line (green) and dots (orange).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily, LetterSpacing } from '@/constants/typography';
import { SocialModal } from '@/components/ui/SocialModal';
import { SettingsModal } from '@/components/ui/SettingsModal';

interface Props {
  title: string;
  rightAction?: React.ReactNode;
}

const ORANGE = '#FF8A3D';
const GLOW_GREEN = 'rgba(45, 212, 191,';

export function PageHeader({ title, rightAction }: Props) {
  const [showSocial, setShowSocial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <View style={styles.header}>
        {/* Left — page name */}
        <View style={styles.side}>
          <Text style={styles.pageTitle}>{title}</Text>
        </View>

        {/* Center — brand with text-glow + line decoration */}
        <View style={styles.brandWrap}>
          {/* Glow layer — same text rendered behind, blurred green */}
          <Text style={[styles.brand, styles.brandGlow]}>LogIt</Text>
          {/* Actual text on top */}
          <Text style={styles.brand}>LogIt</Text>
          {/* Mini timeline — same style as welcome screen */}
          <View style={styles.timelineWrap}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineDot} />
              <View style={styles.timelineDot} />
              <View style={styles.timelineDot} />
            </View>
            <View style={styles.timelineLine} />
          </View>
        </View>

        {/* Right — settings + social */}
        <View style={[styles.side, styles.sideRight]}>
          {rightAction}
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => setShowSettings(true)}
            activeOpacity={0.7}
          >
            <Ionicons name={'settings-outline' as const} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => setShowSocial(true)}
            activeOpacity={0.7}
          >
            <Ionicons name={'people-outline' as const} size={20} color={Colors.textMuted} />
            <View style={styles.unreadDot} />
          </TouchableOpacity>
        </View>
      </View>

      <SocialModal visible={showSocial} onClose={() => setShowSocial(false)} />
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  side: {
    flex: 1,
  },
  sideRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  pageTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 18,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },

  // Brand
  brandWrap: {
    alignItems: 'center',
  },
  brand: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 26,
    color: Colors.text,
    letterSpacing: LetterSpacing.tight,
    textAlign: 'center',
  },
  // Glow copy — positioned behind, green tinted shadow
  brandGlow: {
    position: 'absolute',
    top: 0,
    color: 'transparent',
    textShadowColor: `${GLOW_GREEN} 0.45)`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },

  // Mini timeline — mirrors welcome screen's timeline, scaled down
  timelineWrap: {
    position: 'relative',
    width: 66,
    height: 2,
    justifyContent: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 2,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ORANGE,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    zIndex: 3,
  },
  timelineLine: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: '50%',
    marginTop: -0.5,
    height: 1.5,
    backgroundColor: ORANGE,
    opacity: 0.25,
    borderRadius: 1,
    zIndex: 1,
  },

  // Social button
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff716c',
    borderWidth: 1.5,
    borderColor: Colors.glass,
  },
});
