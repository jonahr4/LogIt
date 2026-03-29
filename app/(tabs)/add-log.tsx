/**
 * LogIt — Add Log Screen
 * Spatial Green v2: "Log New" header, glass search input, type-specific editors
 * Now connected to real Supabase data via /api/events/search and /api/logs/create
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { EditLogModal } from '@/components/ui/EditLogModal';
import { api } from '@/lib/api';
import type { EventSearchResult } from '@/types/event';

const EVENT_TYPES = [
  { key: 'sports', icon: 'basketball-outline' as const, label: 'Sports' },
  { key: 'movie', icon: 'film-outline' as const, label: 'Movies' },
  { key: 'concert', icon: 'musical-notes-outline' as const, label: 'Concerts' },
  { key: 'restaurant', icon: 'restaurant-outline' as const, label: 'Restaurants' },
  { key: 'nightlife', icon: 'wine-outline' as const, label: 'Nightlife' },
  { key: 'custom', icon: 'create-outline' as const, label: 'Custom' },
] as const;

export default function AddLogScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [selectedEventToLog, setSelectedEventToLog] = useState<any>(null);

  // Real API search state
  const [searchResults, setSearchResults] = useState<EventSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Debounced search ────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (text: string) => {
      setActiveSearchQuery(text);
      setSearchError(null);

      // Clear previous timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Don't search for very short queries
      if (text.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      // Debounce 500ms
      debounceTimer.current = setTimeout(async () => {
        try {
          const params: Record<string, string> = { q: text.trim() };
          if (selectedType && selectedType !== 'custom') {
            params.event_type = selectedType;
          }

          const response = await api.get<{
            data: EventSearchResult[];
            meta: { count: number; query: string };
          }>('/api/events/search', params);

          setSearchResults(response.data || []);
          setSearchError(null);
        } catch (err: any) {
          console.error('Search error:', err);
          setSearchError(err?.error?.message || 'Search failed. Try again.');
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 500);
    },
    [selectedType]
  );

  // ─── Map search result to EditLogModal event format ──────────────────
  const mapEventForModal = (event: EventSearchResult) => {
    const mapped: any = {
      id: event.id,
      title: event.title,
      eventType: event.event_type,
      venue: event.venue_name || '',
      venueCity: event.venue_city || '',
      venueState: event.venue_state || '',
      date: event.event_date
        ? new Date(event.event_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
      status: event.status,
    };

    // Add sports-specific fields
    if (event.type_metadata) {
      mapped.sport = event.type_metadata.sport;
      mapped.league = event.type_metadata.league;
      mapped.season = event.type_metadata.season;
      mapped.homeTeamName = event.type_metadata.home_team_name;
      mapped.awayTeamName = event.type_metadata.away_team_name;
      mapped.homeScore = event.type_metadata.home_score;
      mapped.awayScore = event.type_metadata.away_score;
    }

    return mapped;
  };

  // ─── Save handler — create log via API ───────────────────────────────
  const handleSaveLog = async (data: any) => {
    if (!selectedEventToLog?.id) {
      console.log('Manual/fallback log (no event_id):', data);
      setSelectedEventToLog(null);
      setSelectedType(null);
      setActiveSearchQuery('');
      setSearchResults([]);
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/api/logs/create', {
        event_id: selectedEventToLog.id,
        notes: data.note || null,
        privacy: data.privacy || 'public',
        rating: data.rating || null,
        companions: data.companions || [],
      });
      console.log('Log created successfully!');
    } catch (err: any) {
      const code = err?.error?.code || err?.code || '';
      if (code === 'CONFLICT') {
        Alert.alert('Already Logged', 'You have already logged this event!');
      } else if (code === 'UNAUTHORIZED') {
        Alert.alert('Sign In Required', 'Please sign in to log events.');
      } else {
        Alert.alert('Error', 'Failed to save your log. Please try again.');
      }
      console.error('Save log error:', err);
    } finally {
      setIsSaving(false);
      setSelectedEventToLog(null);
      setSelectedType(null);
      setActiveSearchQuery('');
      setSearchResults([]);
    }
  };

  // ─── Helper: subtitle text for result cards ──────────────────────────
  const getResultSubtitle = (event: EventSearchResult) => {
    const parts: string[] = [];
    if (event.event_date) {
      parts.push(
        new Date(event.event_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    }
    if (event.venue_city) {
      parts.push(event.venue_city);
    }
    if (event.type_metadata?.league) {
      parts.push(event.type_metadata.league);
    }
    return parts.join(' · ');
  };

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
                Recent events will appear here once you start logging.
              </Text>
            </GlassCard>
          </>
        ) : (
          <View style={styles.apiSearchContainer}>
            <TouchableOpacity
              onPress={() => {
                setSelectedType(null);
                setActiveSearchQuery('');
                setSearchResults([]);
                setSearchError(null);
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
              <Text style={styles.backButtonText}>Back to types</Text>
            </TouchableOpacity>

            <Text style={styles.apiSearchTitle}>
              Find your{' '}
              {EVENT_TYPES.find((t) => t.key === selectedType)?.label.slice(0, -1)}
            </Text>
            <Text style={styles.apiSearchSubtitle}>
              Search our database to log the exact event you attended.
            </Text>

            <GlassCard borderRadius={20} style={[styles.searchBar, { marginTop: 16 }]}>
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${selectedType === 'sports' ? 'teams or games' : selectedType}...`}
                placeholderTextColor={Colors.textMuted}
                value={activeSearchQuery}
                onChangeText={handleSearchChange}
                autoFocus
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={Colors.primaryContainer} />
              ) : (
                <Ionicons name="search" size={22} color={Colors.textMuted} />
              )}
            </GlassCard>

            {/* Results */}
            <View style={styles.apiResultsList}>
              {/* Error state */}
              {searchError && (
                <GlassCard borderRadius={16} style={styles.errorCard}>
                  <Ionicons name="alert-circle-outline" size={20} color="#ff6b6b" />
                  <Text style={styles.errorText}>{searchError}</Text>
                </GlassCard>
              )}

              {/* Results header */}
              {searchResults.length > 0 && (
                <Text style={styles.sectionLabel}>
                  {searchResults.length} RESULT{searchResults.length !== 1 ? 'S' : ''}
                </Text>
              )}

              {/* No results state */}
              {activeSearchQuery.length >= 2 &&
                !isSearching &&
                searchResults.length === 0 &&
                !searchError && (
                  <GlassCard borderRadius={16} style={styles.noResultsCard}>
                    <Ionicons name="search-outline" size={24} color={Colors.textMuted} />
                    <Text style={styles.noResultsText}>
                      No events found for "{activeSearchQuery}"
                    </Text>
                    <Text style={styles.noResultsHint}>
                      Try a different search or add manually below
                    </Text>
                  </GlassCard>
                )}

              {/* Result cards */}
              {searchResults.map((event) => {
                const meta = event.type_metadata;
                const isSports = !!meta?.home_team_name;
                const dateStr = event.event_date
                  ? new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '';
                const statusLabel = event.status === 'completed' ? 'Final' : event.status === 'in_progress' ? 'Live' : 'Upcoming';

                return (
                  <TouchableOpacity
                    key={event.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedEventToLog(mapEventForModal(event))}
                  >
                    <GlassCard borderRadius={16} style={styles.apiResultCard}>
                      {isSports ? (
                        /* ── Sports card: logo vs logo layout ── */
                        <>
                          {/* Venue thumbnail */}
                          {event.image_url ? (
                            <Image source={{ uri: event.image_url }} style={styles.venueThumbnail} />
                          ) : (
                            <View style={[styles.venueThumbnail, styles.venueThumbnailFallback]}>
                              <Ionicons name="business-outline" size={18} color={Colors.textMuted} />
                            </View>
                          )}

                          <View style={styles.apiResultInfo}>
                            {/* Team logos row */}
                            <View style={styles.teamsLogoRow}>
                              {meta?.home_team_logo ? (
                                <Image source={{ uri: meta.home_team_logo }} style={styles.searchTeamLogo} resizeMode="contain" />
                              ) : (
                                <View style={[styles.searchTeamLogo, styles.logoFallback]}>
                                  <Text style={styles.logoFallbackText}>{meta?.home_team_name?.charAt(0) || '?'}</Text>
                                </View>
                              )}
                              <Text style={styles.vsText}>vs</Text>
                              {meta?.away_team_logo ? (
                                <Image source={{ uri: meta.away_team_logo }} style={styles.searchTeamLogo} resizeMode="contain" />
                              ) : (
                                <View style={[styles.searchTeamLogo, styles.logoFallback]}>
                                  <Text style={styles.logoFallbackText}>{meta?.away_team_name?.charAt(0) || '?'}</Text>
                                </View>
                              )}
                              {/* Score pill */}
                              {meta?.home_score != null && event.status !== 'upcoming' && (
                                <View style={styles.searchScorePill}>
                                  <Text style={styles.searchScoreText}>
                                    {meta.home_score} - {meta.away_score}
                                  </Text>
                                </View>
                              )}
                            </View>
                            {/* Team names */}
                            <Text style={styles.teamNamesText} numberOfLines={1}>
                              {meta?.home_team_name} vs {meta?.away_team_name}
                            </Text>
                            {/* Date · venue · league */}
                            <Text style={styles.apiResultSub} numberOfLines={1}>
                              {dateStr}{event.venue_city ? ` · ${event.venue_city}` : ''}{meta?.league ? ` · ${meta.league}` : ''}
                            </Text>
                          </View>

                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                          </View>
                        </>
                      ) : (
                        /* ── Non-sports card: text layout ── */
                        <>
                          <Ionicons name="checkmark-circle-outline" size={24} color={Colors.primaryContainer} />
                          <View style={styles.apiResultInfo}>
                            <Text style={styles.apiResultTitle}>{event.title}</Text>
                            <Text style={styles.apiResultSub}>{getResultSubtitle(event)}</Text>
                          </View>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                          </View>
                        </>
                      )}
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.fallbackContainer}>
              <Text style={styles.fallbackText}>
                Can't find what you're looking for?
              </Text>
              <TouchableOpacity
                style={styles.fallbackButton}
                activeOpacity={0.7}
                onPress={() =>
                  setSelectedEventToLog({
                    eventType: selectedType,
                    isManualFallback: true,
                  })
                }
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
        onSave={handleSaveLog}
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
  apiResultScore: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.primaryContainer,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 194, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.15)',
  },
  statusBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  // Sports search card
  venueThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  venueThumbnailFallback: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamsLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  searchTeamLogo: {
    width: 22,
    height: 22,
  },
  logoFallback: {
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.textMuted,
  },
  vsText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  searchScorePill: {
    marginLeft: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  searchScoreText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 11,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  teamNamesText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
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

  // Error state
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  errorText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: '#ff6b6b',
    flex: 1,
  },

  // No results state
  noResultsCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  noResultsText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },
  noResultsHint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
