/**
 * LogIt — TabPill Component
 * Segmented pill selector matching spatial-green-v2 feed tabs
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';

interface TabPillProps {
  tabs: string[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}

export function TabPill({ tabs, activeIndex, onTabPress }: TabPillProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => onTabPress(index)}
              activeOpacity={0.7}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.glass,
    borderRadius: 100,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  tabActive: {
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.3)',
  },
  tabText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primaryContainer,
    fontFamily: FontFamily.bodySemiBold,
  },
});
