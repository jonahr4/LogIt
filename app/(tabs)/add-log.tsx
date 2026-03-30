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
  useWindowDimensions,
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

const SUPPORTED_SPORTS = [
  { key: 'nba', label: 'NBA', icon: 'basketball-outline' as const, active: true },
  { key: 'nfl', label: 'NFL', icon: 'american-football-outline' as const, active: false },
  { key: 'mlb', label: 'MLB', icon: 'baseball-outline' as const, active: false },
  { key: 'nhl', label: 'NHL', icon: 'snow-outline' as const, active: false },
] as const;

const NBA_TEAMS = [
  { name: 'Atlanta Hawks',           short: 'Hawks',       abbrev: 'atl' },
  { name: 'Boston Celtics',          short: 'Celtics',     abbrev: 'bos' },
  { name: 'Brooklyn Nets',           short: 'Nets',        abbrev: 'bkn' },
  { name: 'Charlotte Hornets',       short: 'Hornets',     abbrev: 'cha' },
  { name: 'Chicago Bulls',           short: 'Bulls',       abbrev: 'chi' },
  { name: 'Cleveland Cavaliers',     short: 'Cavs',        abbrev: 'cle' },
  { name: 'Dallas Mavericks',        short: 'Mavs',        abbrev: 'dal' },
  { name: 'Denver Nuggets',          short: 'Nuggets',     abbrev: 'den' },
  { name: 'Detroit Pistons',         short: 'Pistons',     abbrev: 'det' },
  { name: 'Golden State Warriors',   short: 'Warriors',    abbrev: 'gs'  },
  { name: 'Houston Rockets',         short: 'Rockets',     abbrev: 'hou' },
  { name: 'Indiana Pacers',          short: 'Pacers',      abbrev: 'ind' },
  { name: 'Los Angeles Clippers',    short: 'Clippers',    abbrev: 'lac' },
  { name: 'Los Angeles Lakers',      short: 'Lakers',      abbrev: 'lal' },
  { name: 'Memphis Grizzlies',       short: 'Grizzlies',   abbrev: 'mem' },
  { name: 'Miami Heat',              short: 'Heat',        abbrev: 'mia' },
  { name: 'Milwaukee Bucks',         short: 'Bucks',       abbrev: 'mil' },
  { name: 'Minnesota Timberwolves',  short: 'Wolves',      abbrev: 'min' },
  { name: 'New Orleans Pelicans',    short: 'Pelicans',    abbrev: 'no'  },
  { name: 'New York Knicks',         short: 'Knicks',      abbrev: 'ny'  },
  { name: 'Oklahoma City Thunder',   short: 'Thunder',     abbrev: 'okc' },
  { name: 'Orlando Magic',           short: 'Magic',       abbrev: 'orl' },
  { name: 'Philadelphia 76ers',      short: '76ers',       abbrev: 'phi' },
  { name: 'Phoenix Suns',            short: 'Suns',        abbrev: 'phx' },
  { name: 'Portland Trail Blazers',  short: 'Blazers',     abbrev: 'por' },
  { name: 'Sacramento Kings',        short: 'Kings',       abbrev: 'sac' },
  { name: 'San Antonio Spurs',       short: 'Spurs',       abbrev: 'sa'  },
  { name: 'Toronto Raptors',         short: 'Raptors',     abbrev: 'tor' },
  { name: 'Utah Jazz',               short: 'Jazz',        abbrev: 'utah'},
  { name: 'Washington Wizards',      short: 'Wizards',     abbrev: 'wsh' },
].map(t => ({
  ...t,
  logo: `https://a.espncdn.com/i/teamlogos/nba/500/${t.abbrev}.png`,
}));

