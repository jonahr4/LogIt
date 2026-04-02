/**
 * LogIt — Logbook Screen
 * Spatial Green v2: search, filter chips, sub-filters, sorting, compact polymorphic list entries
 * Connected to real Supabase data via /api/logs/mine
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { EventDetailModal } from '@/components/ui/EventDetailModal';
import { EditLogModal } from '@/components/ui/EditLogModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';

// --- Types ---
export type EventDetail = {
  id: string;
  eventType: string;
  title: string;
  venue: string;
  venueCity?: string;
  venueState?: string;
  date: string;
  rawDate?: string;
  dateLogged?: string;
  timeAgo?: string;
  image?: string;
  note?: string;
  status?: string;
  
  // Sports
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore?: number;
  awayScore?: number;
  season?: string;
  league?: string;
  sport?: string;
  
  // Movie
  runtime?: number;
  watchedAt?: string;
  
  // Concert
  artist?: string;
  
  // Restaurant / Nightlife
  priceLevel?: string;
  cuisine?: string;
  
  // Universal Metadata
  privacy?: 'public' | 'friends' | 'private';
  rating?: number;
  companions?: Array<{ name: string; user_id?: string }>;
  photos?: Array<{ id: string; url: string; firebase_path: string; display_order?: number }>;
  external_id?: string;
  season_type?: number;
  round?: string;
};

// --- Constants ---
const FILTER_CHIPS = ['All', 'Sports', 'Movies', 'Concerts', 'Restaurants', 'Nightlife'] as const;

const SUB_FILTERS: Record<string, string[]> = {
  Sports: ['All', 'NBA', 'NFL', 'MLB', 'NHL'],
  Movies: ['All', 'Theater', 'Streaming'],
  Concerts: ['All', 'Stadium', 'Intimate'],
  Restaurants: ['All', '$', '$$', '$$$', '$$$$'],
  Nightlife: ['All', 'Club', 'Bar', 'Lounge'],
};

/** Compute a human-readable relative time string from a timestamp */
function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const isFuture = diffMs < 0;
  const absDiff = Math.abs(diffMs);
  const mins = Math.floor(absDiff / 60000);
  if (mins < 1) return isFuture ? 'Now' : 'Just now';
  if (mins < 60) return isFuture ? `in ${mins}m` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return isFuture ? `in ${hrs}h` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return isFuture ? `in ${days}d` : `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return isFuture ? `in ${weeks}w` : `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return isFuture ? `in ${months}mo` : `${months}mo ago`;
  const years = Math.floor(days / 365);
  return isFuture ? `in ${years}y` : `${years}y ago`;
}

const SORT_OPTIONS = ['Date Attended', 'Date Logged', 'Highest Rated'] as const;

/** Extract last word of team name for compact display: 'Boston Celtics' → 'Celtics' */
function shortTeamName(fullName?: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1];
}

/** Build compact matchup title for sports: 'Celtics vs Thunder' */
function shortSportsTitle(entry: EventDetail): string {
  if (entry.awayTeamName && entry.homeTeamName) {
    return `${shortTeamName(entry.awayTeamName)} vs ${shortTeamName(entry.homeTeamName)}`;
  }
  return entry.title;
}

/**
 * Get a compact season badge for non-regular-season games.
 * Checks rounds bottom-up (R1→R2→R3→FIN) to avoid substring false positives.
 * ESPN uses: "East 1st Round", "West 2nd Round", "East Conf Semifinals", "NBA Finals"
 */
