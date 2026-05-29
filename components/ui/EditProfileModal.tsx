/**
 * EditProfileModal — Edit username, display name, bio, and profile picture.
 * Uses SharedModal for the unified shell.
 * Profile pictures uploaded to Firebase Storage, URL saved to Supabase.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { FontFamily, LetterSpacing } from '@/constants/typography';
import { SharedModal } from '@/components/ui/SharedModal';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { uploadAvatar } from '@/lib/firebaseStorage';
import { firebaseAuth } from '@/lib/firebase';

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: Props) {
  const { user, setUser } = useAuthStore();

  // Form state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null); // local URI for new photo
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Populate form when modal opens
  useEffect(() => {
    if (visible && user) {
      setUsername(user.username || '');
      setDisplayName(user.display_name || '');
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setBio(user.bio || '');
      setAvatarUri(null);
      setExistingAvatarUrl(user.avatar_url || null);
      setUsernameError(null);
    }
  }, [visible, user]);

  // Username validation (debounced)
  useEffect(() => {
    if (!username || username === user?.username) {
      setUsernameError(null);
      return;
    }

    const regex = /^[a-z0-9_]{3,30}$/;
    if (!regex.test(username)) {
      setUsernameError('3-30 chars, lowercase letters, numbers, underscores only');
      return;
    }

    setIsCheckingUsername(true);
    const timeout = setTimeout(async () => {
      try {
        const result = await api.get<{ available: boolean }>('/users/check-username', {
          username,
        });
        if (!result.available) {
          setUsernameError('Username is already taken');
        } else {
          setUsernameError(null);
        }
      } catch {
        // Don't block on check failure
        setUsernameError(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [username, user?.username]);

  // Pick photo
  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // Save profile
  const handleSave = async () => {
    if (!user) return;
    if (usernameError) return;

    setIsSaving(true);

    try {
      let newAvatarUrl = existingAvatarUrl;

      // Upload new avatar if changed
      if (avatarUri) {
        const firebaseUid = firebaseAuth.currentUser?.uid;
        if (firebaseUid) {
          const { url } = await uploadAvatar(avatarUri, firebaseUid);
          newAvatarUrl = url;
        }
      }

      // Build update payload — only send changed fields
      const updates: Record<string, unknown> = {};
      if (username !== user.username) updates.username = username;
      if (displayName !== (user.display_name || '')) updates.display_name = displayName;
      if (firstName !== (user.first_name || '')) updates.first_name = firstName;
      if (lastName !== (user.last_name || '')) updates.last_name = lastName;
      if (bio !== (user.bio || '')) updates.bio = bio;
      if (newAvatarUrl !== user.avatar_url) updates.avatar_url = newAvatarUrl;

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      const updatedUser = await api.patch<any>(`/users/${user.id}`, updates);
      setUser(updatedUser);
      onClose();
    } catch (err: any) {
      const message = err?.error?.message || 'Failed to save profile';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  // Determine avatar display
  const avatarSource = avatarUri || existingAvatarUrl;
  const initial = (displayName || username || '?')[0].toUpperCase();

  return (
    <SharedModal visible={visible} onClose={onClose} title="Edit Profile">
      <View style={s.content}>
        {/* Avatar */}
        <TouchableOpacity style={s.avatarSection} onPress={handlePickPhoto} activeOpacity={0.7}>
          {avatarSource ? (
            <Image source={{ uri: avatarSource }} style={s.avatarImage} />
          ) : (
            <View style={s.avatarFallback}>
              <Text style={s.avatarInitial}>{initial}</Text>
            </View>
          )}
          <View style={s.avatarBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
          <Text style={s.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>

        {/* Username */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>USERNAME</Text>
          <View style={[s.inputRow, usernameError ? s.inputError : null]}>
            <Text style={s.atPrefix}>@</Text>
            <TextInput
              style={s.input}
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            {isCheckingUsername && (
              <ActivityIndicator size="small" color={Colors.primaryContainer} />
            )}
            {!isCheckingUsername && username && !usernameError && username !== user?.username && (
              <Ionicons name="checkmark-circle" size={18} color={Colors.primaryContainer} />
            )}
          </View>
          {usernameError && <Text style={s.errorText}>{usernameError}</Text>}
        </View>

        {/* Display Name */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>DISPLAY NAME</Text>
          <TextInput
            style={s.inputFull}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your display name"
            placeholderTextColor={Colors.textMuted}
            maxLength={50}
          />
        </View>

        {/* First / Last Name */}
        <View style={s.nameRow}>
          <View style={[s.fieldGroup, { flex: 1 }]}>
            <Text style={s.label}>FIRST NAME</Text>
            <TextInput
              style={s.inputFull}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First"
              placeholderTextColor={Colors.textMuted}
              maxLength={50}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={[s.fieldGroup, { flex: 1 }]}>
            <Text style={s.label}>LAST NAME</Text>
            <TextInput
              style={s.inputFull}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last"
              placeholderTextColor={Colors.textMuted}
              maxLength={50}
            />
          </View>
        </View>

        {/* Bio */}
        <View style={s.fieldGroup}>
          <Text style={s.label}>BIO</Text>
          <TextInput
            style={[s.inputFull, s.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={200}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{bio.length}/200</Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[s.saveBtn, (isSaving || !!usernameError) && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving || !!usernameError}
          activeOpacity={0.7}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SharedModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BORDER = 'rgba(255, 255, 255, 0.1)';

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.glassBorder,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 36,
    color: Colors.primaryContainer,
  },
  avatarBadge: {
    position: 'absolute',
    top: 72,
    right: '50%',
    marginRight: -50,
    left: '50%',
    marginLeft: 28,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  changePhotoText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.primaryContainer,
  },

  // Fields
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  atPrefix: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.textMuted,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  inputFull: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.text,
  },
  bioInput: {
    height: 80,
    paddingTop: 12,
  },
  charCount: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 4,
  },
  nameRow: {
    flexDirection: 'row',
  },

  // Save button
  saveBtn: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.onPrimary,
  },
});
