/**
 * LogIt — Logbook Screen
 * Spatial Green v2: search, filter chips, log entry rows
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { OrbBackground } from '@/components/ui/OrbBackground';
import { GlassPanel } from '@/components/ui/GlassPanel';

const FILTER_CHIPS = [
  { label: 'Sports', active: true },
  { label: 'Movies', active: false },
  { label: 'Concerts', active: false },
  { label: 'Restaurants', active: false },
];

const DEMO_ENTRIES = [
  {
    id: '1',
    title: 'Lakers @ Celtics',
    meta: 'TD Garden • Feb 1',
    result: 'W',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Celtics vs Heat',
    meta: 'TD Garden • Jan 28',
    result: 'W',
    image: 'https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Knicks @ Celtics',
    meta: 'TD Garden • Jan 15',
    result: 'L',
    image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=200&auto=format&fit=crop',
  },
];

export default function LogbookScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <View style={styles.container}>
      <OrbBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>Logbook</Text>

          {/* Search */}
          <GlassPanel borderRadius={16} style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              placeholder="Search experiences..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </GlassPanel>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {FILTER_CHIPS.map((chip, index) => (
              <TouchableOpacity
                key={chip.label}
                onPress={() => setActiveFilter(index)}
                activeOpacity={0.7}
                style={[
                  styles.chip,
                  index === activeFilter && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    index === activeFilter && styles.chipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Log entries */}
          <View style={styles.entries}>
            {DEMO_ENTRIES.map((entry) => (
              <TouchableOpacity key={entry.id} activeOpacity={0.9}>
                <GlassPanel borderRadius={20} style={styles.entryCard}>
                  <View style={styles.entryRow}>
                    {/* Thumbnail */}
                    <View style={styles.thumbContainer}>
                      <Image source={{ uri: entry.image }} style={styles.thumb} />
                      <View style={styles.thumbOverlay} />
                    </View>

                    {/* Info */}
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryTitle}>{entry.title}</Text>
                      <Text style={styles.entryMeta}>{entry.meta}</Text>
                    </View>

                    {/* Result badge */}
                    <Text
                      style={[
                        styles.resultBadge,
                        entry.result === 'L' && styles.resultLoss,
                      ]}
                    >
                      {entry.result}
                    </Text>
                  </View>
                </GlassPanel>
              </TouchableOpacity>
            ))}
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
    gap: 16,
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
    padding: 4,
  },
  searchIcon: {
    marginLeft: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.text,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  chipActive: {
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
    borderColor: 'rgba(0, 255, 194, 0.3)',
  },
  chipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.primaryContainer,
  },

  // Entries
  entries: {
    gap: 12,
  },
  entryCard: {
    padding: 12,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingRight: 8,
  },
  thumbContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  thumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 255, 194, 0.1)',
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 17,
    color: Colors.text,
  },
  entryMeta: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginTop: 3,
  },
  resultBadge: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 24,
    color: Colors.primaryContainer,
    textShadowColor: 'rgba(0, 255, 194, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  resultLoss: {
    color: Colors.error,
    textShadowColor: 'rgba(255, 113, 108, 0.4)',
  },
});
