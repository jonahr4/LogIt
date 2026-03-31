/**
 * LogIt — Event Detail Modal
 * Ticket fills full remaining screen height — bottom flows off edge, no gap.
 * Drag handle dismisses. Bottom content scrolls internally.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  StyleSheet,
  Animated,
  PanResponder,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { api } from '@/lib/api';

const NOTCH_SIZE = 30;
const SEPARATOR_HEIGHT = 44;
const TICKET_BORDER = 'rgba(255, 255, 255, 0.1)';
const BLUR_INTENSITY = 50;
const DISMISS_THRESHOLD = 120;
const DISMISS_VELOCITY = 0.7;

export type EventDetail = {
  id: string;
  user: { name: string; avatar: string };
  timeAgo: string;
  title: string;
  venue: string;
  date: string;
  rawDate?: string;
  eventType: string;
  // Sports-specific
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore?: number;
  awayScore?: number;
  status?: string;
  league?: string;
  season?: string;
  season_type?: number;  // 1=preseason, 2=regular, 3=postseason
  round?: string;        // playoff round name, e.g. "Super Bowl LX"
  sport?: string;
  // Movie-specific
  director?: string;
  genre?: string;
  runtime?: number;
  cast?: string[];
  watchedAt?: string;        // e.g. 'Theater', 'Home', 'Drive-In'
  theaterName?: string;      // e.g. 'AMC Lincoln Square'
  // Concert-specific
  artist?: string;
  tourName?: string;
  opener?: string;
  setlist?: string[];
  // Restaurant-specific
  cuisine?: string;
  priceLevel?: string;
  // Nightlife-specific
  venueType?: string;
  vibe?: string;
  dressCode?: string;
  musicGenre?: string;
  // Universal
  rating: number;
  note: string;
  companions?: Array<{ name: string; avatar?: string }>;
  photos?: Array<{ id: string; url: string; firebase_path: string; display_order?: number }>;

  privacy?: 'public' | 'friends' | 'private';
  image?: string;
  venueCity?: string;
  venueState?: string;
  external_id?: string;
};

interface Props {
  event: EventDetail | null;
  onClose: () => void;
  onEdit?: (event: EventDetail) => void;
  onDelete?: (event: EventDetail) => void;
}

// Module-level cache — persists for the app session across modal open/close.
// Key: event.id  Value: { data, fetchedAt }
// Live games re-fetch after 60s; FINAL games cached forever.
const liveScoreCache = new Map<string, {
  data: { homeScore?: number; awayScore?: number; status?: string };
  fetchedAt: number;
}>();
const LIVE_CACHE_TTL_MS = 60_000; // re-fetch live scores after 60 seconds

// ─── LIVE SCORE HOOK ─────────────────────────────────────────────────────────
// Fetches fresh score from ESPN directly on the client (no server round-trip, no API key needed).
// Only triggers for sports events that are not yet completed in our DB.
function useLiveScore(event: EventDetail | null) {
  const [liveScore, setLiveScore] = useState<{
    homeScore?: number;
    awayScore?: number;
    status?: string;
  } | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!event) { setLiveScore(null); return; }
    const t = event.eventType?.toLowerCase() || '';
    const isSports = ['nba', 'nfl', 'mlb', 'nhl', 'sports', 'basketball', 'football', 'baseball', 'hockey'].includes(t);
    const isCompleted = event.status?.toUpperCase() === 'FINAL';
    if (!isSports || isCompleted || !event.external_id) { setLiveScore(null); return; }

    // Check cache first — hydrate immediately if fresh enough
    const cached = liveScoreCache.get(event.id);
    const isFinal = cached?.data.status === 'FINAL';
    const isFresh = cached && (isFinal || Date.now() - cached.fetchedAt < LIVE_CACHE_TTL_MS);
    if (cached) setLiveScore(cached.data); // show cached data instantly even if stale
    if (isFresh) return;                   // skip fetch if fresh

    const sport = event.sport || 'basketball';
    const league = event.league?.toLowerCase() || 'nba';
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${event.external_id}`;

    setIsFetching(true);
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const comp = data?.header?.competitions?.[0];
        if (!comp) return;
        const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
        const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
        const state = comp.status?.type?.state;
        const detail = comp.status?.type?.shortDetail || comp.status?.type?.description;
        const newStatus =
          state === 'post' ? `FINAL` :
            state === 'in' ? (detail || 'LIVE') :
              event.status || 'Upcoming';
        const result = {
          homeScore: home?.score != null ? parseInt(home.score, 10) : undefined,
          awayScore: away?.score != null ? parseInt(away.score, 10) : undefined,
          status: newStatus,
        };
        liveScoreCache.set(event.id, { data: result, fetchedAt: Date.now() });
        setLiveScore(result);
      })
      .catch(() => { /* silent fail — show DB data or cached data */ })
      .finally(() => setIsFetching(false));
  }, [event?.id]);

  return { liveScore, isFetching };
}

