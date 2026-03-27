/**
 * LogIt — Add Log Screen
 * Spatial Green v2: search bar + category quick-starts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { OrbBackground } from '@/components/ui/OrbBackground';
import { GlassPanel } from '@/components/ui/GlassPanel';

type Category = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const CATEGORIES: Category[] = [
  { label: 'Sports', icon: 'basketball-outline' },
  { label: 'Movies', icon: 'film-outline' },
  { label: 'Concerts', icon: 'musical-notes-outline' },
  { label: 'Restaurants', icon: 'restaurant-outline' },
];

export default function AddLogScreen() {
  const [query, setQuery] = useState('');

  return (
    <View style={styles.container}>
      <OrbBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={styles.title}>Log New</Text>

          {/* Search bar */}
          <GlassPanel borderRadius={20} style={styles.searchBar}>
            <TextInput
              placeholder="Search team, game, or event..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
            <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          </GlassPanel>

          {/* Category quick-start */}
          <Text style={styles.sectionLabel}>Browse by Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.label} activeOpacity={0.85}>
                <GlassPanel borderRadius={22} style={styles.categoryCard}>
                  <View style={styles.categoryIconWrap}>
                    <Ionicons name={cat.icon} size={24} color={Colors.primaryContainer} />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </GlassPanel>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hint */}
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.hintText}>
              Search for an event, or browse categories to start logging.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
    gap: 20,
  },
  title: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 34,
    letterSpacing: -1,
    color: Colors.text,
    paddingLeft: 4,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingRight: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 18,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.text,
  },
  searchIcon: {
    marginLeft: 4,
  },

  // Categories
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    paddingLeft: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: 160,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 12,
  },
  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 255, 194, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 0.5,
  },

  // Hint
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  hintText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 20,
  },
});