export default function AddLogScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [selectedEventToLog, setSelectedEventToLog] = useState<any>(null);

  // Sports browse state
  const [sportsStep, setSportsStep] = useState<'hub' | 'teams' | 'search'>('hub');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  // Real API search state
  const [searchResults, setSearchResults] = useState<EventSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 40;
  const { width: screenWidth } = useWindowDimensions();
  // 3-column team grid: screen - horizontal padding (32) - 2 gaps (24) / 3
  const teamTileWidth = (screenWidth - 32 - 24) / 3;

  // Fully reset sports browse + search state
  const resetAll = useCallback(() => {
    setSelectedType(null);
    setSportsStep('hub');
    setSelectedSport(null);
    setActiveSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setHasMore(false);
    setCurrentOffset(0);
  }, []);

  // ─── Debounced search ────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (text: string) => {
      setActiveSearchQuery(text);
      setSearchError(null);
      setHasMore(false);
      setCurrentOffset(0);

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
          const params: Record<string, string> = {
            q: text.trim(),
            limit: String(PAGE_SIZE),
            offset: '0',
          };
          if (selectedType && selectedType !== 'custom') {
            params.event_type = selectedType;
          }

          const response = await api.get<{
            data: EventSearchResult[];
            meta: { count: number; query: string; has_more: boolean };
          }>('/api/events/search', params);

          setSearchResults(response.data || []);
          setHasMore(response.meta?.has_more ?? false);
          setCurrentOffset(PAGE_SIZE);
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

  // ─── Load more ───────────────────────────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !activeSearchQuery) return;
    setIsLoadingMore(true);
    try {
      const params: Record<string, string> = {
        q: activeSearchQuery.trim(),
        limit: String(PAGE_SIZE),
        offset: String(currentOffset),
      };
      if (selectedType && selectedType !== 'custom') {
        params.event_type = selectedType;
      }
      const response = await api.get<{
        data: EventSearchResult[];
        meta: { count: number; query: string; has_more: boolean };
      }>('/api/events/search', params);
      setSearchResults(prev => [...prev, ...(response.data || [])]);
      setHasMore(response.meta?.has_more ?? false);
      setCurrentOffset(prev => prev + PAGE_SIZE);
    } catch (err: any) {
      console.error('Load more error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeSearchQuery, currentOffset, isLoadingMore, selectedType]);

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

  // ─── Immediate search for team tap (no debounce) ─────────────────────
  const searchTeamGames = useCallback(async (teamName: string) => {
    setActiveSearchQuery(teamName);
    setSearchError(null);
    setHasMore(false);
    setCurrentOffset(0);
    setSearchResults([]);
    setIsSearching(true);
    try {
      const response = await api.get<{
        data: EventSearchResult[];
        meta: { count: number; query: string; has_more: boolean };
      }>('/api/events/search', {
        q: teamName,
        event_type: 'sports',
        limit: String(PAGE_SIZE),
        offset: '0',
      });
      setSearchResults(response.data || []);
      setHasMore(response.meta?.has_more ?? false);
      setCurrentOffset(PAGE_SIZE);
    } catch (err: any) {
      setSearchError(err?.error?.message || 'Search failed.');
    } finally {
      setIsSearching(false);
    }
  }, [PAGE_SIZE]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Log New</Text>

        {/* ── TYPE GRID ─────────────────────────────────────────────── */}
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
                      setSportsStep('hub');
                    }
                  }}
                >
                  <GlassCard borderRadius={24} style={styles.eventTypeCard}>
                    <View style={styles.eventTypeIconCircle}>
                      <Ionicons name={type.icon} size={26} color={Colors.primaryContainer} />
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

        ) : selectedType === 'sports' && sportsStep === 'hub' ? (
          /* ── SPORTS HUB ─────────────────────────────────────────── */
          <View style={styles.apiSearchContainer}>
            <TouchableOpacity onPress={resetAll} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
              <Text style={styles.backButtonText}>Back to types</Text>
            </TouchableOpacity>

            <Text style={styles.apiSearchTitle}>Sports</Text>
            <Text style={styles.apiSearchSubtitle}>Search for a game or browse by sport.</Text>

            {/* Search All Games button */}
            <TouchableOpacity
              style={styles.searchAllButton}
              activeOpacity={0.75}
              onPress={() => setSportsStep('search')}
            >
              <Ionicons name="search" size={20} color={Colors.primaryContainer} />
              <Text style={styles.searchAllText}>Search All Games</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.primaryContainer} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            {/* Sport rows */}
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>BROWSE BY SPORT</Text>
            <View style={styles.sportRowsContainer}>
              {SUPPORTED_SPORTS.map((sport) => (
                <TouchableOpacity
                  key={sport.key}
                  activeOpacity={sport.active ? 0.7 : 1}
                  onPress={() => {
                    if (!sport.active) return;
                    setSelectedSport(sport.key);
                    setSportsStep('teams');
                  }}
                >
                  <View style={[styles.sportRow, !sport.active && styles.sportRowInactive]}>
                    <View style={styles.sportRowIcon}>
                      <Ionicons name={sport.icon} size={20} color={sport.active ? Colors.primaryContainer : Colors.textMuted} />
                    </View>
                    <Text style={[styles.sportRowLabel, !sport.active && { color: Colors.textMuted }]}>
                      {sport.label}
                    </Text>
                    {'badge' in sport && sport.active ? null
                    : !sport.active ? (
                      <Text style={styles.sportSoonText}>Soon</Text>
                    ) : null}
                    {sport.active && (
                      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        ) : selectedType === 'sports' && sportsStep === 'teams' ? (
          /* ── TEAM GRID ───────────────────────────────────────────── */
          <View style={styles.apiSearchContainer}>
            <TouchableOpacity onPress={() => setSportsStep('hub')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
              <Text style={styles.backButtonText}>Back to sports</Text>
            </TouchableOpacity>

            <Text style={styles.apiSearchTitle}>
              {selectedSport?.toUpperCase() ?? 'NBA'} Teams
            </Text>
            <Text style={styles.apiSearchSubtitle}>Tap a team to see their games.</Text>

            <View style={styles.teamsGrid}>
              {NBA_TEAMS.map((team) => (
                <TouchableOpacity
                  key={team.abbrev}
                  activeOpacity={0.7}
                  style={[styles.teamTile, { width: teamTileWidth, height: teamTileWidth }]}
                  onPress={() => {
                    setSportsStep('search');
                    searchTeamGames(team.name);
                  }}
                >
                  <Image
                    source={{ uri: team.logo }}
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.teamShortName} numberOfLines={1}>{team.short}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        ) : (
          /* ── SEARCH VIEW (sports pre-filled or generic) ────────── */
          <View style={styles.apiSearchContainer}>
            <TouchableOpacity
              onPress={() => {
                if (selectedType === 'sports' && selectedSport) {
                  // came from team tap → back to team list
                  setSportsStep('teams');
                  setActiveSearchQuery('');
                  setSearchResults([]);
                } else if (selectedType === 'sports') {
                  // came from search all → back to hub
                  setSportsStep('hub');
                  setActiveSearchQuery('');
                  setSearchResults([]);
                } else {
                  resetAll();
                }
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
              <Text style={styles.backButtonText}>
                {selectedType === 'sports' && selectedSport ? 'Back to teams'
                  : selectedType === 'sports' ? 'Back to sports'
                  : 'Back to types'}
              </Text>
            </TouchableOpacity>

            {/* Team browse header: show team name + count instead of search bar */}
            {selectedType === 'sports' && selectedSport && activeSearchQuery ? (
              <View style={styles.teamBrowseHeader}>
                <Text style={styles.apiSearchTitle}>
                  {NBA_TEAMS.find(t => t.name === activeSearchQuery)?.short ?? activeSearchQuery}
                </Text>
                {isSearching && (
                  <ActivityIndicator size="small" color={Colors.primaryContainer} />
                )}
              </View>
            ) : (
              <>
                <Text style={styles.apiSearchTitle}>
                  {`Find your ${EVENT_TYPES.find(t => t.key === selectedType)?.label.slice(0, -1) ?? ''}`}
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
              </>
            )}

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
                // Days until — matches logbook getDaysUntil exactly
                const daysUntilLabel = (() => {
                  if (event.status !== 'upcoming' || !event.event_date) return null;
                  const target = new Date(event.event_date).setHours(0, 0, 0, 0);
                  const now = new Date().setHours(0, 0, 0, 0);
                  const diffTime = target - now;
                  if (diffTime <= 0) return 'TODAY';
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays === 1) return 'TOMORROW';
                  return `IN ${diffDays} DAYS`;
                })();
                const scoreLabel = meta?.home_score != null && event.status !== 'upcoming'
                  ? `${meta.away_score} – ${meta.home_score}` : null;
                const shortAway = meta?.away_team_name?.trim().split(' ').slice(-1)[0] || meta?.away_team_name || '';
                const shortHome = meta?.home_team_name?.trim().split(' ').slice(-1)[0] || meta?.home_team_name || '';
                const displayTitle = isSports && shortAway && shortHome
                  ? `${shortAway} vs ${shortHome}` : event.title;

                return (
                  <TouchableOpacity
                    key={event.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedEventToLog(mapEventForModal(event))}
                  >
                    <GlassCard borderRadius={16} style={styles.apiResultCard}>
                      {isSports ? (
                        /* ── Sports card ── */
                        <>
                          {/* Away team logo on glassy dark bg (matches logbook style) */}
                          <View style={styles.searchLogoContainer}>
                            {meta?.home_team_logo ? (
                              <Image source={{ uri: meta.home_team_logo }} style={{ width: '72%', height: '72%' }} resizeMode="contain" />
                            ) : (
                              <Text style={styles.logoFallbackText}>{meta?.home_team_name?.charAt(0) || '?'}</Text>
                            )}
                          </View>

                          <View style={styles.apiResultInfo}>
                            {/* Title row — name left, pill right (matches logbook) */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                              <Text style={[styles.teamNamesText, { flex: 1 }]} numberOfLines={1}>{displayTitle}</Text>
                              {scoreLabel ? (
                                <View style={styles.scoreBugAddLog}>
                                  <Text style={styles.scoreBugText}>{scoreLabel}</Text>
                                </View>
                              ) : daysUntilLabel ? (
                                <View style={styles.daysUntilPill}>
                                  <Text style={styles.daysUntilText}>{daysUntilLabel}</Text>
                                </View>
                              ) : null}
                            </View>
                            {/* Date · venue · league */}
                            <Text style={styles.apiResultSub} numberOfLines={1}>
                              {dateStr}{event.venue_name ? ` · ${event.venue_name}` : ''}{meta?.league ? ` · ${meta.league}` : ''}
                            </Text>
                          </View>
                        </>
                      ) : (
                        /* ── Non-sports card ── */
                        <>
                          <Ionicons name="checkmark-circle-outline" size={24} color={Colors.primaryContainer} />
                          <View style={styles.apiResultInfo}>
                            <Text style={styles.apiResultTitle}>{event.title}</Text>
                            <Text style={styles.apiResultSub}>{getResultSubtitle(event)}</Text>
                          </View>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>{event.status === 'completed' ? 'Final' : event.status === 'in_progress' ? 'Live' : 'Upcoming'}</Text>
                          </View>
                        </>
                      )}
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Load More button */}
            {hasMore && !isSearching && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                activeOpacity={0.7}
                onPress={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore
                  ? <ActivityIndicator size="small" color={Colors.primaryContainer} />
                  : <Text style={styles.loadMoreText}>Load More Results</Text>}
              </TouchableOpacity>
            )}

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
  searchLogoContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 14, 23, 0.9)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scoreBugAddLog: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 61, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  scoreBugText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 12,
    color: '#FF8A3D',
    letterSpacing: 0.4,
  },
  daysUntilPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.4)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  daysUntilText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 12,
    color: Colors.primaryContainer,
    letterSpacing: 0.4,
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
  loadMoreButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.25)',
    marginTop: 4,
    minWidth: 140,
    alignItems: 'center',
  },
  loadMoreText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.primaryContainer,
    letterSpacing: 0.3,
  },

  // ── Sports Hub ─────────────────────────────────────────────────────
  searchAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.25)',
    marginTop: 16,
  },
  searchAllText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.primaryContainer,
    flex: 1,
  },

  // ── Sport rows ─────────────────────────────────────────────────────
  sportRowsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sportRowInactive: {
    opacity: 0.45,
  },
  sportRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportRowLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  sportLiveBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.3)',
  },
  sportLiveBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: Colors.primaryContainer,
    letterSpacing: 1,
  },
  sportSoonText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  // ── Teams grid ─────────────────────────────────────────────────────
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  teamTile: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 8,
  },
  teamLogo: {
    width: 52,
    height: 52,
  },
  teamShortName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  teamBrowseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teamEventCount: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textMuted,
  },
});

