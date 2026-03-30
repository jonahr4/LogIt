/**
 * LogIt — Edit/Create Log Modal
 * Mirrors the ticket-style EventDetailModal design but with editable input fields.
 * Used for both creating new logs and editing existing ones.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  type GestureResponderEvent,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadPhoto, deletePhotoFromStorage } from '@/lib/firebaseStorage';
import { api } from '@/lib/api';
import { firebaseAuth } from '@/lib/firebase';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import type { EventDetail } from './EventDetailModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTCH_SIZE = 30;
const SEPARATOR_HEIGHT = 44;
const TICKET_BORDER = 'rgba(255, 255, 255, 0.1)';
const BLUR_INTENSITY = 50;
const DISMISS_THRESHOLD = 120;
const DISMISS_VELOCITY = 0.7;
const INPUT_BG = 'rgba(0,0,0,0.35)';
const INPUT_BORDER = 'rgba(255,255,255,0.07)';

const PRIVACY_OPTIONS = ['public', 'friends', 'private'] as const;
const PRICE_LEVELS = ['$', '$$', '$$$', '$$$$'] as const;
const VENUE_TYPES = ['Club', 'Bar', 'Lounge', 'Rooftop', 'Pub'] as const;
const WATCHED_AT_OPTIONS = ['Theater', 'Home', 'Drive-In', 'Streaming'] as const;
const SPORT_OPTIONS = ['Basketball', 'Football', 'Baseball', 'Hockey'] as const;

type PhotoEntry = { localUri?: string; id?: string; url?: string; firebase_path?: string; uploading?: boolean };

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<EventDetail>) => void;
  event?: any | null; // Edit mode — pre-fills (any used for mock fallback)
  eventType?: string;         // Create mode — determines type section
  mode?: 'create' | 'edit';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditLogModal({ visible, onClose, onSave, event, eventType, mode }: EditLogModalProps) {
  const translateY = useRef(new Animated.Value(800)).current;
  const [topHeight, setTopHeight] = useState(0);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Determine effective type
  const effectiveType = event?.eventType || eventType || 'custom';
  const isEdit = mode ? mode === 'edit' : !!event;
  const canEditCanonical = event ? effectiveType === 'manual' : true;

  // ─── Form state ──────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [venueState, setVenueState] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(0);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [companionInput, setCompanionInput] = useState('');
  const [companions, setCompanions] = useState<Array<{ name: string }>>([]);

  // Photos
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  // Sports
  const [sport, setSport] = useState('');
  const [league, setLeague] = useState('');
  const [season, setSeason] = useState('');
  const [homeTeamName, setHomeTeamName] = useState('');
  const [awayTeamName, setAwayTeamName] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [status, setStatus] = useState('');

  // Movie
  const [director, setDirector] = useState('');
  const [genre, setGenre] = useState('');
  const [runtime, setRuntime] = useState('');
  const [castInput, setCastInput] = useState('');
  const [watchedAt, setWatchedAt] = useState('');
  const [theaterName, setTheaterName] = useState('');

  // Concert
  const [artist, setArtist] = useState('');
  const [tourName, setTourName] = useState('');
  const [opener, setOpener] = useState('');
  const [concertGenre, setConcertGenre] = useState('');
  const [setlistInput, setSetlistInput] = useState('');
  const [setlist, setSetlist] = useState<string[]>([]);

  // Restaurant
  const [cuisine, setCuisine] = useState('');
  const [priceLevel, setPriceLevel] = useState('');

  // Nightlife
  const [venueType, setVenueType] = useState('');
  const [vibe, setVibe] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [musicGenre, setMusicGenre] = useState('');
  const [nightlifePriceLevel, setNightlifePriceLevel] = useState('');

  // ─── Pre-fill from event (edit mode) ─────────────────────────────────
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setVenue(event.venue || '');
      setVenueCity(event.venueCity || '');
      setVenueState(event.venueState || '');
      setDate(event.date || '');
      setNote(event.note || '');
      setRating(event.rating || 0);
      setPrivacy(event.privacy || 'public');
      setCompanions(event.companions?.map((c: any) => ({ name: c.name })) || []);
      // Pre-fill photos from existing log
      if (event.photos && Array.isArray(event.photos)) {
        setPhotos(event.photos.map((p: any) => ({ id: p.id, url: p.url, firebase_path: p.firebase_path })));
      } else {
        setPhotos([]);
      }
      // Sports
      setSport(event.sport || '');
      setLeague(event.league || '');
      setSeason(event.season || '');
      setHomeTeamName(event.homeTeamName || '');
      setAwayTeamName(event.awayTeamName || '');
      setHomeScore(event.homeScore?.toString() || '');
      setAwayScore(event.awayScore?.toString() || '');
      setStatus(event.status || '');
      // Movie
      setDirector(event.director || '');
      setGenre(event.genre || '');
      setRuntime(event.runtime?.toString() || '');
      setCastInput(event.cast?.join(', ') || '');
      setWatchedAt(event.watchedAt || '');
      setTheaterName(event.theaterName || '');
      // Concert
      setArtist(event.artist || '');
      setTourName(event.tourName || '');
      setOpener(event.opener || '');
      setConcertGenre(event.genre || '');
      setSetlist(event.setlist || []);
      // Restaurant
      setCuisine(event.cuisine || '');
      setPriceLevel(event.priceLevel || '');
      // Nightlife
      setVenueType(event.venueType || '');
      setVibe(event.vibe || '');
      setDressCode(event.dressCode || '');
      setMusicGenre(event.musicGenre || '');
      setNightlifePriceLevel(event.priceLevel || '');
    } else {
      // Reset for create mode
      setTitle(''); setVenue(''); setVenueCity(''); setVenueState('');
      setDate(''); setNote(''); setRating(0); setPrivacy('public');
      setCompanions([]); setCompanionInput('');
      setSport(''); setLeague(''); setSeason('');
      setHomeTeamName(''); setAwayTeamName('');
      setHomeScore(''); setAwayScore(''); setStatus('');
      setDirector(''); setGenre(''); setRuntime('');
      setCastInput(''); setWatchedAt(''); setTheaterName('');
      setArtist(''); setTourName(''); setOpener('');
      setConcertGenre(''); setSetlist([]); setSetlistInput('');
      setCuisine(''); setPriceLevel('');
      setVenueType(''); setVibe(''); setDressCode('');
      setMusicGenre(''); setNightlifePriceLevel('');
      setPhotos([]);
    }
  }, [event]);

  // ─── Entrance / exit animations ──────────────────────────────────────
  useEffect(() => {
    if (visible) {
      translateY.setValue(800);
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: 900,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(800);
      onCloseRef.current();
    });
  }, [translateY]);

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

  // ─── Photo handlers ──────────────────────────────────────────────────

  const MAX_PHOTOS = 10;

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as const,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (result.canceled || !result.assets?.length) return;

    const userId = firebaseAuth.currentUser?.uid;
    if (!userId || !event?.id) {
      Alert.alert('Error', 'Cannot upload photos without a saved log.');
      return;
    }

    // Add all selected photos as uploading placeholders
    const startIndex = photos.length;
    const tempEntries: PhotoEntry[] = result.assets.map(a => ({ localUri: a.uri, uploading: true }));
    setPhotos(prev => [...prev, ...tempEntries]);

    // Upload each photo in parallel
    await Promise.all(
      result.assets.map(async (asset, offset) => {
        const index = startIndex + offset;
        try {
          const { url, firebasePath } = await uploadPhoto(asset.uri, userId, event.id);
          const response = await api.post<{ photo: { id: string; url: string; firebase_path: string; display_order: number } }>(
            '/api/logs/photos',
            { log_id: event.id, firebase_path: firebasePath, url, display_order: index }
          );
          setPhotos(prev => {
            const updated = [...prev];
            updated[index] = { id: response.photo.id, url: response.photo.url, firebase_path: response.photo.firebase_path };
            return updated;
          });
        } catch (err: any) {
          setPhotos(prev => prev.map((p, i) => i === index ? {} : p).filter(p => Object.keys(p).length > 0));
          Alert.alert('Upload failed', `Photo ${offset + 1}: ${err?.message || 'Could not upload.'}`);
        }
      })
    );
  };

  const handleRemovePhoto = async (index: number) => {
    const photo = photos[index];
    // Optimistic removal
    setPhotos(prev => prev.filter((_, i) => i !== index));

    try {
      if (photo.firebase_path) {
        await deletePhotoFromStorage(photo.firebase_path);
      }
      if (photo.id) {
        await api.delete('/api/logs/photos', { photo_id: photo.id });
      }
    } catch (err: any) {
      // Restore on failure
      setPhotos(prev => {
        const restored = [...prev];
        restored.splice(index, 0, photo);
        return restored;
      });
      Alert.alert('Error', 'Could not remove photo. Please try again.');
    }
  };

  // ─── Save handler ────────────────────────────────────────────────────

  const handleSave = () => {
    const data: Partial<EventDetail> = {
      title,
      venue,
      venueCity,
      venueState,
      date,
      note,
      rating,
      privacy,
      eventType: effectiveType,
      companions: companions.map(c => ({ name: c.name })),
    };

    const t = effectiveType.toLowerCase();

    if (['nba', 'nfl', 'mlb', 'nhl', 'sports', 'basketball', 'football', 'baseball', 'hockey'].includes(t)) {
      data.sport = sport;
      data.league = league;
      data.season = season;
      data.homeTeamName = homeTeamName;
      data.awayTeamName = awayTeamName;
      data.homeScore = homeScore ? parseInt(homeScore) : undefined;
      data.awayScore = awayScore ? parseInt(awayScore) : undefined;
      data.status = status;
    }

    if (['movie', 'film'].includes(t)) {
      data.director = director;
      data.genre = genre;
      data.runtime = runtime ? parseInt(runtime) : undefined;
      data.cast = castInput ? castInput.split(',').map(s => s.trim()).filter(Boolean) : undefined;
      data.watchedAt = watchedAt;
      data.theaterName = theaterName;
    }

    if (['concert', 'music', 'live music'].includes(t)) {
      data.artist = artist;
      data.tourName = tourName;
      data.opener = opener;
      data.genre = concertGenre;
      data.setlist = setlist;
    }

    if (['restaurant', 'dining'].includes(t)) {
      data.cuisine = cuisine;
      data.priceLevel = priceLevel;
    }

    if (['nightlife', 'bar', 'club', 'lounge'].includes(t)) {
      data.venueType = venueType;
      data.vibe = vibe;
      data.dressCode = dressCode;
      data.musicGenre = musicGenre;
      data.priceLevel = nightlifePriceLevel;
    }

    onSave(data);
    dismiss();
  };

  // ─── Add companion helper ────────────────────────────────────────────
  const addCompanion = () => {
    const name = companionInput.trim();
    if (name) {
      setCompanions([...companions, { name }]);
      setCompanionInput('');
    }
  };

  const removeCompanion = (index: number) => {
    setCompanions(companions.filter((_, i) => i !== index));
  };

  // ─── Add setlist item helper ─────────────────────────────────────────
  const addSetlistItem = () => {
    const song = setlistInput.trim();
    if (song) {
      setSetlist([...setlist, song]);
      setSetlistInput('');
    }
  };

  const removeSetlistItem = (index: number) => {
    setSetlist(setlist.filter((_, i) => i !== index));
  };

  if (!visible) return null;

  const typeLabel = getTypeLabel(effectiveType);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Animated.View
        style={[styles.overlayBg, { opacity: overlayOpacity }]}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.contentLayer, { transform: [{ translateY }] }]}>
          <TouchableWithoutFeedback onPress={dismiss}>
            <View style={styles.tapClose} />
          </TouchableWithoutFeedback>

          <View style={styles.ticket}>
            <View style={[StyleSheet.absoluteFill, styles.ticketBgClip]}>
              <BlurView intensity={BLUR_INTENSITY} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, styles.ticketTint]} />
            </View>

            {/* TOP — badge + title only */}
            <View
              style={styles.ticketTop}
              onLayout={(e) => setTopHeight(e.nativeEvent.layout.height)}
            >
              {/* Draggable zone: handle bar + header badge */}
              <View {...panResponder.panHandlers}>
                <View style={styles.ticketDragStrip}>
                  <View style={styles.handleBar} />
                </View>

                {/* Header badge */}
                <View style={styles.editHeader}>
                  <View style={styles.editBadge}>
                    <Ionicons name={getEventIcon(effectiveType)} size={16} color={Colors.primaryContainer} />
                    <Text style={styles.editBadgeText}>
                      {isEdit ? 'Edit' : 'New'} {typeLabel}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Title + Rating */}
              <View style={styles.topContent}>
                <LabeledInput label="TITLE" value={title} onChangeText={setTitle} placeholder={`e.g. ${getPlaceholder(effectiveType, 'title')}`} editable={canEditCanonical} />

                <Text style={styles.miniLabel}>YOUR RATING</Text>
                <HalfStarRating value={rating} onChange={setRating} size={30} />
              </View>
            </View>

            {/* Separator */}
            <View style={styles.separator}>
              <DashedLine />
            </View>

            {/* BOTTOM — everything else scrolls */}
            <View style={styles.ticketBottom}>
              <ScrollView
                style={styles.bottomScroll}
                contentContainerStyle={styles.bottomScrollContent}
                showsVerticalScrollIndicator={false}
                bounces
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.bottomContent}>

                  {/* Venue / Location / Date */}
                  <Text style={styles.miniLabel}>LOCATION & DATE</Text>
                  <LabeledInput label="VENUE" value={venue} onChangeText={setVenue} placeholder="Venue name" editable={canEditCanonical} />
                  <View style={styles.inputRow}>
                    <View style={{ flex: 1 }}>
                      <LabeledInput label="CITY" value={venueCity} onChangeText={setVenueCity} placeholder="City" editable={canEditCanonical} />
                    </View>
                    <View style={{ flex: 0.6 }}>
                      <LabeledInput label="STATE" value={venueState} onChangeText={setVenueState} placeholder="ST" editable={canEditCanonical} />
                    </View>
                  </View>
                  <LabeledInput label="DATE" value={date} onChangeText={setDate} placeholder="Mar 15, 2026" editable={canEditCanonical} />

                  <View style={styles.divider} />

                  {/* Type-specific fields */}
                  <TypeSpecificInputs
                    type={effectiveType}
                    canEditCanonical={canEditCanonical}
                    // Sports
                    sport={sport} setSport={setSport}
                    league={league} setLeague={setLeague}
                    season={season} setSeason={setSeason}
                    homeTeamName={homeTeamName} setHomeTeamName={setHomeTeamName}
                    awayTeamName={awayTeamName} setAwayTeamName={setAwayTeamName}
                    homeScore={homeScore} setHomeScore={setHomeScore}
                    awayScore={awayScore} setAwayScore={setAwayScore}
                    status={status} setStatus={setStatus}
                    // Movie
                    director={director} setDirector={setDirector}
                    genre={genre} setGenre={setGenre}
                    runtime={runtime} setRuntime={setRuntime}
                    castInput={castInput} setCastInput={setCastInput}
                    watchedAt={watchedAt} setWatchedAt={setWatchedAt}
                    theaterName={theaterName} setTheaterName={setTheaterName}
                    // Concert
                    artist={artist} setArtist={setArtist}
                    tourName={tourName} setTourName={setTourName}
                    opener={opener} setOpener={setOpener}
                    concertGenre={concertGenre} setConcertGenre={setConcertGenre}
                    setlist={setlist} setlistInput={setlistInput}
                    setSetlistInput={setSetlistInput}
                    addSetlistItem={addSetlistItem}
                    removeSetlistItem={removeSetlistItem}
                    // Restaurant
                    cuisine={cuisine} setCuisine={setCuisine}
                    priceLevel={priceLevel} setPriceLevel={setPriceLevel}
                    // Nightlife
                    venueType={venueType} setVenueType={setVenueType}
                    vibe={vibe} setVibe={setVibe}
                    dressCode={dressCode} setDressCode={setDressCode}
                    musicGenre={musicGenre} setMusicGenre={setMusicGenre}
                    nightlifePriceLevel={nightlifePriceLevel} setNightlifePriceLevel={setNightlifePriceLevel}
                  />

                  <View style={styles.divider} />



                  {/* Notes */}
                  <Text style={styles.miniLabel}>PERSONAL NOTES</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="How was the experience?"
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <View style={styles.divider} />

                  {/* Photos — below notes, edit mode only (requires saved log_id) */}
                  <Text style={styles.miniLabel}>PHOTOS</Text>
                  {isEdit ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.photoRow}
                    >
                      {/* Add button is first */}
                      {photos.length < MAX_PHOTOS && (
                        <TouchableOpacity
                          style={styles.photoAddBtn}
                          activeOpacity={0.7}
                          onPress={handlePickPhoto}
                        >
                          <Ionicons name="camera-outline" size={22} color={Colors.textMuted} />
                          <Text style={styles.photoAddText}>Add</Text>
                        </TouchableOpacity>
                      )}
                      {photos.map((photo, index) => (
                        <View key={index} style={styles.photoThumb}>
                          <Image
                            source={{ uri: photo.url || photo.localUri }}
                            style={styles.photoThumbImage}
                            resizeMode="cover"
                          />
                          {photo.uploading ? (
                            <View style={styles.photoUploadingOverlay}>
                              <ActivityIndicator size="small" color="#fff" />
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.photoRemoveBtn}
                              onPress={() => handleRemovePhoto(index)}
                            >
                              <Ionicons name="close" size={12} color="#fff" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={[styles.photoAddText, { color: Colors.textMuted, paddingVertical: 8 }]}>
                      Save this log first to add photos.
                    </Text>
                  )}


                  <View style={styles.divider} />

                  {/* Privacy */}
                  <Text style={styles.miniLabel}>PRIVACY</Text>
                  <View style={styles.segmentedRow}>
                    {PRIVACY_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => setPrivacy(opt)}
                        style={[styles.segmentButton, privacy === opt && styles.segmentButtonActive]}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={opt === 'public' ? 'globe-outline' : opt === 'friends' ? 'people-outline' : 'lock-closed-outline'}
                          size={14}
                          color={privacy === opt ? Colors.primaryContainer : Colors.textMuted}
                        />
                        <Text style={[styles.segmentText, privacy === opt && styles.segmentTextActive]}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.divider} />

                  {/* Companions */}
                  <Text style={styles.miniLabel}>WHO&apos;D YOU GO WITH?</Text>
                  <View style={styles.companionInputRow}>
                    <TextInput
                      style={styles.companionTextInput}
                      value={companionInput}
                      onChangeText={setCompanionInput}
                      placeholder="Add a name..."
                      placeholderTextColor={Colors.textMuted}
                      onSubmitEditing={addCompanion}
                      returnKeyType="done"
                    />
                    <TouchableOpacity onPress={addCompanion} style={styles.addCompanionButton} activeOpacity={0.7}>
                      <Ionicons name="add" size={20} color={Colors.primaryContainer} />
                    </TouchableOpacity>
                  </View>
                  {companions.length > 0 && (
                    <View style={styles.companionChips}>
                      {companions.map((c, i) => (
                        <TouchableOpacity key={i} onPress={() => removeCompanion(i)} style={styles.companionChip} activeOpacity={0.7}>
                          <Text style={styles.companionChipText}>{c.name}</Text>
                          <Ionicons name="close" size={14} color={Colors.textMuted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <View style={styles.divider} />

                  {/* Action buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
                      <Ionicons name="checkmark" size={20} color={Colors.background} />
                      <Text style={styles.saveButtonText}>{isEdit ? 'Save Changes' : 'Log It'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={dismiss} activeOpacity={0.8}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
              <LinearGradient
                colors={['rgba(18, 22, 32, 0.30)', 'transparent']}
                style={styles.topFade}
                pointerEvents="none"
              />
            </View>

            {/* Notches */}
            {topHeight > 0 && (
              <>
                <View style={[styles.notch, styles.notchLeft, { top: topHeight + (44 - NOTCH_SIZE) / 2 }]} />
                <View style={[styles.notch, styles.notchRight, { top: topHeight + (44 - NOTCH_SIZE) / 2 }]} />
              </>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── HALF-STAR RATING COMPONENT ───────────────────────────────────────────────

function HalfStarRating({
  value,
  onChange,
  size = 30,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const containerRef = useRef<View>(null);
  const lastHapticValue = useRef(value);
  const STAR_GAP = 6;
  const STAR_COUNT = 5;
  const totalWidth = STAR_COUNT * size + (STAR_COUNT - 1) * STAR_GAP;

  const valueFromX = (x: number): number => {
    const starWidth = size + STAR_GAP;
    const clamped = Math.max(0, Math.min(x, totalWidth));
    const starIndex = Math.floor(clamped / starWidth);
    const withinStar = clamped - starIndex * starWidth;
    if (starIndex >= STAR_COUNT) return STAR_COUNT;
    if (withinStar <= size / 2) return starIndex + 0.5;
    return starIndex + 1;
  };

  const triggerHaptic = (newVal: number) => {
    if (newVal !== lastHapticValue.current) {
      lastHapticValue.current = newVal;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleTap = (evt: GestureResponderEvent) => {
    containerRef.current?.measure((_x, _y, _w, _h, pageX) => {
      const localX = evt.nativeEvent.pageX - pageX;
      const newVal = valueFromX(localX);
      // Tap same value to clear
      const finalVal = newVal === value ? 0 : newVal;
      triggerHaptic(finalVal);
      onChange(finalVal);
    });
  };

  const starPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        containerRef.current?.measure((_x, _y, _w, _h, pageX) => {
          const localX = evt.nativeEvent.pageX - pageX;
          const newVal = valueFromX(localX);
          triggerHaptic(newVal);
          onChange(newVal);
        });
      },
      onPanResponderMove: (evt) => {
        containerRef.current?.measure((_x, _y, _w, _h, pageX) => {
          const localX = evt.nativeEvent.pageX - pageX;
          const newVal = valueFromX(localX);
          triggerHaptic(newVal);
          onChange(newVal);
        });
      },
    })
  ).current;

  const getStarIcon = (starIndex: number): React.ComponentProps<typeof Ionicons>['name'] => {
    const threshold = starIndex + 1;
    if (value >= threshold) return 'star';
    if (value >= threshold - 0.5) return 'star-half';
    return 'star-outline';
  };

  return (
    <View
      ref={containerRef}
      style={styles.starsRow}
      {...starPan.panHandlers}
    >
      {Array.from({ length: STAR_COUNT }).map((_, i) => (
        <Ionicons
          key={i}
          name={getStarIcon(i)}
          size={size}
          color={value > i ? '#facc15' : Colors.textMuted}
        />
      ))}
      {value > 0 && (
        <Text style={styles.ratingValueLabel}>{value.toFixed(1)}</Text>
      )}
    </View>
  );
}

// ─── TYPE-SPECIFIC INPUT SECTIONS ─────────────────────────────────────────────

function TypeSpecificInputs(props: any) {
  const t = props.type?.toLowerCase() || '';

  if (['nba', 'nfl', 'mlb', 'nhl', 'sports', 'basketball', 'football', 'baseball', 'hockey'].includes(t)) {
    return <SportsEditSection {...props} />;
  }
  if (['movie', 'film'].includes(t)) {
    return <MovieEditSection {...props} />;
  }
  if (['concert', 'music', 'live music'].includes(t)) {
    return <ConcertEditSection {...props} />;
  }
  if (['restaurant', 'dining'].includes(t)) {
    return <RestaurantEditSection {...props} />;
  }
  if (['nightlife', 'bar', 'club', 'lounge'].includes(t)) {
    return <NightlifeEditSection {...props} />;
  }
  return null; // Custom — no extra fields
}

function SportsEditSection(props: any) {
  return (
    <View style={styles.typeSection}>
      <Text style={styles.typeSectionLabel}>GAME DETAILS</Text>

      {/* Sport selector */}
      <Text style={styles.miniLabel}>SPORT</Text>
      <View style={styles.segmentedRow}>
        {SPORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => { props.setSport(opt.toLowerCase()); props.setLeague(getLeagueForSport(opt)); }}
            style={[styles.segmentButton, props.sport === opt.toLowerCase() && styles.segmentButtonActive, !props.canEditCanonical && { opacity: 0.5 }]}
            activeOpacity={0.7}
            disabled={!props.canEditCanonical}
          >
            <Text style={[styles.segmentText, props.sport === opt.toLowerCase() && styles.segmentTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <LabeledInput label="LEAGUE" value={props.league} onChangeText={props.setLeague} placeholder="NBA" editable={props.canEditCanonical} />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput label="SEASON" value={props.season} onChangeText={props.setSeason} placeholder="2025-26" editable={props.canEditCanonical} />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <LabeledInput label="AWAY TEAM" value={props.awayTeamName} onChangeText={props.setAwayTeamName} placeholder="Team name" editable={props.canEditCanonical} />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput label="HOME TEAM" value={props.homeTeamName} onChangeText={props.setHomeTeamName} placeholder="Team name" editable={props.canEditCanonical} />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <LabeledInput label="AWAY SCORE" value={props.awayScore} onChangeText={props.setAwayScore} placeholder="0" keyboardType="numeric" editable={props.canEditCanonical} />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput label="HOME SCORE" value={props.homeScore} onChangeText={props.setHomeScore} placeholder="0" keyboardType="numeric" editable={props.canEditCanonical} />
        </View>
      </View>

      <LabeledInput label="STATUS" value={props.status} onChangeText={props.setStatus} placeholder="FINAL • OT" editable={props.canEditCanonical} />
    </View>
  );
}

function MovieEditSection(props: any) {
  return (
    <View style={styles.typeSection}>
      <Text style={styles.typeSectionLabel}>MOVIE DETAILS</Text>

      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <LabeledInput label="DIRECTOR" value={props.director} onChangeText={props.setDirector} placeholder="Director name" editable={props.canEditCanonical} />
        </View>
        <View style={{ flex: 0.5 }}>
          <LabeledInput label="RUNTIME" value={props.runtime} onChangeText={props.setRuntime} placeholder="min" keyboardType="numeric" editable={props.canEditCanonical} />
        </View>
      </View>

      <LabeledInput label="GENRE" value={props.genre} onChangeText={props.setGenre} placeholder="Sci-Fi, Drama, etc." editable={props.canEditCanonical} />
      <LabeledInput label="CAST" value={props.castInput} onChangeText={props.setCastInput} placeholder="Names separated by commas" editable={props.canEditCanonical} />

      <Text style={styles.miniLabel}>WATCHED AT</Text>
      <View style={styles.segmentedRow}>
        {WATCHED_AT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => props.setWatchedAt(opt)}
            style={[styles.segmentButton, props.watchedAt === opt && styles.segmentButtonActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, props.watchedAt === opt && styles.segmentTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {(props.watchedAt === 'Theater' || props.watchedAt === 'IMAX') && (
        <LabeledInput label="THEATER NAME" value={props.theaterName} onChangeText={props.setTheaterName} placeholder="AMC Lincoln Square" />
      )}
    </View>
  );
}

function ConcertEditSection(props: any) {
  return (
    <View style={styles.typeSection}>
      <Text style={styles.typeSectionLabel}>CONCERT DETAILS</Text>

      <LabeledInput label="ARTIST / BAND" value={props.artist} onChangeText={props.setArtist} placeholder="Artist name" editable={props.canEditCanonical} />
      <LabeledInput label="TOUR NAME" value={props.tourName} onChangeText={props.setTourName} placeholder="e.g. SOS Tour (optional)" editable={props.canEditCanonical} />

      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <LabeledInput label="OPENER" value={props.opener} onChangeText={props.setOpener} placeholder="Opening act" editable={props.canEditCanonical} />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput label="GENRE" value={props.concertGenre} onChangeText={props.setConcertGenre} placeholder="R&B, Hip-Hop" editable={props.canEditCanonical} />
        </View>
      </View>

      {/* Setlist */}
      <Text style={styles.miniLabel}>SETLIST HIGHLIGHTS</Text>
      <View style={styles.companionInputRow}>
        <TextInput
          style={styles.companionTextInput}
          value={props.setlistInput}
          onChangeText={props.setSetlistInput}
          placeholder="Add a song..."
          placeholderTextColor={Colors.textMuted}
          onSubmitEditing={props.addSetlistItem}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={props.addSetlistItem} style={styles.addCompanionButton} activeOpacity={0.7}>
          <Ionicons name="add" size={20} color={Colors.primaryContainer} />
        </TouchableOpacity>
      </View>
      {props.setlist.length > 0 && (
        <View style={styles.setlistItems}>
          {props.setlist.map((song: string, i: number) => (
            <TouchableOpacity key={i} onPress={() => props.removeSetlistItem(i)} style={styles.companionChip} activeOpacity={0.7}>
              <Text style={styles.setlistNumber}>{i + 1}.</Text>
              <Text style={styles.companionChipText}>{song}</Text>
              <Ionicons name="close" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function RestaurantEditSection(props: any) {
  return (
    <View style={styles.typeSection}>
      <Text style={styles.typeSectionLabel}>RESTAURANT DETAILS</Text>

      <LabeledInput label="CUISINE" value={props.cuisine} onChangeText={props.setCuisine} placeholder="Italian, Japanese, etc." editable={props.canEditCanonical} />

      <Text style={styles.miniLabel}>PRICE LEVEL</Text>
      <View style={styles.segmentedRow}>
        {PRICE_LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() => props.setPriceLevel(level)}
            style={[styles.segmentButton, styles.priceSegment, props.priceLevel === level && styles.priceSegmentActive, !props.canEditCanonical && { opacity: 0.5 }]}
            activeOpacity={0.7}
            disabled={!props.canEditCanonical}
          >
            <Text style={[styles.priceSegmentText, props.priceLevel === level && styles.priceSegmentTextActive]}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function NightlifeEditSection(props: any) {
  return (
    <View style={styles.typeSection}>
      <Text style={styles.typeSectionLabel}>VENUE DETAILS</Text>

      <Text style={styles.miniLabel}>VENUE TYPE</Text>
      <View style={styles.segmentedRow}>
        {VENUE_TYPES.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => props.setVenueType(opt)}
            style={[styles.segmentButton, props.venueType === opt && styles.segmentButtonActive, !props.canEditCanonical && { opacity: 0.5 }]}
            activeOpacity={0.7}
            disabled={!props.canEditCanonical}
          >
            <Text style={[styles.segmentText, props.venueType === opt && styles.segmentTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <LabeledInput label="VIBE" value={props.vibe} onChangeText={props.setVibe} placeholder="High-energy, Chill..." editable={props.canEditCanonical} />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput label="DRESS CODE" value={props.dressCode} onChangeText={props.setDressCode} placeholder="Smart Casual" editable={props.canEditCanonical} />
        </View>
      </View>

      <LabeledInput label="MUSIC GENRE" value={props.musicGenre} onChangeText={props.setMusicGenre} placeholder="House, Hip-Hop, Live DJ..." editable={props.canEditCanonical} />

      <Text style={styles.miniLabel}>PRICE LEVEL</Text>
      <View style={styles.segmentedRow}>
        {PRICE_LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() => props.setNightlifePriceLevel(level)}
            style={[styles.segmentButton, styles.priceSegment, props.nightlifePriceLevel === level && styles.priceSegmentActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.priceSegmentText, props.nightlifePriceLevel === level && styles.priceSegmentTextActive]}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function LabeledInput({
  label, value, onChangeText, placeholder, keyboardType, multiline, editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.labeledInput}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          !editable && { backgroundColor: 'transparent', borderColor: 'transparent', paddingHorizontal: 0, paddingVertical: 4, color: Colors.textMuted }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={'rgba(255,255,255,0.2)'}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        editable={editable}
      />
    </View>
  );
}

function DashedLine() {
  return (
    <View style={styles.dashedLine}>
      {Array.from({ length: 24 }).map((_, i) => (
        <View key={i} style={styles.dash} />
      ))}
    </View>
  );
}

function getEventIcon(eventType?: string): React.ComponentProps<typeof Ionicons>['name'] {
  const lower = eventType?.toLowerCase() || '';
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

function getTypeLabel(type: string): string {
  const t = type.toLowerCase();
  if (['nba', 'nfl', 'mlb', 'nhl', 'sports', 'basketball', 'football', 'baseball', 'hockey'].includes(t)) return 'Sports Event';
  if (['movie', 'film'].includes(t)) return 'Movie';
  if (['concert', 'music', 'live music'].includes(t)) return 'Concert';
  if (['restaurant', 'dining'].includes(t)) return 'Restaurant';
  if (['nightlife', 'bar', 'club', 'lounge'].includes(t)) return 'Night Out';
  return 'Experience';
}

function getPlaceholder(type: string, field: string): string {
  const t = type.toLowerCase();
  if (field === 'title') {
    if (['nba', 'nfl', 'mlb', 'nhl', 'sports'].includes(t)) return 'Celtics vs Lakers';
    if (['movie', 'film'].includes(t)) return 'Dune: Part Two';
    if (['concert', 'music'].includes(t)) return 'SZA';
    if (['restaurant', 'dining'].includes(t)) return 'Carbone';
    if (['nightlife', 'bar', 'club'].includes(t)) return 'Marquee NYC';
    return 'Graduation Day';
  }
  return '';
}

function getLeagueForSport(sport: string): string {
  switch (sport) {
    case 'Basketball': return 'NBA';
    case 'Football': return 'NFL';
    case 'Baseball': return 'MLB';
    case 'Hockey': return 'NHL';
    default: return '';
  }
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
    height: 70,
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
  ticket: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: TICKET_BORDER,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  ticketBgClip: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  ticketTint: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  ticketTop: {},
  separator: {
    height: SEPARATOR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
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
    overflow: 'hidden',
    marginTop: -(SEPARATOR_HEIGHT / 2),
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

  // ── Header ──
  editHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 255, 194, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editBadgeText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 14,
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },

  // ── Top content ──
  topContent: {
    padding: 14,
    paddingTop: 4,
  },

  // ── Labeled input ──
  labeledInput: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  textInput: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  textInputMultiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // ── Type section ──
  typeSection: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  typeSectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2.5,
    color: Colors.primaryContainer,
    marginBottom: 14,
  },

  // ── Segmented control ──
  segmentedRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  segmentButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(0, 255, 194, 0.1)',
    borderColor: 'rgba(0, 255, 194, 0.3)',
  },
  segmentText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.primaryContainer,
  },

  // ── Price segments ──
  priceSegment: {
    minWidth: 48,
    alignItems: 'center',
  },
  priceSegmentActive: {
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  priceSegmentText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  priceSegmentTextActive: {
    color: '#facc15',
  },

  // ── Bottom content ──
  bottomContent: {
    padding: 22,
    paddingTop: 22 + SEPARATOR_HEIGHT / 2,
  },
  miniLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 2.5,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  ratingValueLabel: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 16,
    color: '#facc15',
    marginLeft: 10,
    minWidth: 28,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 18,
  },
  notesInput: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    minHeight: 100,
  },

  // ── Companions ──
  companionInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  companionTextInput: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  addCompanionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 255, 194, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 194, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  companionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: INPUT_BG,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  companionChipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Colors.text,
  },

  // ── Setlist ──
  setlistItems: {
    gap: 6,
    marginTop: 8,
  },
  setlistNumber: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: Colors.textMuted,
    marginRight: 2,
  },

  // ── Photos ──
  photoRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbImage: {
    width: '100%',
    height: '100%',
  },
  photoUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },

  // ── Action buttons ──
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveButtonText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 16,
    color: Colors.background,
  },
  cancelButton: {
    flex: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TICKET_BORDER,
  },
  cancelButtonText: {
    fontFamily: FontFamily.headlineBold,
    fontSize: 15,
    color: Colors.text,
  },
});