export function EventDetailModal({ event, onClose, onEdit, onDelete }: Props) {
  const translateY = useRef(new Animated.Value(800)).current;
  const [topHeight, setTopHeight] = useState(0);

  const { liveScore, isFetching } = useLiveScore(event);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Entrance: slide up when event is set. Exit: handled by dismiss().
  useEffect(() => {
    if (event) {
      translateY.setValue(800);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [event]);

  // Single dismiss path used by backdrop tap, close button, and swipe
  const dismiss = useRef(() => {
    Animated.timing(translateY, {
      toValue: 900,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(800); // ready for next entrance
      onCloseRef.current();
    });
  }).current;

  const overlayOpacity = translateY.interpolate({
    inputRange: [0, 600],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > DISMISS_VELOCITY) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 120,
            friction: 10,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!event) return null;


  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      {/* Dim layer — fades as you drag */}
      <Animated.View
        style={[styles.overlayBg, { opacity: overlayOpacity }]}
        pointerEvents="none"
      />

      {/* Content layer — slides with drag */}
      <Animated.View style={[styles.contentLayer, { transform: [{ translateY }] }]}>

        {/* Tap backdrop above ticket to close */}
        <TouchableWithoutFeedback onPress={dismiss}>
          <View style={styles.tapClose} />
        </TouchableWithoutFeedback>

        {/* Ticket — single unified surface */}
        <View style={styles.ticket}>
          {/* Clipped background shell — overflow:hidden here clips blur to rounded corners
              while the outer ticket stays overflow:visible so notches can extend outside */}
          <View style={[StyleSheet.absoluteFill, styles.ticketBgClip]}>
            <BlurView intensity={BLUR_INTENSITY} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.ticketTint]} />
            {/* Venue atmosphere — constrained to topHeight so it stops exactly at the separator.
                Lives in ticketBgClip so rounded corners clip it correctly. */}
            {event?.image && topHeight > 0 && (
              <View
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: topHeight + (SEPARATOR_HEIGHT / 2) }}
                pointerEvents="none"
              >
                <Image
                  source={{ uri: event.image }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                  blurRadius={1.5} />
                {/* Uniform dim */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18, 22, 32, 0.85)' }]} />
                {/* Vignette edges — fade from ticket bg color → transparent
                    Adjust the height/width values (48) to make edges wider/narrower */}
                <LinearGradient
                  colors={['rgba(18,22,32,0.95)', 'transparent']}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 68 }}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={['rgba(18,22,32,0.85)', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 68 }}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={['rgba(18,22,32,0.85)', 'transparent']}
                  start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }}
                  style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 68 }}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={['rgba(18,22,32,0.95)', 'transparent']}
                  start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 68 }}
                  pointerEvents="none"
                />
              </View>

            )}
          </View>

          {/* TOP — measure height so we can place notches */}
          <View
            style={styles.ticketTop}
            onLayout={(e) => setTopHeight(e.nativeEvent.layout.height)}
            {...panResponder.panHandlers}
          >
            <View style={styles.ticketDragStrip}>
              <View style={styles.handleBar} />
            </View>
            {getTopSection(event, liveScore, isFetching)}
          </View>

          {/* Separator — sits above ticketBottom via zIndex */}
          <View style={styles.separator}>
            <DashedLine />
          </View>

          {/* Scrollable bottom — pulled up by half separator height so clip edge = dashed line */}
          <View style={styles.ticketBottom}>
            <ScrollView
              style={styles.bottomScroll}
              contentContainerStyle={styles.bottomScrollContent}
              showsVerticalScrollIndicator={false}
              bounces
            >
              <BottomContent event={event} onClose={dismiss} onEdit={onEdit} />
            </ScrollView>
            {/* Soft fade at the top to blend the clip edge into the separator */}
            <LinearGradient
              colors={['rgba(18, 22, 32, 0.30)', 'transparent']}
              style={styles.topFade}
              pointerEvents="none"
            />
          </View>

          {/* Notches absolutely positioned on ticket at separator level */}
          {topHeight > 0 && (
            <>
              <View style={[styles.notch, styles.notchLeft, { top: topHeight + (44 - NOTCH_SIZE) / 2 }]} />
              <View style={[styles.notch, styles.notchRight, { top: topHeight + (44 - NOTCH_SIZE) / 2 }]} />
            </>
          )}

        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── DASHED LINE ──────────────────────────────────────────────────────────────

function DashedLine() {
  return (
    <View style={styles.dashedLine}>
      {Array.from({ length: 24 }).map((_, i) => (
        <View key={i} style={styles.dash} />
      ))}
    </View>
  );
}

// ─── TOP SECTION ROUTER ───────────────────────────────────────────────────────

