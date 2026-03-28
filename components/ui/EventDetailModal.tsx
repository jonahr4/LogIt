/**
 * LogIt — Event Detail Modal
 * Ticket fills full remaining screen height — bottom flows off edge, no gap.
 * Drag handle dismisses. Bottom content scrolls internally.
 */

import React, { useRef, useEffect } from 'react';
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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';

const NOTCH_SIZE = 30;
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
  eventType: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore?: number;
  awayScore?: number;
  status?: string;
  rating: number;
  note: string;
  companions?: Array<{ name: string; avatar?: string }>;
};

interface Props {
  event: EventDetail | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: Props) {
  const translateY = useRef(new Animated.Value(800)).current;
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

  const isSports = !!(event.homeTeamName && event.awayTeamName);

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
          {/* One BlurView covers the whole ticket — no seams */}
          <BlurView
            intensity={BLUR_INTENSITY}
            tint="dark"
            style={[StyleSheet.absoluteFill, styles.ticketBlur]}
          />
          <View style={[StyleSheet.absoluteFill, styles.ticketTint]} />

          {/* TOP — transparent, drag handle at top */}
          <View style={styles.ticketTop}>
            <View style={styles.ticketDragStrip} {...panResponder.panHandlers}>
              <View style={styles.handleBar} />
            </View>
            {isSports ? <SportsTop event={event} /> : <GenericTop event={event} />}
          </View>

          {/* SEPARATOR — transparent, notches punch through side borders */}
          <View style={styles.separator}>
            <View style={[styles.notch, styles.notchLeft]} />
            <DashedLine />
            <View style={[styles.notch, styles.notchRight]} />
          </View>

          {/* BOTTOM — flex:1, scrollable, transparent */}
          <View style={styles.ticketBottom}>
            <ScrollView
              style={styles.bottomScroll}
              contentContainerStyle={styles.bottomScrollContent}
              showsVerticalScrollIndicator={false}
              bounces
            >
              <BottomContent event={event} onClose={dismiss} />
            </ScrollView>
          </View>

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

// ─── TOP SECTIONS ─────────────────────────────────────────────────────────────

function SportsTop({ event }: { event: EventDetail }) {
  const homeWon =
    event.homeScore !== undefined &&
    event.awayScore !== undefined &&
    event.homeScore > event.awayScore;
  const awayWon =
    event.homeScore !== undefined &&
    event.awayScore !== undefined &&
    event.awayScore > event.homeScore;

  return (
    <View style={styles.topContent}>
      {event.status && (
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{event.status}</Text>
        </View>
      )}

      <View style={styles.teamsRow}>
        <View style={styles.teamBlock}>
          {event.homeTeamLogo ? (
            <Image source={{ uri: event.homeTeamLogo }} style={styles.teamLogo} resizeMode="contain" />
          ) : <LogoFallback />}
        </View>

        <View style={styles.scoreBlock}>
          <Text style={[styles.scoreNum, homeWon ? styles.scoreWin : styles.scoreDim]}>
            {event.homeScore ?? '–'}
          </Text>
          <Text style={styles.scoreDivider}>–</Text>
          <Text style={[styles.scoreNum, awayWon ? styles.scoreWin : styles.scoreDim]}>
            {event.awayScore ?? '–'}
          </Text>
        </View>

        <View style={styles.teamBlock}>
          {event.awayTeamLogo ? (
            <Image source={{ uri: event.awayTeamLogo }} style={styles.teamLogo} resizeMode="contain" />
          ) : <LogoFallback />}
        </View>
      </View>

      <View style={styles.teamNamesRow}>
        <Text style={[styles.teamName, { textAlign: 'left' }]} numberOfLines={1}>
          {event.homeTeamName}
        </Text>
        <Text style={[styles.teamName, { textAlign: 'right' }]} numberOfLines={1}>
          {event.awayTeamName}
        </Text>
      </View>

      <View style={styles.metaGrid}>
        <MetaCell icon="calendar-outline" label="DATE" value={event.date} />
        <MetaCell icon="location-outline" label="VENUE" value={event.venue} truncate />
      </View>
    </View>
  );
}

function GenericTop({ event }: { event: EventDetail }) {
  return (
    <View style={styles.topContent}>
      <Text style={styles.genericTitle}>{event.title}</Text>
      <View style={styles.metaGrid}>
        <MetaCell icon="calendar-outline" label="DATE" value={event.date} />
        <MetaCell icon="location-outline" label="VENUE" value={event.venue} truncate />
      </View>
    </View>
  );
}

function LogoFallback() {
  return (
    <View style={styles.teamLogoFallback}>
      <Ionicons name="basketball" size={28} color={Colors.textMuted} />
    </View>
  );
}

function MetaCell({
  icon, label, value, truncate,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <View style={styles.metaCell}>
      <Ionicons name={icon} size={14} color={Colors.textMuted} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={truncate ? 1 : undefined}>{value}</Text>
    </View>
  );
}

// ─── BOTTOM CONTENT ───────────────────────────────────────────────────────────

function BottomContent({ event, onClose }: { event: EventDetail; onClose: () => void }) {
  return (
    <View style={styles.bottomContent}>

      {/* Notes */}
      <View style={styles.sectionHeader}>
        <Ionicons name="document-text-outline" size={16} color={Colors.primaryContainer} />
        <Text style={styles.sectionTitle}>Personal Notes</Text>
      </View>
      <View style={styles.notesBox}>
        <Text style={styles.notesText}>{event.note}</Text>
      </View>

      <View style={styles.divider} />

      {/* Rating */}
      <Text style={styles.miniLabel}>YOUR RATING</Text>
      <View style={styles.starsRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < event.rating ? 'star' : 'star-outline'}
            size={26}
            color={i < event.rating ? '#facc15' : Colors.textMuted}
          />
        ))}
      </View>

      <View style={styles.divider} />

      {/* Info chips */}
      <View style={styles.chipsRow}>
        <InfoChip icon="basketball-outline" label={event.eventType} />
        {event.status && <InfoChip icon="checkmark-circle-outline" label={event.status} />}
        <InfoChip icon="time-outline" label={event.timeAgo} />
      </View>

      {/* Companions */}
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
                    <Text style={styles.companionInitial}>{c.name[0].toUpperCase()}</Text>
                  </View>
                )}
                <Text style={styles.companionName}>{c.name}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.divider} />

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.shareButton} activeOpacity={0.8}>
          <Ionicons name="share-outline" size={18} color={Colors.background} />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={18} color={Colors.text} />
          <Text style={styles.editButtonText}>Edit Log</Text>
        </TouchableOpacity>
      </View>

      {/* Close */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
        <Text style={styles.closeButtonText}>CLOSE</Text>
      </TouchableOpacity>

    </View>
  );
}