function getSeasonBadge(seasonType?: number, round?: string): { label: string; color: string } | null {
  if (!seasonType || seasonType === 2) return null;
  if (seasonType === 1) return { label: 'PRE', color: '#4ade80' };
  if (seasonType === 4) return { label: 'OFF', color: '#8B95A5' };
  if (!round) return { label: 'POST', color: '#fb923c' };

  const r = round.toLowerCase();
  const gm = round.match(/game\s*(\d+)/i);
  const gs = gm ? ` G${gm[1]}` : '';

  // Play-in
  if (r.includes('play-in') || r.includes('playin')) return { label: 'PIN', color: '#fb923c' };

  // R1: Wild card / first round / 1st round
  if (r.includes('wild card') || r.includes('first round') || r.includes('1st round')
      || r.includes('round 1'))
    return { label: `R1${gs}`, color: '#fb923c' };

  // R2: Semifinal / semis / 2nd round / divisional
  if (r.includes('semifinal') || r.includes('semis') || r.includes('divisional')
      || r.includes('second round') || r.includes('2nd round') || r.includes('round 2')
      || r.match(/[an]l[dc]s/))
    return { label: `R2${gs}`, color: '#fb923c' };

  // R3: Conference championship / conference finals / 3rd round
  if (r.includes('championship') || (r.includes('conf') && r.includes('final'))
      || r.includes('3rd round') || r.includes('round 3'))
    return { label: `R3${gs}`, color: '#fb923c' };

  // FIN: Only true finals (semis and conf finals already caught above)
  if (r.includes('super bowl') || r.includes('finals') || r.includes('stanley cup')
      || r.includes('world series'))
    return { label: `FIN${gs}`, color: '#fbbf24' };

  return { label: `POST${gs}`, color: '#fb923c' };
}

/** Map API log response to EventDetail for the UI */
function mapLogToEventDetail(log: any): EventDetail {
  const event = log.event;
  if (!event) {
    return {
      id: log.id,
      eventType: 'Custom',
      title: 'Unknown Event',
      venue: '',
      date: new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      rawDate: log.logged_at,
      dateLogged: log.logged_at,
      privacy: log.privacy || 'public',
      rating: log.rating,
      note: log.notes,
      companions: log.companions,
      photos: log.photos || [],
    };
  }

  // Determine eventType label
  let eventType = event.event_type || 'Custom';
  if (eventType === 'sports' && event.league) {
    eventType = event.league; // 'NBA', 'NFL', etc.
  } else if (eventType === 'sports') {
    eventType = 'NBA'; // Default
  } else {
    // Capitalize first letter
    eventType = eventType.charAt(0).toUpperCase() + eventType.slice(1);
  }

  // Build human-readable time ago string based on event date
  const timeAgo = getTimeAgo(event.event_date);

  return {
    id: log.id,
    eventType,
    title: event.title,
    venue: event.venue_name || event.venue_city || '',
    venueCity: event.venue_city,
    venueState: event.venue_state,
    date: new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    rawDate: event.event_date,
    dateLogged: log.logged_at,
    timeAgo,
    image: event.image_url || null,
    note: log.notes,
    status: event.status === 'completed' ? 'FINAL' : event.status === 'in_progress' ? 'LIVE' : 'Upcoming',
    homeTeamName: event.home_team_name,
    awayTeamName: event.away_team_name,
    homeTeamLogo: event.home_team_logo,
    awayTeamLogo: event.away_team_logo,
    homeScore: event.home_score,
    awayScore: event.away_score,
    season: event.season,
    league: event.league,
    sport: event.sport,
    season_type: event.season_type,
    round: event.round,
    privacy: log.privacy || 'public',
    rating: log.rating,
    companions: log.companions,
    photos: log.photos || [],
    external_id: event.external_id,
  };
}