function getTopSection(
  event: EventDetail,
  liveScore?: { homeScore?: number; awayScore?: number; status?: string } | null,
  isFetching?: boolean,
) {
  const t = event.eventType?.toLowerCase() || '';
  if (['nba', 'nfl', 'mlb', 'nhl', 'sports', 'basketball', 'football', 'baseball', 'hockey'].includes(t))
    return <SportsTop event={event} liveScore={liveScore} isFetching={isFetching} />;
  if (['movie', 'film'].includes(t))
    return <MovieTop event={event} />;
  if (['concert', 'music', 'live music'].includes(t))
    return <ConcertTop event={event} />;
  if (['restaurant', 'dining'].includes(t))
    return <RestaurantTop event={event} />;
  if (['nightlife', 'bar', 'club', 'lounge'].includes(t))
    return <NightlifeTop event={event} />;
  return <CustomTop event={event} />;
}

// ─── TOP SECTIONS ─────────────────────────────────────────────────────────────

function TimeAgoBadge({ timeAgo }: { timeAgo?: string }) {
  if (!timeAgo) return null;
  return (
    <View style={styles.timeAgoPill}>
      <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
      <Text style={styles.timeAgoPillText}>{timeAgo}</Text>
    </View>
  );
}

/** Orange season pill — polymorphic, works for any sport with a season field */
function SeasonBadge({ season }: { season?: string }) {
  if (!season || season === 'Unknown') return null;
  return (
    <View style={styles.seasonPill}>
      <Ionicons name="calendar-outline" size={11} color="#FF8A3D" />
      <Text style={styles.seasonPillText}>{season}</Text>
    </View>
  );
}

function VenueDateGrid({ event }: { event: EventDetail }) {
  return (
    <View style={styles.metaGrid}>
      <MetaCell icon="calendar-outline" label="DATE" value={event.date} />
      <MetaCell
        icon="location-outline"
        label="VENUE"
        value={event.venue}
        subtitle={event.venueCity && event.venueState ? `${event.venueCity}, ${event.venueState}` : undefined}
        truncate
      />
    </View>
  );
}

function SportsTop({
  event,
  liveScore,
  isFetching,
}: {
  event: EventDetail;
  liveScore?: { homeScore?: number; awayScore?: number; status?: string } | null;
  isFetching?: boolean;
}) {
  // Merge live data on top of DB data — live takes priority when present
  const displayHome = liveScore?.homeScore ?? event.homeScore;
  const displayAway = liveScore?.awayScore ?? event.awayScore;
  const displayStatus = liveScore?.status ?? event.status;
  const isLiveNow = displayStatus && displayStatus !== 'FINAL' && displayStatus !== 'Upcoming' && displayStatus !== 'UPCOMING';

  const homeWon = displayHome !== undefined && displayAway !== undefined && displayHome > displayAway;
  const awayWon = displayHome !== undefined && displayAway !== undefined && displayAway > displayHome;

  return (
    <View style={styles.topContent}>
      {/* Single top row: season | status | timeago — all horizontally aligned */}
      <View style={styles.pillsRow}>
        <SeasonBadge season={event.season} />
        {displayStatus ? (
          <View style={[styles.statusPill, isLiveNow && styles.statusPillLive]}>
            {isFetching
              ? <ActivityIndicator size="small" color={Colors.textMuted} style={{ marginRight: 4 }} />
              : isLiveNow && <View style={styles.liveDot} />}
            <Text style={[styles.statusText, isLiveNow && styles.statusTextLive]}>{displayStatus}</Text>
          </View>
        ) : <View />}
        <TimeAgoBadge timeAgo={event.timeAgo} />
      </View>

      {/* Teams + Score — away (left) vs home (right), per sports convention */}
      <View style={styles.teamsRow}>
        {/* Away team on the LEFT */}
        <View style={styles.teamBlock}>
          {event.awayTeamLogo ? (
            <Image source={{ uri: event.awayTeamLogo }} style={styles.teamLogo} resizeMode="contain" />
          ) : <LogoFallback eventType={event.eventType} />}
          <Text style={[styles.teamName, { textAlign: 'center' }]} numberOfLines={2}>
            {event.awayTeamName}
          </Text>
        </View>

        <View style={styles.scoreBlock}>
          <Text style={[styles.scoreNum, awayWon ? styles.scoreWin : styles.scoreDim]}>
            {displayAway ?? '–'}
          </Text>
          <Text style={styles.scoreDivider}>–</Text>
          <Text style={[styles.scoreNum, homeWon ? styles.scoreWin : styles.scoreDim]}>
            {displayHome ?? '–'}
          </Text>
        </View>

        {/* Home team on the RIGHT */}
        <View style={[styles.teamBlock, { alignItems: 'center' }]}>
          {event.homeTeamLogo ? (
            <Image source={{ uri: event.homeTeamLogo }} style={styles.teamLogo} resizeMode="contain" />
          ) : <LogoFallback eventType={event.eventType} />}
          <Text style={[styles.teamName, { textAlign: 'center' }]} numberOfLines={2}>
            {event.homeTeamName}
          </Text>
        </View>
      </View>

      <VenueDateGrid event={event} />
    </View>
  );
}