function InfoChip({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={13} color={Colors.textMuted} />
      <Text style={styles.chipText}>{label}</Text>
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
  },
  tapClose: {
    height: 64,
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
  // BlurView clipped to rounded top corners
  ticketBlur: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  // Uniform tint over the whole ticket
  ticketTint: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  ticketTop: {
    // transparent — background comes from parent
  },
  separator: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'visible',
  },
  notch: {
    position: 'absolute',
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    backgroundColor: 'rgba(3, 7, 18, 0.93)',
    top: (44 - NOTCH_SIZE) / 2,
    zIndex: 10,
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
    overflow: 'hidden', // clips scroll content
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: TICKET_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  statusText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 2.5,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teamBlock: {
    width: 52,
    alignItems: 'center',
  },
  teamLogo: { width: 42, height: 42 },
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
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -2,
  },
  scoreWin: { color: Colors.text },
  scoreDim: { color: 'rgba(255,255,255,0.28)' },
  scoreDivider: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 18,
    color: 'rgba(255,255,255,0.15)',
    marginBottom: 2,
  },
  teamNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  teamName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.textMuted,
    width: 52,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metaCell: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    padding: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 3,
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
  genericTitle: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: FontSize['2xl'],
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 18,
    textAlign: 'center',
  },

  // ── Bottom content ───────────────────────
  bottomContent: {
    padding: 22,
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
    gap: 3,
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
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 15,
    borderRadius: 16,
  },
  shareButtonText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 15,
    color: Colors.background,
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
});
