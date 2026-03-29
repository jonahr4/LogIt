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
  external_id?: string;
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
    privacy: log.privacy || 'public',
    rating: log.rating,
    companions: log.companions,
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
      setEditingLog(null);
      fetchLogs(true); // Refetch quietly
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
    return (
      <TouchableOpacity key={entry.id} activeOpacity={0.8} onPress={() => setSelectedEvent(entry)}>
        <GlassCard borderRadius={20} style={styles.entryCard}>
          <View style={styles.entryImageContainer}>
            {entry.image ? (
              <Image source={{ uri: entry.image }} style={styles.entryImage} />
            ) : (
              <View style={[styles.entryImage, { backgroundColor: 'rgba(0,255,194,0.1)' }]} />
            )}
            <View style={styles.entryImageOverlay} />
          </View>
          
          <View style={styles.entryInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
              {isUpcoming(entry) && entry.rawDate && (
                <View style={[styles.upcomingPill, getDaysUntil(entry.rawDate) === 'TODAY' && { backgroundColor: Colors.primaryContainer }]}>
                  <Text style={[styles.upcomingPillText, getDaysUntil(entry.rawDate) === 'TODAY' && { color: Colors.surface }]}>
                    {getDaysUntil(entry.rawDate)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.entryMeta} numberOfLines={1}>
              {entry.venue ? entry.venue.toUpperCase() + ' • ' : ''}{entry.date.toUpperCase()}
            </Text>
            
            {/* Unified Metadata Row */}
            <View style={styles.bottomMetaRow}>
              {entry.rating !== undefined && (
                <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const threshold = i + 1;
                    const r = entry.rating || 0;
                    const iconName = r >= threshold
                      ? 'star' as const
                      : r >= threshold - 0.5
                        ? 'star-half' as const
                        : 'star-outline' as const;
                    return (
                      <Ionicons
                        key={`star-${i}`}
                        name={iconName}
                        size={12}
                        color={r > i ? '#FFD700' : Colors.textMuted}
                      />
                    );
                  })}
                </View>
              )}
              {entry.companions && entry.companions.length > 0 && (
                <View style={styles.metaIconRow}>
                  <Ionicons name="people" size={12} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{entry.companions.length}</Text>
                </View>
              )}
              <Ionicons 
                name={entry.privacy === 'private' ? 'lock-closed' : entry.privacy === 'friends' ? 'people' : 'globe-outline'} 
                size={12} 
                color={Colors.textMuted} 
              />
            </View>
          </View>

          {renderRightSide(entry)}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderRightSide = (entry: EventDetail) => {
    const isSports = ['NBA', 'NFL', 'MLB', 'NHL'].includes(entry.eventType);
    
    if (isSports && entry.homeScore !== undefined && entry.awayScore !== undefined && !isUpcoming(entry)) {
      // Logic for W/L: Did Home Win? Wait, we don't know who user supports. We'll derive W from result string if we had it, but let's mock W/L by random or just W for demo
      const isWin = entry.homeScore > entry.awayScore; // Assuming home team for now
      return (
        <View style={styles.sportsRight}>
          <View style={styles.scoreBug}>
            <Text style={styles.scoreText}>{entry.homeScore} - {entry.awayScore}</Text>
          </View>
          <Text style={[styles.entryResult, isWin ? styles.entryResultWin : styles.entryResultLoss]}>
            {isWin ? 'W' : 'L'}
          </Text>
        </View>
      );
    }
    
    // For non-sports, let's just show Price level if they have it
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
  entryImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
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
    fontSize: 17,
    color: Colors.text,
    flexShrink: 1,
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
    letterSpacing: 1,
    color: Colors.textMuted,
    marginBottom: 6,
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
    backgroundColor: '#FF8A3D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: '#000',
  },
  entryResult: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 22,
    color: Colors.primaryContainer,
    textShadowColor: 'rgba(0, 255, 194, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  entryResultWin: {
    color: Colors.primaryContainer,
  },
  entryResultLoss: {
    color: Colors.error,
    textShadowColor: 'rgba(255, 113, 108, 0.4)',
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