export default function LogbookScreen() {
  const [entries, setEntries] = useState<EventDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [activeSubFilter, setActiveSubFilter] = useState<string>('All');
  const [activeSort, setActiveSort] = useState<string>('Date Attended');
  const [searchText, setSearchText] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [editingLog, setEditingLog] = useState<EventDetail | null>(null);
  const [isSortDropdownVisible, setIsSortDropdownVisible] = useState(false);

  const sortButtonRef = React.useRef<View>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 16 });

  // Fetch logs from API
  const fetchLogs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await api.get<{ logs: any[]; total: number }>('/api/logs/mine');
      const mapped = (data.logs || []).map(mapLogToEventDetail);
      setEntries(mapped);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      // Keep existing entries on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [fetchLogs])
  );

  const handleDeleteLog = useCallback(async (event: EventDetail) => {
    try {
      setIsLoading(true);
      await api.post('/api/logs/delete', { log_id: event.id });
      fetchLogs(true);
    } catch (err) {
      console.error('Failed to delete log:', err);
      Alert.alert('Error', 'Could not delete your log.');
      setIsLoading(false);
    }
  }, [fetchLogs]);

  const handleOpenSort = () => {
    sortButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setDropdownPos({ top: pageY + height + 8, right: 16 });
      setIsSortDropdownVisible(true);
    });
  };

  const handleSaveEdit = async (updatedData: Partial<EventDetail>) => {
    if (!editingLog) return;
    try {
      setIsLoading(true);
      await api.post('/api/logs/update', {
        log_id: editingLog.id,
        notes: updatedData.note,
        privacy: updatedData.privacy,
        rating: updatedData.rating,
        companions: updatedData.companions,
      });
      // Merge edits into the event and reopen the detail modal
      const updatedEvent = { ...editingLog, ...updatedData };
      setEditingLog(null);
      setTimeout(() => setSelectedEvent(updatedEvent), 350); // wait for edit modal dismiss animation
      fetchLogs(true); // Refetch quietly in background
    } catch (err) {
      console.error('Failed to update log:', err);
      Alert.alert('Error', 'Could not update your log.');
      setIsLoading(false);
    }
  };

  // --- Derived State ---
  const filteredAndSortedEntries = useMemo(() => {
    let result = [...entries];

    // Search filter
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q));
    }

    // Main Filter
    if (activeFilter !== 'All') {
      result = result.filter(e => {
        if (activeFilter === 'Sports') return ['NBA', 'NFL', 'MLB', 'NHL'].includes(e.eventType);
        if (activeFilter === 'Movies') return e.eventType === 'Movie';
        if (activeFilter === 'Concerts') return e.eventType === 'Concert';
        if (activeFilter === 'Restaurants') return e.eventType === 'Restaurant';
        if (activeFilter === 'Nightlife') return e.eventType === 'Nightlife';
        return true;
      });
    }

    // Sub Filter
    if (activeFilter !== 'All' && activeSubFilter !== 'All') {
      result = result.filter(e => {
        if (activeFilter === 'Sports') return e.eventType === activeSubFilter;
        if (activeFilter === 'Movies') return e.watchedAt === activeSubFilter;
        if (activeFilter === 'Restaurants' || activeFilter === 'Nightlife') return e.priceLevel === activeSubFilter;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (activeSort === 'Date Logged') {
        const dA = a.dateLogged ? new Date(a.dateLogged).getTime() : 0;
        const dB = b.dateLogged ? new Date(b.dateLogged).getTime() : 0;
        return dB - dA;
      }
      if (activeSort === 'Date Attended') {
        const dA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
        const dB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
        return dB - dA;
      }
      if (activeSort === 'Highest Rated') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });

    return result;
  }, [entries, searchText, activeFilter, activeSubFilter, activeSort]);

  const handleFilterPress = (chip: string) => {
    setActiveFilter(chip);
    setActiveSubFilter('All');
  };

  const isUpcoming = useCallback((entry: EventDetail) => {
    if (entry.status === 'Upcoming' || entry.status === 'LIVE') return true;
    if (entry.status === 'FINAL') return false;
    if (entry.rawDate) {
      return new Date(entry.rawDate as string).getTime() > Date.now();
    }
    return false;
  }, []);

  const getDaysUntil = useCallback((rawDate?: string) => {
    if (!rawDate) return null;
    const target = new Date(rawDate as string).setHours(0, 0, 0, 0);
    const now = new Date().setHours(0, 0, 0, 0);
    const diffTime = target - now;
    if (diffTime <= 0) return 'TODAY';
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'TOMORROW';
    return `IN ${diffDays} DAYS`;
  }, []);

  const upcomingEvents = useMemo(() => {
    return filteredAndSortedEntries.filter(isUpcoming);
  }, [filteredAndSortedEntries, isUpcoming]);

  const pastEventsWithDividers = useMemo(() => {
    const past = filteredAndSortedEntries.filter(e => !isUpcoming(e));
    if (activeSort === 'Highest Rated') {
      return past.map(data => ({ type: 'event' as const, data }));
    }

    const items: Array<{ type: 'event' | 'divider', data: any }> = [];
    let currentPeriod = '';
    
    past.forEach(event => {
       const dateSpace = activeSort === 'Date Logged' ? (event.dateLogged || event.rawDate) : event.rawDate;
       const d = new Date(dateSpace);
       const period = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
       
       if (period !== currentPeriod) {
         currentPeriod = period;
         items.push({ type: 'divider', data: period });
       }
       items.push({ type: 'event', data: event });
    });
    return items;
  }, [filteredAndSortedEntries, activeSort, isUpcoming]);

  const renderEntryCard = (entry: EventDetail) => {
    const isSports = !!(entry.homeTeamName || entry.awayTeamName);
    const displayTitle = isSports ? shortSportsTitle(entry) : entry.title;
    const hasScore = isSports && entry.homeScore !== undefined && entry.awayScore !== undefined && !isUpcoming(entry);
    const isWin = hasScore && entry.homeScore! > entry.awayScore!;

    return (
      <TouchableOpacity key={entry.id} activeOpacity={0.8} onPress={() => setSelectedEvent(entry)}>
        <GlassCard borderRadius={20} style={styles.entryCard}>
          <View style={styles.entryImageContainer}>
            {entry.homeTeamLogo ? (
              <View style={styles.entryLogoContainer}>
                <Image source={{ uri: entry.homeTeamLogo }} style={{ width: '72%', height: '72%' }} resizeMode="contain" />
              </View>
            ) : entry.image ? (
              <Image source={{ uri: entry.image }} style={styles.entryImage} />
            ) : (
              <View style={[styles.entryImage, { backgroundColor: 'rgba(0,255,194,0.08)' }]} />
            )}
          </View>

          <View style={styles.entryInfo}>
            {/* Title row — game name on left, badge + score/days pill on right */}
            <View style={styles.titleRow}>
              <Text style={styles.entryTitle} numberOfLines={1}>{displayTitle}</Text>
              {isSports && (() => {
                const badge = getSeasonBadge(entry.season_type, entry.round);
                return badge ? (
                  <View style={[styles.phaseBadge, { backgroundColor: badge.color + '20', borderColor: badge.color }]}>
                    <Text style={[styles.phaseBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                ) : null;
              })()}
              {hasScore ? (
                <View style={styles.scoreBug}>
                  <Text style={styles.scoreText}>{entry.awayScore} – {entry.homeScore}</Text>
                </View>
              ) : isUpcoming(entry) && entry.rawDate ? (
                <View style={[
                  styles.scoreBug,
                  styles.scoreBugGreen,
                  getDaysUntil(entry.rawDate) === 'TODAY' && { backgroundColor: 'rgba(0,255,194,0.18)' }
                ]}>
                  <Text style={[styles.scoreText, styles.scoreTextGreen]}>
                    {getDaysUntil(entry.rawDate)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Date first, then venue */}
            <Text style={styles.entryMeta} numberOfLines={2}>
              {entry.date.toUpperCase()}{entry.venue ? ' • ' + entry.venue.toUpperCase() : ''}
            </Text>

            {/* Unified Metadata Row */}
            <View style={styles.bottomMetaRow}>
              {/* Left side: league → stars → privacy → companions */}
              {isSports && entry.eventType && (
                <View style={styles.leagueTag}>
                  <Text style={styles.leagueTagText}>{entry.eventType}</Text>
                </View>
              )}
              {entry.rating !== undefined && (
                <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const r = entry.rating || 0;
                    const iconName = r >= i + 1 ? 'star' as const : r >= i + 0.5 ? 'star-half' as const : 'star-outline' as const;
                    return <Ionicons key={`star-${i}`} name={iconName} size={12} color={r > i ? '#FFD700' : Colors.textMuted} />;
                  })}
                </View>
              )}
              <Ionicons
                name={entry.privacy === 'private' ? 'lock-closed' : entry.privacy === 'friends' ? 'people' : 'globe-outline'}
                size={12}
                color={Colors.textMuted}
              />
              {entry.companions && entry.companions.length > 0 && (
                <View style={styles.metaIconRow}>
                  <Ionicons name="people" size={12} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{entry.companions.length}</Text>
                </View>
              )}

              {/* Right side: W/L (pushed right) */}
              {isSports && hasScore && (
                <Text style={[styles.entryResult, isWin ? styles.entryResultWin : styles.entryResultLoss, { marginLeft: 'auto' as any }]}>
                  {isWin ? 'W' : 'L'}
                </Text>
              )}
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderRightSide = (entry: EventDetail) => {
    // Only used for non-sports price level now
    if (entry.priceLevel) {
      return (
        <View style={styles.nonSportsRight}>
          <Text style={styles.priceLevel}>{entry.priceLevel}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchLogs(true)}
            tintColor={Colors.primaryContainer}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Logbook</Text>
            <Text style={styles.subtitle}>{entries.length} events logged</Text>
          </View>
        </View>

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

        {/* Filter chips & Sort */}
        <View style={styles.filterSortRow}>
          <View style={styles.chipsScrollWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.chipsRow} 
              style={styles.chipsScroll}
            >
              {FILTER_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  onPress={() => handleFilterPress(chip)}
                  style={[styles.chip, activeFilter === chip && styles.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, activeFilter === chip && styles.chipTextActive]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <LinearGradient
              colors={['rgba(3, 7, 18, 0)', 'rgba(3, 7, 18, 1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fadeRight}
              pointerEvents="none"
            />
          </View>

          <TouchableOpacity 
            ref={sortButtonRef}
            onPress={handleOpenSort} 
            style={[styles.sortIconButton, activeSort !== 'Date Logged' && styles.sortIconButtonActive]}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={18} color={activeSort !== 'Date Logged' ? Colors.primaryContainer : Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sub-Filters */}
        {activeFilter !== 'All' && SUB_FILTERS[activeFilter] && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subChipsRow}>
            {SUB_FILTERS[activeFilter].map((subChip) => (
               <TouchableOpacity
                 key={subChip}
                 onPress={() => setActiveSubFilter(subChip)}
                 style={[styles.subChip, activeSubFilter === subChip && styles.subChipActive]}
                 activeOpacity={0.7}
               >
                 <Text style={[styles.subChipText, activeSubFilter === subChip && styles.subChipTextActive]}>{subChip}</Text>
               </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* List Controls */}
        <View style={styles.listControls}>
          <Text style={styles.resultsText}>{filteredAndSortedEntries.length} Results</Text>
        </View>

        {/* Log entries */}
        <View style={styles.entriesList}>
          {isLoading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primaryContainer} />
              <Text style={[styles.resultsText, { marginTop: 12 }]}>Loading your logs...</Text>
            </View>
          ) : filteredAndSortedEntries.length === 0 ? (
            <GlassCard borderRadius={20} style={{ padding: 32, alignItems: 'center' as const, gap: 12 }}>
              <Ionicons name="book-outline" size={36} color={Colors.textMuted} />
              <Text style={[styles.entryTitle, { textAlign: 'center' as const }]}>No logs yet</Text>
              <Text style={[styles.resultsText, { textAlign: 'center' as const }]}>
                Start logging events from the + tab!
              </Text>
            </GlassCard>
          ) : (
            <>
              {upcomingEvents.length > 0 && (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderText}>UPCOMING</Text>
                  </View>
                  {upcomingEvents.map(renderEntryCard)}
                  <View style={{ height: 24 }} />
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeaderText}>PAST</Text>
                  </View>
                </>
              )}
              
              {pastEventsWithDividers.map((item, idx) => {
                if (item.type === 'divider') {
                  return (
                    <View key={`div-${item.data}-${idx}`} style={styles.dividerRow}>
                      <Text style={styles.dividerText}>{item.data.toUpperCase()}</Text>
                      <View style={styles.dividerLine} />
                    </View>
                  );
                }
                return renderEntryCard(item.data);
              })}
            </>
          )}
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Reused Event Detail Modal */}
      <EventDetailModal
         event={selectedEvent}
         onClose={() => setSelectedEvent(null)}
         onEdit={(e) => setEditingLog(e)}
         onDelete={handleDeleteLog}
      />
      
      {/* Edit Log Modal */}
      {editingLog && (
        <EditLogModal
          visible={!!editingLog}
          onClose={() => setEditingLog(null)}
          event={editingLog}
          mode="edit"
          onSave={handleSaveEdit}
        />
      )}

      {/* Custom Sort Dropdown Modal */}
      <Modal visible={isSortDropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setIsSortDropdownVisible(false)}>
          <View style={[styles.dropdownContainer, { position: 'absolute', top: dropdownPos.top, right: dropdownPos.right }]}>
            <GlassCard borderRadius={16} style={styles.dropdownCard}>
              {SORT_OPTIONS.map((opt, index) => (
                <TouchableOpacity 
                  key={opt} 
                  style={[styles.dropdownOption, index < SORT_OPTIONS.length - 1 && styles.dropdownOptionBorder]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setActiveSort(opt);
                    setIsSortDropdownVisible(false);
                  }}
                >
                  <Text style={[styles.dropdownOptionText, activeSort === opt && styles.dropdownOptionTextActive]}>
                    {opt}
                  </Text>
                  {activeSort === opt && (
                    <Ionicons name="checkmark" size={16} color={Colors.primaryContainer} />
                  )}
                </TouchableOpacity>
              ))}
            </GlassCard>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerRow: {
    paddingLeft: 4,
    gap: 4,
  },
  title: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 36,
    letterSpacing: -1,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.textMuted,
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

  // Sub Filter Chips
  subChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 0,
    paddingBottom: 8,
  },
  subChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  subChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  subChipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  subChipTextActive: {
    color: Colors.text,
    fontFamily: FontFamily.bodySemiBold,
  },

  // List Controls
  listControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  resultsText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  filterSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chipsScrollWrapper: {
    flex: 1,
    position: 'relative',
  },
  chipsScroll: {
    flex: 1,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
  },
  sortIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIconButtonActive: {
    backgroundColor: 'rgba(0, 255, 194, 0.12)',
    borderColor: 'rgba(0, 255, 194, 0.3)',
  },

  // Dropdown Styles
  dropdownOverlay: {
    flex: 1,
  },
  dropdownContainer: {
    width: 180,
  },
  dropdownCard: {
    padding: 4,
    ...Shadows.glowPrimary,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  dropdownOptionText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.text,
  },
  dropdownOptionTextActive: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.primaryContainer,
  },

  sectionHeaderRow: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionHeaderText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 16,
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  dividerText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: '#8B95A5',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Entries list
  entriesList: {
    gap: 12,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingRight: 16,
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
  entryLogoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(10, 14, 23, 0.9)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  entryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  entryTitle: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  upcomingPill: {
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  upcomingPillText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 9,
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  entryMeta: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.textMuted,
    marginBottom: 5,
    flexShrink: 1,
  },
  leagueTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  leagueTagText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.text,
  },
  
  // Right side rendering
  sportsRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  scoreBug: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 61, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
    minWidth: 68,
    alignItems: 'center' as const,
  },
  scoreBugGreen: {
    borderColor: 'rgba(0, 255, 194, 0.4)',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scoreText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 12,
    color: '#FF8A3D',
    letterSpacing: 0.4,
  },
  scoreTextGreen: {
    color: Colors.primaryContainer,
  },
  entryResult: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 15,
    color: Colors.primaryContainer,
    textShadowColor: 'rgba(0, 255, 194, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  entryResultWin: {
    color: Colors.primaryContainer,
  },
  entryResultLoss: {
    color: Colors.error,
    textShadowColor: 'rgba(255, 113, 108, 0.4)',
  },
  phaseBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 32,
    alignItems: 'center' as const,
  },
  phaseBadgeText: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  nonSportsRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceLevel: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 16,
    color: '#facc15',
  },
});
