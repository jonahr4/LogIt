/**
 * LogIt — Logbook Screen
 * Spatial Green v2: search, filter chips, sub-filters, sorting, compact polymorphic list entries
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { EventDetailModal } from '@/components/ui/EventDetailModal';
import { LinearGradient } from 'expo-linear-gradient';

// --- Types ---
export type EventDetail = {
  id: string;
  eventType: string; // 'NBA', 'NFL', 'Movie', 'Concert', 'Restaurant', 'Nightlife', 'Custom'
  title: string;
  venue: string;
  venueCity?: string;
  venueState?: string;
  date: string;
  dateLogged?: string; // for sorting
  image?: string;
  note?: string; // missing in old mock schema
  status?: string; // missing in old mock schema
  
  // Sports
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore?: number;
  awayScore?: number;
  
  // Movie
  runtime?: number;
  watchedAt?: string;
  
  // Concert
  artist?: string;
  
  // Restaurant / Nightlife
  priceLevel?: string;
  cuisine?: string;
  
  // Universal Metadata
  privacy: 'public' | 'friends' | 'private';
  rating?: number;
  companions?: any[];
};

// --- Mock Data ---
// NOTE TO DEVELOPER: In the future API integration phase, these entries will be exactly the same rich 
// 'EventDetail' schema as used in feed.tsx, ensuring the EventDetailModal always receives things like 
// team logos, 'status' (FINAL • OT), 'timeAgo', and full 'notes' regardless of where it was opened from.
const MOCK_ENTRIES: EventDetail[] = [
  {
    id: '1',
    eventType: 'NBA',
    title: 'Celtics vs Lakers',
    venue: 'Crypto.com Arena',
    date: 'Mar 15, 2026',
    dateLogged: '2026-03-15T22:00:00Z',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=200&auto=format&fit=crop',
    homeTeamName: 'Celtics',
    awayTeamName: 'Lakers',
    homeTeamLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/Boston_Celtics.svg/1200px-Boston_Celtics.svg.png',
    awayTeamLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Los_Angeles_Lakers_logo.svg/1200px-Los_Angeles_Lakers_logo.svg.png',
    status: 'FINAL • OT',
    homeScore: 112,
    awayScore: 108,
    rating: 5,
    privacy: 'public',
    note: 'Incredible game, went to OT! Tatum was on fire in the 4th quarter. Sat in section 301, great view of the court. The energy was electric.',
    companions: [{ name: 'Alex' }, { name: 'Sarah' }],
  },
  {
    id: '2',
    eventType: 'NBA',
    title: 'Knicks vs 76ers',
    venue: 'Madison Square Garden',
    date: 'Mar 14, 2026',
    dateLogged: '2026-03-14T23:00:00Z',
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=200&auto=format&fit=crop',
    homeTeamName: 'Knicks',
    awayTeamName: '76ers',
    homeScore: 98,
    awayScore: 104,
    rating: 4,
    privacy: 'friends',
    companions: [{ name: 'Mike' }],
  },
  {
    id: '3',
    eventType: 'NFL',
    title: 'Chiefs vs Eagles',
    venue: 'Arrowhead Stadium',
    date: 'Mar 12, 2026',
    dateLogged: '2026-03-13T10:00:00Z',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=200&auto=format&fit=crop',
    homeTeamName: 'Chiefs',
    awayTeamName: 'Eagles',
    homeScore: 31,
    awayScore: 24,
    rating: 5,
    privacy: 'public',
    companions: [{ name: 'Dad' }, { name: 'Jake' }],
  },
  {
    id: '4',
    eventType: 'Movie',
    title: 'Dune: Part Two',
    venue: 'AMC Lincoln Square',
    date: 'Mar 14, 2026',
    dateLogged: '2026-03-14T20:00:00Z',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=200&auto=format&fit=crop',
    watchedAt: 'Theater',
    rating: 5,
    privacy: 'public',
    companions: [{ name: 'Sarah' }],
  },
  {
    id: '5',
    eventType: 'Concert',
    title: 'SZA',
    venue: 'Madison Square Garden',
    date: 'Mar 13, 2026',
    dateLogged: '2026-03-14T02:00:00Z',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=200&auto=format&fit=crop',
    rating: 5,
    privacy: 'public',
    companions: [{ name: 'Lily' }, { name: 'Marcus' }],
  },
  {
    id: '6',
    eventType: 'Restaurant',
    title: 'Carbone',
    venue: 'Carbone',
    date: 'Mar 12, 2026',
    dateLogged: '2026-03-13T09:00:00Z',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=200&auto=format&fit=crop',
    priceLevel: '$$$$',
    rating: 4,
    privacy: 'public',
    companions: [{ name: 'Tom' }],
  },
  {
    id: '7',
    eventType: 'Nightlife',
    title: 'Marquee NYC',
    venue: 'Marquee New York',
    date: 'Mar 14, 2026',
    dateLogged: '2026-03-15T01:00:00Z',
    image: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=200&auto=format&fit=crop',
    priceLevel: '$$$',
    rating: 3,
    privacy: 'friends',
    companions: [{ name: 'Sam' }, { name: 'Eli' }, { name: 'Nina' }, { name: 'Zoey' }],
  },
];

// --- Constants ---
const FILTER_CHIPS = ['All', 'Sports', 'Movies', 'Concerts', 'Restaurants', 'Nightlife'] as const;

const SUB_FILTERS: Record<string, string[]> = {
  Sports: ['All', 'NBA', 'NFL', 'MLB', 'NHL'],
  Movies: ['All', 'Theater', 'Streaming'],
  Concerts: ['All', 'Stadium', 'Intimate'],
  Restaurants: ['All', '$', '$$', '$$$', '$$$$'],
  Nightlife: ['All', 'Club', 'Bar', 'Lounge'],
};

const SORT_OPTIONS = ['Date Logged', 'Date Attended', 'Highest Rated'] as const;

export default function LogbookScreen() {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [activeSubFilter, setActiveSubFilter] = useState<string>('All');
  const [activeSort, setActiveSort] = useState<string>('Date Logged');
  const [searchText, setSearchText] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isSortDropdownVisible, setIsSortDropdownVisible] = useState(false);

  const sortButtonRef = React.useRef<View>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 16 });

  const handleOpenSort = () => {
    sortButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setDropdownPos({ top: pageY + height + 8, right: 16 });
      setIsSortDropdownVisible(true);
    });
  };

  // --- Derived State ---
  const filteredAndSortedEntries = useMemo(() => {
    let result = [...MOCK_ENTRIES];

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
        // mock date parsing for sorting
        const dA = new Date(a.date).getTime();
        const dB = new Date(b.date).getTime();
        return dB - dA;
      }
      if (activeSort === 'Highest Rated') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });

    return result;
  }, [searchText, activeFilter, activeSubFilter, activeSort]);

  const handleFilterPress = (chip: string) => {
    setActiveFilter(chip);
    setActiveSubFilter('All');
  };


  const renderRightSide = (entry: EventDetail) => {
    const isSports = ['NBA', 'NFL', 'MLB', 'NHL'].includes(entry.eventType);
    
    if (isSports && entry.homeScore !== undefined && entry.awayScore !== undefined) {
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
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Logbook</Text>
            <Text style={styles.subtitle}>{MOCK_ENTRIES.length} events logged</Text>
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
          {filteredAndSortedEntries.map((entry) => (
            <TouchableOpacity key={entry.id} activeOpacity={0.8} onPress={() => setSelectedEvent(entry)}>
              <GlassCard borderRadius={20} style={styles.entryCard}>
                <View style={styles.entryImageContainer}>
                  <Image source={{ uri: entry.image }} style={styles.entryImage} />
                  <View style={styles.entryImageOverlay} />
                </View>
                
                <View style={styles.entryInfo}>
                  <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
                  <Text style={styles.entryMeta} numberOfLines={1}>
                    {entry.venue.toUpperCase()} • {entry.date.toUpperCase()}
                  </Text>
                  
                  {/* Unified Metadata Row */}
                  <View style={styles.bottomMetaRow}>
                    {/* Stars */}
                    {entry.rating !== undefined && (
                      <View style={styles.metaIconRow}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.metaText}>{entry.rating}</Text>
                      </View>
                    )}
                    
                    {/* Companions */}
                    {entry.companions && entry.companions.length > 0 && (
                      <View style={styles.metaIconRow}>
                        <Ionicons name="people" size={12} color={Colors.textMuted} />
                        <Text style={styles.metaText}>{entry.companions.length}</Text>
                      </View>
                    )}

                    {/* Privacy */}
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
          ))}
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Reused Event Detail Modal */}
      <EventDetailModal
         event={selectedEvent}
         onClose={() => setSelectedEvent(null)}
      />
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
  entryTitle: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 17,
    color: Colors.text,
    marginBottom: 3,
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
