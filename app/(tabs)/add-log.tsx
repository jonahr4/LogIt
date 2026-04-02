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
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { EditLogModal } from '@/components/ui/EditLogModal';
import { api } from '@/lib/api';
import type { EventSearchResult } from '@/types/event';
import { LinearGradient } from 'expo-linear-gradient';
import { uploadPhoto } from '@/lib/firebaseStorage';
import { firebaseAuth } from '@/lib/firebase';

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
  { key: 'nfl', label: 'NFL', icon: 'american-football-outline' as const, active: true },
  { key: 'mlb', label: 'MLB', icon: 'baseball-outline' as const, active: false },
  { key: 'nhl', label: 'NHL', icon: 'snow-outline' as const, active: true },
] as const;

const NBA_TEAMS = [
  { name: 'Atlanta Hawks', short: 'Hawks', abbrev: 'atl' },
  { name: 'Boston Celtics', short: 'Celtics', abbrev: 'bos' },
  { name: 'Brooklyn Nets', short: 'Nets', abbrev: 'bkn' },
  { name: 'Charlotte Hornets', short: 'Hornets', abbrev: 'cha' },
  { name: 'Chicago Bulls', short: 'Bulls', abbrev: 'chi' },
  { name: 'Cleveland Cavaliers', short: 'Cavs', abbrev: 'cle' },
  { name: 'Dallas Mavericks', short: 'Mavs', abbrev: 'dal' },
  { name: 'Denver Nuggets', short: 'Nuggets', abbrev: 'den' },
  { name: 'Detroit Pistons', short: 'Pistons', abbrev: 'det' },
  { name: 'Golden State Warriors', short: 'Warriors', abbrev: 'gs' },
  { name: 'Houston Rockets', short: 'Rockets', abbrev: 'hou' },
  { name: 'Indiana Pacers', short: 'Pacers', abbrev: 'ind' },
  { name: 'Los Angeles Clippers', short: 'Clippers', abbrev: 'lac' },
  { name: 'Los Angeles Lakers', short: 'Lakers', abbrev: 'lal' },
  { name: 'Memphis Grizzlies', short: 'Grizzlies', abbrev: 'mem' },
  { name: 'Miami Heat', short: 'Heat', abbrev: 'mia' },
  { name: 'Milwaukee Bucks', short: 'Bucks', abbrev: 'mil' },
  { name: 'Minnesota Timberwolves', short: 'Wolves', abbrev: 'min' },
  { name: 'New Orleans Pelicans', short: 'Pelicans', abbrev: 'no' },
  { name: 'New York Knicks', short: 'Knicks', abbrev: 'ny' },
  { name: 'Oklahoma City Thunder', short: 'Thunder', abbrev: 'okc' },
  { name: 'Orlando Magic', short: 'Magic', abbrev: 'orl' },
  { name: 'Philadelphia 76ers', short: '76ers', abbrev: 'phi' },
  { name: 'Phoenix Suns', short: 'Suns', abbrev: 'phx' },
  { name: 'Portland Trail Blazers', short: 'Blazers', abbrev: 'por' },
  { name: 'Sacramento Kings', short: 'Kings', abbrev: 'sac' },
  { name: 'San Antonio Spurs', short: 'Spurs', abbrev: 'sa' },
  { name: 'Toronto Raptors', short: 'Raptors', abbrev: 'tor' },
  { name: 'Utah Jazz', short: 'Jazz', abbrev: 'utah' },
  { name: 'Washington Wizards', short: 'Wizards', abbrev: 'wsh' },
].map(t => ({
  ...t,
  logo: `https://a.espncdn.com/i/teamlogos/nba/500/${t.abbrev}.png`,
}));

