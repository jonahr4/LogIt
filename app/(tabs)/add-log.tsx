/**
 * LogIt — Add Log Screen
 * Spatial Green v2: "Log New" header, glass search input
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';


const EVENT_TYPES = [
  { key: 'sports', icon: 'basketball-outline' as const, label: 'Sports' },
  { key: 'movie', icon: 'film-outline' as const, label: 'Movies' },
  { key: 'concert', icon: 'musical-notes-outline' as const, label: 'Concerts' },
  { key: 'restaurant', icon: 'restaurant-outline' as const, label: 'Restaurants' },
  { key: 'manual', icon: 'create-outline' as const, label: 'Custom' },
] as const;

export default function AddLogScreen() {
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Log New</Text>

        {/* Search bar */}
        <GlassCard borderRadius={20} style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search team, game, or event..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
          <Ionicons name="search" size={22} color={Colors.textMuted} />
        </GlassCard>

        {/* Event type selector */}
        <Text style={styles.sectionLabel}>WHAT DID YOU DO?</Text>
        <View style={styles.eventTypesGrid}>
          {EVENT_TYPES.map((type) => (
            <TouchableOpacity key={type.key} activeOpacity={0.7}>
              <GlassCard borderRadius={24} style={styles.eventTypeCard}>
                <View style={styles.eventTypeIconCircle}>
                  <Ionicons
                    name={type.icon}
                    size={26}
                    color={Colors.primaryContainer}
                  />
                </View>
                <Text style={styles.eventTypeLabel}>{type.label}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent section */}
        <Text style={styles.sectionLabel}>RECENT EVENTS</Text>
        <GlassCard borderRadius={20} style={styles.emptyRecent}>
          <Ionicons name="time-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyRecentText}>
            Recent events will appear here once the sports data pipeline is connected.
          </Text>
        </GlassCard>

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
    gap: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 16,
  },

  // Section labels
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    paddingLeft: 4,
    marginTop: 4,
  },

  // Event type grid
  eventTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventTypeCard: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  eventTypeIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 255, 194, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTypeLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.text,
    letterSpacing: 0.5,
  },

  // Empty state
  emptyRecent: {
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  emptyRecentText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