function MovieTop({ event }: { event: EventDetail }) {
  return (
    <View style={styles.topContent}>
      <TimeAgoBadge timeAgo={event.timeAgo} />

      {/* Poster-style title */}
      <Text style={styles.genericTitle}>{event.title}</Text>

      {/* Director + Runtime row */}
      <View style={styles.movieMetaRow}>
        {event.director && (
          <View style={styles.movieMetaPill}>
            <Ionicons name="videocam-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.movieMetaPillText}>{event.director}</Text>
          </View>
        )}
        {event.runtime && (
          <View style={styles.movieMetaPill}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.movieMetaPillText}>{event.runtime} min</Text>
          </View>
        )}
        {event.genre && (
          <View style={styles.movieMetaPill}>
            <Ionicons name="film-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.movieMetaPillText}>{event.genre}</Text>
          </View>
        )}
      </View>

      {/* Cast */}
      {event.cast && event.cast.length > 0 && (
        <View style={styles.castSection}>
          <Text style={styles.castLabel}>CAST</Text>
          <Text style={styles.castText} numberOfLines={2}>
            {event.cast.join(' · ')}
          </Text>
        </View>
      )}

      <VenueDateGrid event={event} />
    </View>
  );
}

function ConcertTop({ event }: { event: EventDetail }) {
  return (
    <View style={styles.topContent}>
      <TimeAgoBadge timeAgo={event.timeAgo} />

      {/* Artist name — hero text */}
      <Text style={styles.genericTitle}>{event.artist || event.title}</Text>

      {/* Tour name banner */}
      {event.tourName && (
        <View style={styles.tourBanner}>
          <Ionicons name="musical-notes-outline" size={13} color={Colors.primaryContainer} />
          <Text style={styles.tourBannerText}>{event.tourName}</Text>
        </View>
      )}

      {/* Opener + genre pills */}
      <View style={styles.movieMetaRow}>
        {event.opener && (
          <View style={styles.movieMetaPill}>
            <Ionicons name="mic-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.movieMetaPillText}>Opener: {event.opener}</Text>
          </View>
        )}
        {event.genre && (
          <View style={styles.movieMetaPill}>
            <Ionicons name="musical-note-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.movieMetaPillText}>{event.genre}</Text>
          </View>
        )}
      </View>

      <VenueDateGrid event={event} />
    </View>
  );
}

function RestaurantTop({ event }: { event: EventDetail }) {
  return (
    <View style={styles.topContent}>
      <TimeAgoBadge timeAgo={event.timeAgo} />

      <Text style={styles.genericTitle}>{event.title}</Text>

      {/* Cuisine + price row */}
      <View style={styles.movieMetaRow}>
        {event.cuisine && (
          <View style={styles.movieMetaPill}>
            <Ionicons name="restaurant-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.movieMetaPillText}>{event.cuisine}</Text>
          </View>
        )}
        {event.priceLevel && (
          <View style={[styles.movieMetaPill, styles.pricePill]}>
            <Text style={styles.priceText}>{event.priceLevel}</Text>
          </View>
        )}
      </View>

      <VenueDateGrid event={event} />
    </View>
  );
}

function NightlifeTop({ event }: { event: EventDetail }) {
  return (
    <View style={styles.topContent}>
      <TimeAgoBadge timeAgo={event.timeAgo} />

      <Text style={styles.genericTitle}>{event.title}</Text>

      {/* Venue type + vibe pills */}
      <View style={styles.movieMetaRow}>
        {event.venueType && (
          <View style={styles.movieMetaPill}>
            <Ionicons name="wine-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.movieMetaPillText}>{event.venueType}</Text>
          </View>
        )}
        {event.vibe && (
          <View style={styles.movieMetaPill}>
            <Ionicons name="sparkles-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.movieMetaPillText}>{event.vibe}</Text>
          </View>
        )}
        {event.musicGenre && (
          <View style={styles.movieMetaPill}>
            <Ionicons name="musical-notes-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.movieMetaPillText}>{event.musicGenre}</Text>
          </View>
        )}
        {event.dressCode && (
          <View style={styles.movieMetaPill}>
            <Ionicons name="shirt-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.movieMetaPillText}>{event.dressCode}</Text>
          </View>
        )}
        {event.priceLevel && (
          <View style={[styles.movieMetaPill, styles.pricePill]}>
            <Text style={styles.priceText}>{event.priceLevel}</Text>
          </View>
        )}
      </View>

      <VenueDateGrid event={event} />
    </View>
  );
}

function CustomTop({ event }: { event: EventDetail }) {
  return (
    <View style={styles.topContent}>
      <TimeAgoBadge timeAgo={event.timeAgo} />

      {/* Large custom icon */}
      <View style={styles.customIconCircle}>
        <Ionicons name={getEventIcon(event.eventType)} size={32} color={Colors.primaryContainer} />
      </View>

      <Text style={styles.genericTitle}>{event.title}</Text>

      <VenueDateGrid event={event} />
    </View>
  );
}