const NFL_TEAMS = [
  { name: 'Arizona Cardinals', short: 'Cardinals', abbrev: 'ari' },
  { name: 'Atlanta Falcons', short: 'Falcons', abbrev: 'atl' },
  { name: 'Baltimore Ravens', short: 'Ravens', abbrev: 'bal' },
  { name: 'Buffalo Bills', short: 'Bills', abbrev: 'buf' },
  { name: 'Carolina Panthers', short: 'Panthers', abbrev: 'car' },
  { name: 'Chicago Bears', short: 'Bears', abbrev: 'chi' },
  { name: 'Cincinnati Bengals', short: 'Bengals', abbrev: 'cin' },
  { name: 'Cleveland Browns', short: 'Browns', abbrev: 'cle' },
  { name: 'Dallas Cowboys', short: 'Cowboys', abbrev: 'dal' },
  { name: 'Denver Broncos', short: 'Broncos', abbrev: 'den' },
  { name: 'Detroit Lions', short: 'Lions', abbrev: 'det' },
  { name: 'Green Bay Packers', short: 'Packers', abbrev: 'gb' },
  { name: 'Houston Texans', short: 'Texans', abbrev: 'hou' },
  { name: 'Indianapolis Colts', short: 'Colts', abbrev: 'ind' },
  { name: 'Jacksonville Jaguars', short: 'Jaguars', abbrev: 'jax' },
  { name: 'Kansas City Chiefs', short: 'Chiefs', abbrev: 'kc' },
  { name: 'Las Vegas Raiders', short: 'Raiders', abbrev: 'lv' },
  { name: 'Los Angeles Chargers', short: 'Chargers', abbrev: 'lac' },
  { name: 'Los Angeles Rams', short: 'Rams', abbrev: 'lar' },
  { name: 'Miami Dolphins', short: 'Dolphins', abbrev: 'mia' },
  { name: 'Minnesota Vikings', short: 'Vikings', abbrev: 'min' },
  { name: 'New England Patriots', short: 'Patriots', abbrev: 'ne' },
  { name: 'New Orleans Saints', short: 'Saints', abbrev: 'no' },
  { name: 'New York Giants', short: 'Giants', abbrev: 'nyg' },
  { name: 'New York Jets', short: 'Jets', abbrev: 'nyj' },
  { name: 'Philadelphia Eagles', short: 'Eagles', abbrev: 'phi' },
  { name: 'Pittsburgh Steelers', short: 'Steelers', abbrev: 'pit' },
  { name: 'San Francisco 49ers', short: '49ers', abbrev: 'sf' },
  { name: 'Seattle Seahawks', short: 'Seahawks', abbrev: 'sea' },
  { name: 'Tampa Bay Buccaneers', short: 'Bucs', abbrev: 'tb' },
  { name: 'Tennessee Titans', short: 'Titans', abbrev: 'ten' },
  { name: 'Washington Commanders', short: 'Commanders', abbrev: 'wsh' },
].map(t => ({
  ...t,
  logo: `https://a.espncdn.com/i/teamlogos/nfl/500/${t.abbrev}.png`,
}));

