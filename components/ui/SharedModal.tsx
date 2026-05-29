/**
 * SharedModal — Unified modal shell for all app modals.
 * 
 * Provides: dark overlay, glass card with BlurView, drag handle,
 * header (title + close), and scrollable content area.
 * 
 * All modals (Social, Settings, Stats, etc.) render their unique
 * content as children. Change the look here → changes everywhere.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontFamily } from '@/constants/typography';

// ─── Config ───────────────────────────────────────────────────────────────────

const DISMISS_THRESHOLD = 120;
const DISMISS_VELOCITY = 0.7;
const BORDER = 'rgba(255, 255, 255, 0.1)';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SharedModalProps {
  /** Controls visibility */
  visible: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Header title text */
  title: string;
  /** Content rendered inside the scrollable area */
  children: React.ReactNode;
  /** Optional: content rendered between header and scroll (e.g., tab pills) — not scrollable */
  stickyContent?: React.ReactNode;
  /** Optional: disable scroll (for custom scroll inside children) */
  noScroll?: boolean;
  /** Optional: custom scroll content padding */
  scrollPadding?: { paddingHorizontal?: number; paddingTop?: number };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SharedModal({
  visible,
  onClose,
  title,
  children,
  stickyContent,
  noScroll = false,
  scrollPadding,
}: SharedModalProps) {
  const translateY = useRef(new Animated.Value(900)).current;
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(900);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: 1200,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      onCloseRef.current();
    });
  };

  const overlayOpacity = translateY.interpolate({
    inputRange: [0, 400],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > DISMISS_VELOCITY) {
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

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      {/* Dim overlay */}
      <Animated.View style={[s.overlay, { opacity: overlayOpacity }]} pointerEvents="none" />

      {/* Draggable content */}
      <Animated.View style={[s.contentLayer, { transform: [{ translateY }] }]}>
        {/* Tap backdrop to close */}
        <TouchableWithoutFeedback onPress={dismiss}>
          <View style={s.tapClose} />
        </TouchableWithoutFeedback>

        {/* Card */}
        <View style={s.card}>
          {/* Glass background */}
          <View style={[StyleSheet.absoluteFill, s.cardBgClip]}>
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, s.cardTint]} />
          </View>

          {/* Drag zone — handle + header, whole area is draggable */}
          <View {...panResponder.panHandlers}>
            <View style={s.dragStrip}>
              <View style={s.handleBar} />
            </View>

            {/* Header row */}
            <View style={s.header}>
              <Text style={s.headerTitle}>{title}</Text>
              <TouchableOpacity onPress={dismiss} style={s.closeButton} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Optional sticky content (tabs, filters, etc.) */}
          {stickyContent}

          {/* Scrollable content */}
          {noScroll ? (
            <View style={{ flex: 1 }}>{children}</View>
          ) : (
            <ScrollView
              contentContainerStyle={[s.scrollContent, scrollPadding]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
              <View style={{ height: 60 }} />
            </ScrollView>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Shared sub-components for modal content ──────────────────────────────────

/** Section header label (e.g., "ACCOUNT & PROFILE") */
export function ModalSectionHeader({ title }: { title: string }) {
  if (!title) return <View style={{ height: 16 }} />;
  return <Text style={s.sectionHeader}>{title}</Text>;
}

/** Grouped card container for rows */
export function ModalSectionCard({ children }: { children: React.ReactNode }) {
  return <View style={s.sectionCard}>{children}</View>;
}

/** Thin divider between rows (indented past icon) */
export function ModalDivider() {
  return <View style={s.divider} />;
}

/** Standard row: icon circle + label + optional subtitle + right element */
export function ModalRow({
  icon,
  label,
  subtitle,
  rightElement,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.6}>
      <View style={s.rowLeft}>
        <View style={[s.iconCircle, danger && s.iconCircleDanger]}>
          <Ionicons name={icon} size={20} color={danger ? Colors.error : Colors.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
          {subtitle ? <Text style={s.rowSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightElement ?? (
        <Ionicons name={'chevron-forward' as const} size={18} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

/** Green accent pill (e.g., "Public") */
export function ModalPill({ label }: { label: string }) {
  return (
    <View style={s.valuePill}>
      <Text style={s.valuePillText}>{label}</Text>
    </View>
  );
}

/** Muted right-aligned text (e.g., "1.0.0 (build 1)") */
export function ModalRightText({ text }: { text: string }) {
  return <Text style={s.rightText}>{text}</Text>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Overlay + layout
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.93)',
  },
  contentLayer: {
    flex: 1,
  },
  tapClose: {
    height: 80,
  },

  // Card — glass ticket style
  card: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  cardBgClip: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  cardTint: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  // Drag handle
  dragStrip: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Section building blocks
  sectionHeader: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginLeft: 70,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDanger: {
    backgroundColor: 'rgba(255, 113, 108, 0.1)',
    borderColor: 'rgba(255, 113, 108, 0.2)',
  },
  rowLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 0.2,
  },
  rowSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Right elements
  valuePill: {
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  valuePillText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  rightText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.textMuted,
  },
});
