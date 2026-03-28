/**
 * LogIt — Add Log Screen
 * Spatial Green v2: "Log New" header, glass search input, type-specific editors
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
import { EditLogModal } from '@/components/ui/EditLogModal';


const EVENT_TYPES = [
  { key: 'sports', icon: 'basketball-outline' as const, label: 'Sports' },
  { key: 'movie', icon: 'film-outline' as const, label: 'Movies' },
  { key: 'concert', icon: 'musical-notes-outline' as const, label: 'Concerts' },
  { key: 'restaurant', icon: 'restaurant-outline' as const, label: 'Restaurants' },
  { key: 'nightlife', icon: 'wine-outline' as const, label: 'Nightlife' },
  { key: 'custom', icon: 'create-outline' as const, label: 'Custom' },
] as const;

const MOCK_API_RESULTS: Record<string, any[]> = {
  sports: [
    { id: 'api-1', title: 'Celtics vs Knicks', eventType: 'NBA', date: 'Mar 25, 2026', venue: 'TD Garden', venueCity: 'Boston', venueState: 'MA', homeTeamName: 'Celtics', awayTeamName: 'Knicks' },
    { id: 'api-2', title: 'Lakers vs Warriors', eventType: 'NBA', date: 'Mar 26, 2026', venue: 'Crypto.com Arena', venueCity: 'Los Angeles', venueState: 'CA', homeTeamName: 'Lakers', awayTeamName: 'Warriors' },
  ],
  movie: [
    { id: 'api-3', title: 'Dune: Part Two', eventType: 'movie', director: 'Denis Villeneuve', genre: 'Sci-Fi', runtime: 166 },
    { id: 'api-4', title: 'Oppenheimer', eventType: 'movie', director: 'Christopher Nolan', genre: 'Drama', runtime: 180 },
  ],
  concert: [
    { id: 'api-5', title: 'SZA — SOS Tour', eventType: 'concert', artist: 'SZA', venue: 'Madison Square Garden' },
  ],
  restaurant: [
    { id: 'api-6', title: 'Carbone', eventType: 'restaurant', cuisine: 'Italian', venueCity: 'New York', priceLevel: '$$$$' },
  ],
  nightlife: [
    { id: 'api-7', title: 'Paul\'s Casablanca', eventType: 'nightlife', venueType: 'club', vibe: 'Exclusive', venueCity: 'New York' },
  ],
};

export default function AddLogScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [selectedEventToLog, setSelectedEventToLog] = useState<any>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Log New</Text>

        {/* Event type selector OR Search Step */}
        {!selectedType ? (
          <>
            <Text style={styles.sectionLabel}>WHAT DID YOU DO?</Text>
            <View style={styles.eventTypesGrid}>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (type.key === 'custom') {
                      setSelectedEventToLog({ eventType: 'manual' });
                    } else {
                      setSelectedType(type.key);
                    }
                  }}
                >
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
                Recent events will appear here once the data pipeline is connected.
              </Text>
            </GlassCard>
          </>
        ) : (
          <View style={styles.apiSearchContainer}>
            <TouchableOpacity onPress={() => setSelectedType(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
              <Text style={styles.backButtonText}>Back to types</Text>
            </TouchableOpacity>

            <Text style={styles.apiSearchTitle}>
              Find your {EVENT_TYPES.find(t => t.key === selectedType)?.label.slice(0, -1)}
            </Text>
            <Text style={styles.apiSearchSubtitle}>
              Search our global database to log the exact event.
            </Text>

            <GlassCard borderRadius={20} style={[styles.searchBar, { marginTop: 16 }]}>
              <TextInput
                style={styles.searchInput}
                placeholder={`Search API for ${selectedType}...`}
                placeholderTextColor={Colors.textMuted}
                value={activeSearchQuery}
                onChangeText={setActiveSearchQuery}
                autoFocus
              />
              <Ionicons name="search" size={22} color={Colors.textMuted} />
            </GlassCard>

            <View style={styles.apiResultsList}>
              <Text style={styles.sectionLabel}>TOP RESULTS (MOCK API)</Text>
              {(MOCK_API_RESULTS[selectedType] || []).map((apiEvent) => (
                <TouchableOpacity
                  key={apiEvent.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedEventToLog(apiEvent);
                  }}
                >
                  <GlassCard borderRadius={16} style={styles.apiResultCard}>
                    <Ionicons name="checkmark-circle-outline" size={24} color={Colors.primaryContainer} />
                    <View style={styles.apiResultInfo}>
                      <Text style={styles.apiResultTitle}>{apiEvent.title}</Text>
                      <Text style={styles.apiResultSub}>
                        {apiEvent.date ? `${apiEvent.date} · ` : ''}{apiEvent.venueCity || apiEvent.director || apiEvent.artist || ''}
                      </Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.fallbackContainer}>
              <Text style={styles.fallbackText}>Can't find what you're looking for?</Text>
              <TouchableOpacity
                style={styles.fallbackButton}
                activeOpacity={0.7}
                onPress={() => setSelectedEventToLog({ eventType: selectedType, isManualFallback: true })}
              >
                <Text style={styles.fallbackButtonText}>Add Manually</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Edit/Create modal */}
      <EditLogModal
        visible={!!selectedEventToLog}
        eventType={selectedEventToLog?.eventType}
        mode="create"
        event={selectedEventToLog?.isManualFallback ? null : selectedEventToLog}
        onClose={() => setSelectedEventToLog(null)}
        onSave={(data) => {
          console.log('Created log:', data);
          setSelectedEventToLog(null);
          setSelectedType(null);
          setActiveSearchQuery('');
        }}
      />
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
    justifyContent: 'space-between',
    rowGap: 16,
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

  // API Search Sub-view
  apiSearchContainer: {
    marginTop: 10,
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backButtonText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.text,
  },
  apiSearchTitle: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 28,
    color: Colors.text,
  },
  apiSearchSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  apiResultsList: {
    marginTop: 24,
    gap: 12,
  },
  apiResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  apiResultInfo: {
    flex: 1,
    gap: 2,
  },
  apiResultTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.text,
  },
  apiResultSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  fallbackContainer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  fallbackText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  fallbackButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fallbackButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
  },
});