const NHL_TEAMS = [
  { name: 'Anaheim Ducks', short: 'Ducks', abbrev: 'ana' },
  { name: 'Arizona Coyotes', short: 'Coyotes', abbrev: 'ari' },
  { name: 'Boston Bruins', short: 'Bruins', abbrev: 'bos' },
  { name: 'Buffalo Sabres', short: 'Sabres', abbrev: 'buf' },
  { name: 'Calgary Flames', short: 'Flames', abbrev: 'cgy' },
  { name: 'Carolina Hurricanes', short: 'Hurricanes', abbrev: 'car' },
  { name: 'Chicago Blackhawks', short: 'Blackhawks', abbrev: 'chi' },
  { name: 'Colorado Avalanche', short: 'Avalanche', abbrev: 'col' },
  { name: 'Columbus Blue Jackets', short: 'Blue Jackets', abbrev: 'cbj' },
  { name: 'Dallas Stars', short: 'Stars', abbrev: 'dal' },
  { name: 'Detroit Red Wings', short: 'Red Wings', abbrev: 'det' },
  { name: 'Edmonton Oilers', short: 'Oilers', abbrev: 'edm' },
  { name: 'Florida Panthers', short: 'Panthers', abbrev: 'fla' },
  { name: 'Los Angeles Kings', short: 'Kings', abbrev: 'la' },
  { name: 'Minnesota Wild', short: 'Wild', abbrev: 'min' },
  { name: 'Montreal Canadiens', short: 'Canadiens', abbrev: 'mtl' },
  { name: 'Nashville Predators', short: 'Predators', abbrev: 'nsh' },
  { name: 'New Jersey Devils', short: 'Devils', abbrev: 'nj' },
  { name: 'New York Islanders', short: 'Islanders', abbrev: 'nyi' },
  { name: 'New York Rangers', short: 'Rangers', abbrev: 'nyr' },
  { name: 'Ottawa Senators', short: 'Senators', abbrev: 'ott' },
  { name: 'Philadelphia Flyers', short: 'Flyers', abbrev: 'phi' },
  { name: 'Pittsburgh Penguins', short: 'Penguins', abbrev: 'pit' },
  { name: 'San Jose Sharks', short: 'Sharks', abbrev: 'sj' },
  { name: 'Seattle Kraken', short: 'Kraken', abbrev: 'sea' },
  { name: 'St. Louis Blues', short: 'Blues', abbrev: 'stl' },
  { name: 'Tampa Bay Lightning', short: 'Lightning', abbrev: 'tb' },
  { name: 'Toronto Maple Leafs', short: 'Maple Leafs', abbrev: 'tor' },
  { name: 'Utah Hockey Club', short: 'Utah HC', abbrev: 'uta' },
  { name: 'Vancouver Canucks', short: 'Canucks', abbrev: 'van' },
  { name: 'Vegas Golden Knights', short: 'Golden Knights', abbrev: 'vgk' },
  { name: 'Washington Capitals', short: 'Capitals', abbrev: 'wsh' },
  { name: 'Winnipeg Jets', short: 'Jets', abbrev: 'wpg' },
].map(t => ({
  ...t,
  logo: `https://a.espncdn.com/i/teamlogos/nhl/500/${t.abbrev}.png`,
}));

/** Get the team array for the selected sport */
function getTeamsForSport(sport: string | null) {
  if (sport === 'nfl') return NFL_TEAMS;
  if (sport === 'nhl') return NHL_TEAMS;
  return NBA_TEAMS; // default
}