function LogoFallback({ eventType }: { eventType?: string }) {
  return (
    <View style={styles.teamLogoFallback}>
      <Ionicons name={getEventIcon(eventType)} size={28} color={Colors.textMuted} />
    </View>
  );
}

function MetaCell({
  icon, label, value, subtitle, truncate,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  subtitle?: string;
  truncate?: boolean;
}) {
  return (
    <View style={styles.metaCell}>
      <Ionicons name={icon} size={14} color={Colors.textMuted} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={truncate ? 1 : undefined}>{value}</Text>
      {subtitle && <Text style={styles.metaSub}>{subtitle}</Text>}
    </View>
  );
}

// ─── BOTTOM CONTENT ───────────────────────────────────────────────────────────

function BottomContent({ event, onClose, onEdit }: { event: EventDetail; onClose: () => void; onEdit?: (event: EventDetail) => void }) {
  // Photo viewer state — viewerOpen drives visibility, viewerInitialIndex sets starting photo
  // currentIndexRef tracks swipe position WITHOUT causing re-renders (prevents flicker)
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const currentIndexRef = useRef(0);
  // Guard: ignore taps for 400ms after mount to prevent touch bleedthrough from the opener
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  const eventTypeLower = event.eventType?.toLowerCase() || '';
  const isSportsType = ['nba', 'nfl', 'mlb', 'nhl', 'sports', 'basketball', 'football', 'baseball', 'hockey'].includes(eventTypeLower);
  const isMovie = ['movie', 'film'].includes(eventTypeLower);
  const isConcert = ['concert', 'music', 'live music'].includes(eventTypeLower);
  const isRestaurant = ['restaurant', 'dining'].includes(eventTypeLower);
  const isNightlife = ['nightlife', 'bar', 'club', 'lounge'].includes(eventTypeLower);

  return (
    <View style={styles.bottomContent}>
      {/* ── Movie: Watched At ── */}
      {isMovie && event.watchedAt && (
        <>
          <Text style={styles.miniLabel}>WATCHED AT</Text>
          <View style={styles.watchedAtRow}>
            <Ionicons
              name={event.watchedAt.toLowerCase().includes('home') ? 'home-outline' : 'business-outline'}
              size={16}
              color={Colors.primaryContainer}
            />
            <Text style={styles.watchedAtText}>
              {event.theaterName ? `${event.theaterName} · ${event.watchedAt}` : event.watchedAt}
            </Text>
          </View>
          <View style={styles.divider} />
        </>
      )}

      {/* ── Concert: Opener ── */}
      {isConcert && event.opener && (
        <>
          <Text style={styles.miniLabel}>OPENING ACT</Text>
          <View style={styles.watchedAtRow}>
            <Ionicons name="mic-outline" size={16} color={Colors.primaryContainer} />
            <Text style={styles.watchedAtText}>{event.opener}</Text>
          </View>
          <View style={styles.divider} />
        </>
      )}

      {/* ── Concert: Setlist ── */}
      {isConcert && event.setlist && event.setlist.length > 0 && (
        <>
          <Text style={styles.miniLabel}>SETLIST HIGHLIGHTS</Text>
          <View style={styles.setlistBox}>
            {event.setlist.map((song, i) => (
              <View key={i} style={styles.setlistItem}>
                <Text style={styles.setlistNumber}>{i + 1}</Text>
                <Text style={styles.setlistSong}>{song}</Text>
              </View>
            ))}
          </View>
          <View style={styles.divider} />
        </>
      )}

      {/* ── Restaurant: Detail chips ── */}
      {isRestaurant && (event.cuisine || event.priceLevel) && (
        <>
          <Text style={styles.miniLabel}>RESTAURANT DETAILS</Text>
          <View style={styles.chipsRow}>
            {event.cuisine && <InfoChip icon="restaurant-outline" label={event.cuisine} />}
            {event.priceLevel && <InfoChip icon="cash-outline" label={event.priceLevel} />}
          </View>
          <View style={styles.divider} />
        </>
      )}

      {/* ── Nightlife: Vibe + details ── */}
      {isNightlife && (event.venueType || event.vibe || event.musicGenre || event.dressCode) && (
        <>
          <Text style={styles.miniLabel}>VENUE DETAILS</Text>
          <View style={styles.chipsRow}>
            {event.venueType && <InfoChip icon="wine-outline" label={event.venueType} />}
            {event.vibe && <InfoChip icon="sparkles-outline" label={event.vibe} />}
            {event.musicGenre && <InfoChip icon="musical-notes-outline" label={event.musicGenre} />}
            {event.dressCode && <InfoChip icon="shirt-outline" label={event.dressCode} />}
          </View>
          <View style={styles.divider} />
        </>
      )}

      {/* ── Photos ── */}
      {event.photos && event.photos.length > 0 && (() => {
        const openViewer = (i: number) => {
          if (!isReady) return;
          currentIndexRef.current = i;
          setViewerInitialIndex(i);
          setViewerOpen(true);
        };
        return (
          <>
            <Text style={styles.miniLabel}>PHOTOS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -22 }}
              contentContainerStyle={{ paddingHorizontal: 22, gap: 10 }}
            >
              {event.photos.map((photo: any, i: number) => {
                const uri = typeof photo === 'string' ? photo : photo.url;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.85}
                    onPress={() => openViewer(i)}
                  >
                    <Image
                      source={{ uri }}
                      style={isNightlife ? styles.photoLarge : styles.photo}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.divider} />

            {/* Fullscreen viewer — onImageIndexChange uses a ref to avoid re-renders during swipe */}
            <ImageViewing
              images={event.photos.map((photo: any) => ({
                uri: typeof photo === 'string' ? photo : photo.url,
              }))}
              imageIndex={viewerInitialIndex}
              visible={viewerOpen}
              onRequestClose={() => setViewerOpen(false)}
              swipeToCloseEnabled
              doubleTapToZoomEnabled
              onImageIndexChange={(idx) => { currentIndexRef.current = idx; }}
              HeaderComponent={({ imageIndex }) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' }}>
                    {imageIndex + 1} / {event.photos!.length}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setViewerOpen(false)}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
        );
      })()}



      {/* ── Rating (all types) ── */}
      <Text style={styles.miniLabel}>YOUR RATING</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={styles.starsRow}>
          {Array.from({ length: 5 }).map((_, i) => {
            const threshold = i + 1;
            const iconName = event.rating >= threshold
              ? 'star' as const
              : event.rating >= threshold - 0.5
                ? 'star-half' as const
                : 'star-outline' as const;
            return (
              <Ionicons
                key={i}
                name={iconName}
                size={26}
                color={event.rating > i ? '#facc15' : Colors.textMuted}
              />
            );
          })}
          {event.rating > 0 && (
            <Text style={styles.ratingValueLabel}>{Number(event.rating).toFixed(1)}</Text>
          )}
        </View>
        {event.privacy && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Ionicons
              name={event.privacy === 'public' ? 'globe-outline' : event.privacy === 'friends' ? 'people-outline' : 'lock-closed-outline'}
              size={13}
              color={Colors.textMuted}
            />
            <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5 }}>
              {event.privacy === 'public' ? 'Public' : event.privacy === 'friends' ? 'Friends Only' : 'Private'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* ── Notes (all types) ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="document-text-outline" size={16} color={Colors.primaryContainer} />
        <Text style={styles.sectionTitle}>Personal Notes</Text>
      </View>
      <View style={styles.notesBox}>
        {event.note && event.note.trim().length > 0 ? (
          <Text style={styles.notesText}>{event.note}</Text>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 10, gap: 8 }}>
            <Ionicons name="pencil-outline" size={20} color={'rgba(255,255,255,0.2)'} />
            <Text style={{ fontFamily: FontFamily.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              No notes written
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* ── Sports: Box Score Tab ── */}
      {isSportsType && (
        <BoxScoreSection event={event} />
      )}


      {/* ── Info chips ── */}
      <View style={styles.chipsRow}>
        <InfoChip
          icon={getEventIcon(event.eventType)}
          label={event.season ? `${event.eventType} • ${event.season}` : event.eventType}
        />
        {event.season_type === 1 && (
          <InfoChip icon="flag-outline" label="Preseason" color="#4ade80" />
        )}
        {(event.season_type === 2 || (!event.season_type && event.league)) && (
          <InfoChip icon="calendar-outline" label="Regular Season" />
        )}
        {(event.season_type === 3 || event.season_type === 5) && (
          <InfoChip icon="trophy-outline" label={event.round || 'Playoffs'} color="#fb923c" />
        )}
        {event.genre && <InfoChip icon="film-outline" label={event.genre} />}
      </View>

      {/* ── Companions ── */}
      {event.companions && event.companions.length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.miniLabel}>WENT WITH</Text>
          <View style={styles.companionsList}>
            {event.companions.map((c, i) => (
              <View key={i} style={styles.companionItem}>
                {c.avatar ? (
                  <Image source={{ uri: c.avatar }} style={styles.companionAvatar} />
                ) : (
                  <View style={[styles.companionAvatar, styles.companionAvatarFallback]}>
                    <Text style={styles.companionInitial}>{c.name ? c.name[0].toUpperCase() : '?'}</Text>
                  </View>
                )}
                <Text style={styles.companionName}>{c.name || 'Friend'}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.divider} />

      {/* ── Action buttons ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={() => { if (onEdit) { onClose(); setTimeout(() => onEdit(event), 300); } }}>
          <Ionicons name="create-outline" size={18} color={Colors.text} />
          <Text style={styles.editButtonText}>Edit Log</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              'Are you sure?',
              'This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => { if (onDelete) { onClose(); setTimeout(() => onDelete(event), 300); } } }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* ── Close ── */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
        <Text style={styles.closeButtonText}>CLOSE</Text>
      </TouchableOpacity>

    </View>
  );
}

// ─── BOX SCORE SECTION ────────────────────────────────────────────────────────

function BoxScoreSection({ event }: { event: EventDetail }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [boxScoreData, setBoxScoreData] = React.useState<any>(null);
  const [isLoadingBS, setIsLoadingBS] = React.useState(false);
  const [bsError, setBsError] = React.useState<string | null>(null);

  const handleToggle = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    setIsExpanded(true);
    if (boxScoreData) return; // Already loaded

    // Need external_id to call box score API
    const extId = (event as any).external_id;
    if (!extId) {
      setBsError('Box score not available for this game');
      return;
    }

    setIsLoadingBS(true);
    setBsError(null);
    try {
      const league = (event as any).league || 'NBA';
      const data = await api.get<any>(`/api/events/box-score?external_id=${extId}&league=${league}`);
      if (!data.available) {
        setBsError('Box score not available yet');
      } else {
        setBoxScoreData(data.teams);
      }
    } catch (err) {
      setBsError('Failed to load box score');
      console.error('Box score error:', err);
    } finally {
      setIsLoadingBS(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.boxScoreTab}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Ionicons name="stats-chart-outline" size={16} color={Colors.primaryContainer} />
        <Text style={styles.boxScoreTabText}>Box Score</Text>
        <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={14} color={Colors.textMuted} />
      </TouchableOpacity>

      {isExpanded && (
        <View style={{ paddingBottom: 8 }}>
          {isLoadingBS && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Colors.primaryContainer} />
            </View>
          )}
          {bsError && (
            <Text style={{ color: Colors.textMuted, fontSize: 12, fontFamily: FontFamily.bodyMedium, textAlign: 'center', paddingVertical: 12 }}>
              {bsError}
            </Text>
          )}
          {boxScoreData && boxScoreData.map((team: any) => (
            <View key={team.abbreviation} style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: FontFamily.headlineBold, fontSize: 14, color: Colors.primaryContainer, marginBottom: 6 }}>
                {team.full_name}
              </Text>
              {(team.categories || []).map((cat: any, catIdx: number) => {
                const displayLabels = (cat.labels || []).slice(0, 4);
                if (displayLabels.length === 0 || !cat.players?.length) return null;
                return (
                  <View key={catIdx} style={{ marginTop: catIdx > 0 ? 10 : 0 }}>
                    {(team.categories || []).length > 1 && (
                      <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                        {cat.name}
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
                      <Text style={{ flex: 2, fontFamily: FontFamily.bodySemiBold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 }}>PLAYER</Text>
                      {displayLabels.map((label: string, li: number) => (
                        <Text key={li} style={{ width: 36, fontFamily: FontFamily.bodySemiBold, fontSize: 9, color: Colors.textMuted, textAlign: 'center', letterSpacing: 0.5 }}>
                          {label}
                        </Text>
                      ))}
                    </View>
                    {cat.players.slice(0, 6).map((p: any, pi: number) => (
                      <View key={pi} style={{ flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' }}>
                        <Text numberOfLines={1} style={{ flex: 2, fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.text }}>
                          {p.name}
                        </Text>
                        {(p.stats || []).slice(0, 4).map((stat: string, si: number) => (
                          <Text key={si} style={{ width: 36, fontFamily: si === 0 ? FontFamily.bodySemiBold : FontFamily.bodyMedium, fontSize: 12, color: si === 0 ? Colors.text : Colors.textMuted, textAlign: 'center' }}>
                            {stat || '-'}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
      <View style={styles.divider} />
    </>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getEventIcon(eventType?: string): React.ComponentProps<typeof Ionicons>['name'] {
  if (!eventType || typeof eventType !== 'string') return 'calendar-outline';
  const lower = eventType.toLowerCase();
  if (lower.includes('nba') || lower.includes('basketball') || lower.includes('sports')) return 'basketball-outline';
  if (lower.includes('nfl') || lower.includes('football')) return 'american-football-outline';
  if (lower.includes('mlb') || lower.includes('baseball')) return 'baseball-outline';
  if (lower.includes('nhl') || lower.includes('hockey')) return 'snow-outline';
  if (lower.includes('movie') || lower.includes('film')) return 'film-outline';
  if (lower.includes('concert') || lower.includes('music')) return 'musical-notes-outline';
  if (lower.includes('restaurant') || lower.includes('dining')) return 'restaurant-outline';
  if (lower.includes('nightlife') || lower.includes('club') || lower.includes('bar')) return 'wine-outline';
  return 'calendar-outline';
}

function InfoChip({ icon, label, color }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color?: string }) {
  return (
    <View style={[styles.chip, color ? { borderColor: color + '30' } : undefined]}>
      <Ionicons name={icon} size={13} color={color || Colors.textMuted} />
      <Text style={[styles.chipText, color ? { color } : undefined]}>{label}</Text>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.93)',
  },
  contentLayer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  tapClose: {
    height: 100,
  },
  ticketDragStrip: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Single unified ticket surface — one blur, no seams
  ticket: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: TICKET_BORDER,
    overflow: 'visible', // must be visible so notches can extend outside
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  // overflow:hidden wrapper — clips blur+tint to rounded corners
  ticketBgClip: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  // Uniform tint over the whole ticket
  ticketTint: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ticketTop: {
    // no overflow:hidden — rounded corners handled by ticketBgClip
  },
  separator: {
    height: SEPARATOR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2, // renders on top of ticketBottom's overlapping top edge
  },
  notch: {
    position: 'absolute',
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    backgroundColor: 'rgba(3, 7, 18, 0.93)',
    zIndex: 20,
  },
  notchLeft: { left: -(NOTCH_SIZE / 2) },
  notchRight: { right: -(NOTCH_SIZE / 2) },
  dashedLine: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    zIndex: 1,
  },
  dash: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 1,
  },
  ticketBottom: {
    flex: 1,
    overflow: 'hidden', // clips scroll content at this view's top edge = separator midpoint
    marginTop: -(SEPARATOR_HEIGHT / 2), // pull up so top edge aligns with dashed line
    zIndex: 1,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    zIndex: 5,
  },
  bottomScroll: {
    flex: 1,
  },
  bottomScrollContent: {
    flexGrow: 1,
  },

  // ── Top content — compact (~60% original height) ──
  topContent: {
    padding: 14,
  },
  statusPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(18, 22, 32, 0.78)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusPillLive: {
    borderColor: 'rgba(0, 255, 194, 0.35)',
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
  },
  statusText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 2.5,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  statusTextLive: {
    color: Colors.primaryContainer,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff4444',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  // Team block — logo + name stacked, ~25% from each edge
  teamBlock: {
    width: '33%',
    alignItems: 'center',
  },
  teamLogo: {
    width: 52,
    height: 52,
    marginBottom: 5,
  },
  teamLogoFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  scoreNum: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  scoreWin: { color: Colors.text },
  scoreDim: { color: 'rgba(255,255,255,0.55)' },
  scoreDivider: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 18,
    color: 'rgba(255,255,255,0.15)',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  teamNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  teamName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.2,
    color: Colors.text,
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metaCell: {
    flex: 1,
    backgroundColor: 'rgba(18, 22, 32, 0.78)',
    borderRadius: 10,
    padding: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    gap: 2,
  },
  metaLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 2,
    color: Colors.textMuted,
  },
  metaValue: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 12,
    color: Colors.text,
  },
  metaSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  genericTitle: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: FontSize['2xl'],
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 18,
    textAlign: 'center',
  },

  // ── Bottom content ───────────────────────
  // Pills row — inline, aligns with grid outer edges
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  timeAgoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18, 22, 32, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  timeAgoPillText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  seasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18, 22, 32, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 61, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  seasonPillText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: '#FF8A3D',
    letterSpacing: 0.5,
  },
  bottomContent: {
    padding: 22,
    paddingTop: 22 + SEPARATOR_HEIGHT / 2, // compensate for ticketBottom's negative marginTop
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.headlineBold,
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  notesBox: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  notesText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 18,
  },
  miniLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 2.5,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  ratingValueLabel: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 14,
    color: '#facc15',
    marginLeft: 8,
  },
  photo: {
    width: 140,
    height: 100,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  photoLarge: {
    width: 200,
    height: 150,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  chipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.textMuted,
  },
  companionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  companionItem: {
    alignItems: 'center',
    gap: 6,
  },
  companionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: TICKET_BORDER,
  },
  companionAvatarFallback: {
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companionInitial: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 16,
    color: Colors.text,
  },
  companionName: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 113, 108, 0.15)',
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 113, 108, 0.3)',
  },
  deleteButtonText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 15,
    color: Colors.error,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TICKET_BORDER,
  },
  editButtonText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 15,
    color: Colors.text,
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 32,
  },
  closeButtonText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 3,
    color: Colors.textMuted,
  },

  // ── Type-specific top styles ──────────────────────────────
  movieMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  movieMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  movieMetaPillText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: Colors.textMuted,
  },
  castSection: {
    marginBottom: 14,
  },
  castLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 2.5,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  castText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tourBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  tourBannerText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.primaryContainer,
  },
  pricePill: {
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderColor: 'rgba(250, 204, 21, 0.25)',
  },
  priceText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 12,
    color: '#facc15',
    letterSpacing: 1,
  },
  customIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },

  // ── Type-specific bottom styles ──────────────────────────
  boxScoreTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  boxScoreTabText: {
    flex: 1,
    fontFamily: FontFamily.headlineBold,
    fontSize: 14,
    color: Colors.text,
  },
  watchedAtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  watchedAtText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  setlistBox: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  setlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  setlistNumber: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.textMuted,
    width: 18,
    textAlign: 'right',
  },
  setlistSong: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  // Venue atmosphere background (top half of ticket)
  venueAtmosphereContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%', // covers top portion only
    overflow: 'hidden',
  },
  venueAtmosphereDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 8, 18, 0.82)',
  },
  venueAtmosphereFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});
