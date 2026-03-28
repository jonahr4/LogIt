/**
 * LogIt — Logbook Screen
 * Spatial Green v2: search, filter chips, compact list entries
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily, FontSize, LetterSpacing } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';


const FILTER_CHIPS = ['Sports', 'Movies', 'Concerts', 'Restaurants'] as const;

// Mock logbook entries
const MOCK_ENTRIES = [
  {
    id: '1',
    title: 'Lakers @ Celtics',
    venue: 'TD Garden',
    date: 'Feb 1',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=200&auto=format&fit=crop',
    result: 'W',
  },
  {
    id: '2',
    title: 'Knicks vs Nets',
    venue: 'Madison Square Garden',
    date: 'Jan 28',
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=200&auto=format&fit=crop',
    result: 'L',
  },
  {
    id: '3',
    title: 'Warriors @ Celtics',
    venue: 'TD Garden',
    date: 'Jan 15',
    image: 'https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?q=80&w=200&auto=format&fit=crop',
    result: 'W',
  },
];

export default function LogbookScreen() {
  const [activeFilter, setActiveFilter] = useState<string>('Sports');
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Logbook</Text>

        {/* Search bar */}
        <GlassCard borderRadius={16} style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search experiences..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </GlassCard>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTER_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              onPress={() => setActiveFilter(chip)}
              style={[
                styles.chip,
                activeFilter === chip && styles.chipActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  activeFilter === chip && styles.chipTextActive,
                ]}
              >
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Log entries */}
        <View style={styles.entriesList}>
          {MOCK_ENTRIES.map((entry) => (
            <TouchableOpacity key={entry.id} activeOpacity={0.8}>
              <GlassCard borderRadius={20} style={styles.entryCard}>
                <View style={styles.entryImageContainer}>
                  <Image source={{ uri: entry.image }} style={styles.entryImage} />
                  <View style={styles.entryImageOverlay} />
                </View>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <Text style={styles.entryMeta}>
                    {entry.venue.toUpperCase()} • {entry.date.toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.entryResult,
                    entry.result === 'L' && styles.entryResultLoss,
                  ]}
                >
                  {entry.result}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 140 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },
  title: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 36,
    letterSpacing: -1,
    color: Colors.text,
    paddingLeft: 4,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
  },

  // Filter chips
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 18,
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
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  chipTextActive: {
    color: Colors.primaryContainer,
  },

  // Entries list
  entriesList: {
    gap: 12,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingRight: 20,
    gap: 14,
  },
  entryImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  entryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  entryImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 17,
    color: Colors.text,
    marginBottom: 3,
  },
  entryMeta: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  entryResult: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 24,
    color: Colors.primaryContainer,
    textShadowColor: 'rgba(0, 255, 194, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  entryResultLoss: {
    color: Colors.error,
    textShadowColor: 'rgba(255, 113, 108, 0.4)',
  },
});