export default function AddLogScreen() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [selectedEventToLog, setSelectedEventToLog] = useState<any>(null);

  // Sports browse state
  const [sportsStep, setSportsStep] = useState<'hub' | 'teams' | 'search'>('hub');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [teamFilterText, setTeamFilterText] = useState('');

  // Real API search state
  const [searchResults, setSearchResults] = useState<EventSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const [showSuccess, setShowSuccess] = useState(false);
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
      const newData = response.data || [];
      // Deduplicate by id
      setSearchResults(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        return [...prev, ...newData.filter(e => !existingIds.has(e.id))];
      });
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
      image: event.image_url || '',
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
      mapped.homeTeamLogo = event.type_metadata.home_team_logo;
      mapped.awayTeamLogo = event.type_metadata.away_team_logo;
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
      const response = await api.post<{ id: string }>('/api/logs/create', {
        event_id: selectedEventToLog.id,
        notes: data.note || null,
        privacy: data.privacy || 'public',
        rating: data.rating || null,
        companions: data.companions || [],
      });
      const newLogId = response.id;

      // Upload any pending photos (selected during create)
      if (data.pendingPhotos?.length && newLogId) {
        const userId = firebaseAuth.currentUser?.uid;
        if (userId) {
          await Promise.all(
            data.pendingPhotos.map(async (localUri: string, index: number) => {
              try {
                const { url, firebasePath } = await uploadPhoto(localUri, userId, newLogId);
                await api.post('/api/logs/photos', {
                  log_id: newLogId,
                  firebase_path: firebasePath,
                  url,
                  display_order: index,
                });
              } catch (photoErr) {
                console.error('Photo upload error:', photoErr);
              }
            })
          );
        }
      }

      console.log('Log created successfully!');
      // Trigger success animation + haptic
      setSelectedEventToLog(null);
      setShowSuccess(true);
      successScale.setValue(0);
      successOpacity.setValue(1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.spring(successScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowSuccess(false));
    } catch (err: any) {
      const code = err?.error?.code || err?.code || '';
      if (code === 'CONFLICT') {
        Alert.alert('Already Logged', 'You have already logged this event!');
      } else if (code === 'UNAUTHORIZED') {
        Alert.alert('Sign In Required', 'Please sign in to log events.');
      } else {
        Alert.alert('Error', 'Failed to save your log. Please try again.');
      }
      console.warn('Save log error:', err);
    } finally {
      setIsSaving(false);
      // Don't reset selectedType, selectedSport, or search — user stays where they were
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
        limit: '100',
        offset: '0',
      });
      setSearchResults(response.data || []);
      setHasMore(response.meta?.has_more ?? false);
      setCurrentOffset(100);
    } catch (err: any) {
      setSearchError(err?.error?.message || 'Search failed.');
    } finally {
      setIsSearching(false);
    }
  }, [PAGE_SIZE]);
  // Helper: whether we're in team browse mode
  const isTeamBrowsing = !!(selectedType === 'sports' && selectedSport && activeSearchQuery);

  // ─── TEAM BROWSE: split layout (fixed header + scrollable games) ────
  if (isTeamBrowsing) {
    const teamInfo = getTeamsForSport(selectedSport).find(t => t.name === activeSearchQuery);

    // Client-side filter
    const filterLower = teamFilterText.toLowerCase();
    const filtered = teamFilterText
      ? searchResults.filter(e => {
        const meta = e.type_metadata;
        return (
          e.title?.toLowerCase().includes(filterLower) ||
          meta?.home_team_name?.toLowerCase().includes(filterLower) ||
          meta?.away_team_name?.toLowerCase().includes(filterLower) ||
          meta?.round?.toLowerCase().includes(filterLower) ||
          e.venue_name?.toLowerCase().includes(filterLower)
        );
      })
      : searchResults;

    // Group by season
    const seasonsMap = new Map<string, EventSearchResult[]>();
    for (const evt of filtered) {
      const season = evt.type_metadata?.season || 'Unknown';
      if (!seasonsMap.has(season)) seasonsMap.set(season, []);
      seasonsMap.get(season)!.push(evt);
    }
    const sortedSeasons = [...seasonsMap.entries()].sort(([a], [b]) => b.localeCompare(a));

    const getPhaseLabel = (type?: number, round?: string) => {
      if (type === 1) return { label: 'Preseason', color: '#4ade80' };
      if (type === 3 || type === 5) return { label: round || 'Postseason', color: '#fb923c' };
      if (type === 4) return { label: 'Offseason', color: Colors.textMuted };
      return null;
    };

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* ── Fixed header section ────────────────────────────────── */}
        <View style={styles.teamBrowseFixedHeader}>
          <TouchableOpacity
            onPress={() => {
              setSportsStep('teams');
              setActiveSearchQuery('');
              setSearchResults([]);
              setTeamFilterText('');
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
            <Text style={styles.backButtonText}>Back to teams</Text>
          </TouchableOpacity>

          <View style={styles.teamBrowseHeader}>
            {teamInfo?.logo && (
              <Image source={{ uri: teamInfo.logo }} style={{ width: 36, height: 36 }} resizeMode="contain" />
            )}
            <Text style={styles.apiSearchTitle}>
              {teamInfo?.name ?? activeSearchQuery}
            </Text>
            {isSearching && (
              <ActivityIndicator size="small" color={Colors.primaryContainer} />
            )}
          </View>

          <GlassCard borderRadius={16} style={[styles.searchBar, { marginTop: 8, marginBottom: 0 }]}>
            <TextInput
              style={[styles.searchInput, { fontSize: 14 }]}
              placeholder="Filter games..."
              placeholderTextColor={Colors.textMuted}
              value={teamFilterText}
              onChangeText={setTeamFilterText}
            />
            <Ionicons name="filter-outline" size={18} color={Colors.textMuted} />
          </GlassCard>
        </View>

        {/* ── Scrollable game list ────────────────────────────────── */}
        {(() => {
          // Build children array and track sticky season header indices
          const scrollChildren: React.ReactNode[] = [];
          const stickyIndices: number[] = [];

          // Error / empty states
          if (searchError) {
            scrollChildren.push(
              <GlassCard key="error" borderRadius={16} style={[styles.errorCard, { marginTop: 4 }]}>
                <Ionicons name="alert-circle-outline" size={20} color="#ff6b6b" />
                <Text style={styles.errorText}>{searchError}</Text>
              </GlassCard>
            );
          }
          if (!isSearching && searchResults.length === 0 && !searchError) {
            scrollChildren.push(
              <GlassCard key="empty" borderRadius={16} style={[styles.noResultsCard, { marginTop: 4 }]}>
                <Ionicons name="search-outline" size={24} color={Colors.textMuted} />
                <Text style={styles.noResultsText}>No games found</Text>
              </GlassCard>
            );
          }

          // Flatten season groups: each season header + game cards block = 2 direct children
          for (const [season, events] of sortedSeasons) {
            events.sort((a, b) => {
              const da = a.event_date ? new Date(a.event_date).getTime() : 0;
              const db = b.event_date ? new Date(b.event_date).getTime() : 0;
              return db - da;
            });

            // Season header — mark as sticky
            stickyIndices.push(scrollChildren.length);
            scrollChildren.push(
              <View key={`header-${season}`} style={styles.stickySeasonHeader}>
                <View style={styles.stickySeasonPill}>
                  <Text style={styles.stickySeasonText}>
                    {season.includes('-')
                      ? `${season.split('-')[0]}-20${season.split('-')[1]} Season`
                      : season}
                  </Text>
                </View>
              </View>
            );

            // Game cards for this season
            let lastPhaseType: number | undefined;
            scrollChildren.push(
              <View key={`games-${season}`} style={{ gap: 12, marginBottom: 8 }}>
                {events.map((event) => {
                  const meta = event.type_metadata;

                  const dateStr = event.event_date
                    ? new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '';
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
                    ? `${meta.away_score} \u2013 ${meta.home_score}` : null;
                  const shortAway = meta?.away_team_name?.trim().split(' ').slice(-1)[0] || '';
                  const shortHome = meta?.home_team_name?.trim().split(' ').slice(-1)[0] || '';
                  const displayTitle = shortAway && shortHome ? `${shortAway} vs ${shortHome}` : event.title;

                  return (
                    <View key={event.id}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setSelectedEventToLog(mapEventForModal(event))}
                      >
                        <GlassCard borderRadius={16} style={styles.apiResultCard}>
                          <View style={styles.searchLogoContainer}>
                            {meta?.home_team_logo ? (
                              <Image source={{ uri: meta.home_team_logo }} style={{ width: '72%', height: '72%' }} resizeMode="contain" />
                            ) : (
                              <Text style={styles.logoFallbackText}>{meta?.home_team_name?.charAt(0) || '?'}</Text>
                            )}
                          </View>
                          <View style={styles.apiResultInfo}>
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
                            <Text style={styles.apiResultSub} numberOfLines={1}>
                              {dateStr}{event.venue_name ? ` \u00b7 ${event.venue_name}` : ''}
                            </Text>
                          </View>
                        </GlassCard>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            );
          }

          // Load more
          if (hasMore && !isSearching) {
            scrollChildren.push(
              <TouchableOpacity
                key="load-more"
                style={styles.loadMoreButton}
                activeOpacity={0.7}
                onPress={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore
                  ? <ActivityIndicator size="small" color={Colors.primaryContainer} />
                  : <Text style={styles.loadMoreText}>Load More Results</Text>}
              </TouchableOpacity>
            );
          }

          return (
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 140 }}
              showsVerticalScrollIndicator={true}
              stickyHeaderIndices={stickyIndices}
              style={{ flex: 1 }}
            >
              {scrollChildren}
            </ScrollView>
          );
        })()}

        {/* Edit/Create modal */}
        <EditLogModal
          visible={!!selectedEventToLog}
          eventType={selectedEventToLog?.eventType}
          mode="create"
          event={selectedEventToLog?.isManualFallback ? null : selectedEventToLog}
          onClose={() => setSelectedEventToLog(null)}
          onSave={handleSaveLog}
        />

        {/* Success animation */}
        {showSuccess && (
          <Animated.View
            pointerEvents="none"
            style={{
              ...StyleSheet.absoluteFillObject,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: successOpacity,
              zIndex: 999,
            }}
          >
            <Animated.View
              style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: Colors.primaryContainer,
                alignItems: 'center', justifyContent: 'center',
                transform: [{ scale: successScale }],
                shadowColor: Colors.primaryContainer,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5, shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Ionicons name="checkmark" size={36} color={Colors.onPrimary} />
            </Animated.View>
          </Animated.View>
        )}
      </SafeAreaView>
    );
  }

  // ─── DEFAULT LAYOUT (type grid, sports hub, teams, generic search) ──
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Header — only shown on type selection screen */}
        {!selectedType && <Text style={styles.title}>Log New</Text>}

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
              onPress={() => {
                setSelectedSport(null);
                setActiveSearchQuery('');
                setSearchResults([]);
                setSportsStep('search');
              }}
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
              {getTeamsForSport(selectedSport).map((team) => (
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
                  setTeamFilterText('');
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

            {/* Team browse: logo + name + filter + season-grouped results */}
            {selectedType === 'sports' && selectedSport && activeSearchQuery ? (() => {
              const teamInfo = getTeamsForSport(selectedSport).find(t => t.name === activeSearchQuery);

              // Client-side filter
              const filterLower = teamFilterText.toLowerCase();
              const filtered = teamFilterText
                ? searchResults.filter(e => {
                  const meta = e.type_metadata;
                  return (
                    e.title?.toLowerCase().includes(filterLower) ||
                    meta?.home_team_name?.toLowerCase().includes(filterLower) ||
                    meta?.away_team_name?.toLowerCase().includes(filterLower) ||
                    meta?.round?.toLowerCase().includes(filterLower) ||
                    e.venue_name?.toLowerCase().includes(filterLower)
                  );
                })
                : searchResults;

              // Group by season
              const seasonsMap = new Map<string, EventSearchResult[]>();
              for (const evt of filtered) {
                const season = evt.type_metadata?.season || 'Unknown';
                if (!seasonsMap.has(season)) seasonsMap.set(season, []);
                seasonsMap.get(season)!.push(evt);
              }
              const sortedSeasons = [...seasonsMap.entries()].sort(([a], [b]) => b.localeCompare(a));

              const getPhaseLabel = (type?: number, round?: string) => {
                if (type === 1) return { label: 'Preseason', color: '#4ade80' };
                if (type === 3 || type === 5) return { label: round || 'Postseason', color: '#fb923c' };
                if (type === 4) return { label: 'Offseason', color: Colors.textMuted };
                return null;
              };

              return (
                <>
                  {/* Team header */}
                  <View style={styles.teamBrowseHeader}>
                    {teamInfo?.logo && (
                      <Image source={{ uri: teamInfo.logo }} style={{ width: 36, height: 36 }} resizeMode="contain" />
                    )}
                    <Text style={styles.apiSearchTitle}>
                      {teamInfo?.name ?? activeSearchQuery}
                    </Text>
                    {isSearching && (
                      <ActivityIndicator size="small" color={Colors.primaryContainer} />
                    )}
                  </View>

                  {/* Lightweight filter bar */}
                  <GlassCard borderRadius={16} style={[styles.searchBar, { marginTop: 8, marginBottom: 0 }]}>
                    <TextInput
                      style={[styles.searchInput, { fontSize: 14 }]}
                      placeholder="Filter games..."
                      placeholderTextColor={Colors.textMuted}
                      value={teamFilterText}
                      onChangeText={setTeamFilterText}
                    />
                    <Ionicons name="filter-outline" size={18} color={Colors.textMuted} />
                  </GlassCard>

                  {/* Error / empty states */}
                  {searchError && (
                    <GlassCard borderRadius={16} style={[styles.errorCard, { marginTop: 12 }]}>
                      <Ionicons name="alert-circle-outline" size={20} color="#ff6b6b" />
                      <Text style={styles.errorText}>{searchError}</Text>
                    </GlassCard>
                  )}
                  {!isSearching && searchResults.length === 0 && !searchError && (
                    <GlassCard borderRadius={16} style={[styles.noResultsCard, { marginTop: 12 }]}>
                      <Ionicons name="search-outline" size={24} color={Colors.textMuted} />
                      <Text style={styles.noResultsText}>No games found</Text>
                    </GlassCard>
                  )}

                  {/* Season-grouped game list */}
                  <View style={[styles.apiResultsList, { marginTop: 12 }]}>
                    {sortedSeasons.map(([season, events]) => {
                      events.sort((a, b) => {
                        const da = a.event_date ? new Date(a.event_date).getTime() : 0;
                        const db = b.event_date ? new Date(b.event_date).getTime() : 0;
                        return db - da;
                      });

                      let lastPhaseType: number | undefined;

                      return (
                        <View key={season} style={{ gap: 12 }}>
                          {/* Season header */}
                          <View style={styles.seasonHeader}>
                            <View style={styles.seasonHeaderLine} />
                            <Text style={styles.seasonHeaderText}>{season}</Text>
                            <View style={styles.seasonHeaderLine} />
                          </View>

                          {events.map((event) => {
                            const meta = event.type_metadata;
                            const phaseType = meta?.season_type ?? undefined;
                            const showPhaseDivider = phaseType !== lastPhaseType && phaseType != null;
                            lastPhaseType = phaseType;
                            const phase = showPhaseDivider ? getPhaseLabel(phaseType, meta?.round ?? undefined) : null;

                            const dateStr = event.event_date
                              ? new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '';
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
                              ? `${meta.away_score} \u2013 ${meta.home_score}` : null;
                            const shortAway = meta?.away_team_name?.trim().split(' ').slice(-1)[0] || '';
                            const shortHome = meta?.home_team_name?.trim().split(' ').slice(-1)[0] || '';
                            const displayTitle = shortAway && shortHome ? `${shortAway} vs ${shortHome}` : event.title;

                            return (
                              <View key={event.id}>
                                {phase && (
                                  <View style={styles.phaseDivider}>
                                    <View style={[styles.phaseDividerLine, { backgroundColor: phase.color + '40' }]} />
                                    <Text style={[styles.phaseDividerText, { color: phase.color }]}>
                                      {phase.label}
                                    </Text>
                                    <View style={[styles.phaseDividerLine, { backgroundColor: phase.color + '40' }]} />
                                  </View>
                                )}
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() => setSelectedEventToLog(mapEventForModal(event))}
                                >
                                  <GlassCard borderRadius={16} style={styles.apiResultCard}>
                                    <View style={styles.searchLogoContainer}>
                                      {meta?.home_team_logo ? (
                                        <Image source={{ uri: meta.home_team_logo }} style={{ width: '72%', height: '72%' }} resizeMode="contain" />
                                      ) : (
                                        <Text style={styles.logoFallbackText}>{meta?.home_team_name?.charAt(0) || '?'}</Text>
                                      )}
                                    </View>
                                    <View style={styles.apiResultInfo}>
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
                                      <Text style={styles.apiResultSub} numberOfLines={1}>
                                        {dateStr}{event.venue_name ? ` \u00b7 ${event.venue_name}` : ''}
                                      </Text>
                                    </View>
                                  </GlassCard>
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>

                  {/* Load more */}
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
                </>
              );
            })() : (
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

            {/* Generic search results (NOT team browse) */}
            {!(selectedSport && activeSearchQuery) && (<>
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
            </>)}

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

      {/* ── Success toast ── */}
      {showSuccess && (
        <Animated.View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: successOpacity,
            zIndex: 999,
          }}
        >
          <Animated.View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: Colors.primaryContainer,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: successScale }],
              shadowColor: Colors.primaryContainer,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Ionicons name="checkmark" size={36} color={Colors.onPrimary} />
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  teamBrowseFixedHeader: {
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 8,
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
    gap: 12,
    marginBottom: 4,
  },
  teamEventCount: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.textMuted,
  },

  // Season section headers (like logbook month headers)
  seasonHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginTop: 20,
    marginBottom: 12,
  },
  stickySeasonHeader: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
  },
  stickySeasonPill: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.6)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 24,
    alignSelf: 'stretch' as const,
    alignItems: 'center' as const,
  },
  stickySeasonText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: Colors.primaryContainer,
    textTransform: 'uppercase' as const,
  },
  seasonHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outline,
  },
  seasonHeaderText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 14,
    letterSpacing: 1,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
  },

  // Phase sub-dividers (Preseason, Postseason, etc.)
  phaseDivider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  phaseDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  phaseDividerText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
});

