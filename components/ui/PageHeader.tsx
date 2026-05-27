/**
 * PageHeader — Shared header for all tab screens.
 * Ensures identical sizing, padding, and divider across every page.
 * Bell icon opens the SocialModal (notifications + friends).
 *
 * Usage:
 *   <PageHeader title="LogIt" />
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { SocialModal } from '@/components/ui/SocialModal';

interface Props {
  title: string;
}

export function PageHeader({ title }: Props) {
  const [showSocial, setShowSocial] = useState(false);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => setShowSocial(true)}
          activeOpacity={0.7}
        >
          <Ionicons name={'notifications-outline' as const} size={20} color={Colors.textMuted} />
          <View style={styles.unreadDot} />
        </TouchableOpacity>
      </View>

      <SocialModal visible={showSocial} onClose={() => setShowSocial(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  title: {
    ...Typography.pageHeader,
    color: Colors.text,
  },
  bellButton: {
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
