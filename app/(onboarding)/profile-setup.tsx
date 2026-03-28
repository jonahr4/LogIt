/**
 * Log It — Profile Setup Screen (Onboarding Step 1)
 * Spatial Green v2: glass form, pulsing progress bar, orbs
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { UsernameCheckResponse } from '@/types/api';

export default function ProfileSetupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signOut } = useAuthStore();

  // Pulse animation for active progress bar
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsername = useCallback((value: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (cleaned.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await api.get<UsernameCheckResponse>('/users/check-username', {
          username: cleaned,
        });
        setUsernameStatus(result.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
  }, []);

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
    checkUsername(cleaned);
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!username.trim()) newErrors.username = 'Username is required';
    if (username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (usernameStatus === 'taken') newErrors.username = 'Username is already taken';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    router.push({
      pathname: '/(onboarding)/preferences',
      params: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        displayName: firstName.trim(),
      },
    });
  };

  const usernameRightElement = () => {
    if (usernameStatus === 'checking') {
      return <ActivityIndicator size="small" color={Colors.textMuted} />;
    }
    if (usernameStatus === 'available') {
      return <Ionicons name="checkmark-circle" size={18} color={Colors.success} />;
    }
    if (usernameStatus === 'taken') {
      return <Ionicons name="close-circle" size={18} color={Colors.error} />;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Spatial orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity onPress={() => signOut()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Progress indicator — green horizontal bars, active one pulses */}
        <View style={styles.progress}>
          <Animated.View style={[styles.progressBar, styles.progressActive, { opacity: pulseAnim }]} />
          <View style={styles.progressBar} />
          <View style={styles.progressBar} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Set Up Your Profile</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
        </View>

        {/* Glass form panel */}
        <View style={styles.glassPanel}>
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <Input
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Jonah"
                autoCapitalize="words"
                textContentType="givenName"
                error={errors.firstName}
                containerStyle={styles.halfInput}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Rothman"
                autoCapitalize="words"
                textContentType="familyName"
                error={errors.lastName}
                containerStyle={styles.halfInput}
              />
            </View>

            <Input
              label="Username"
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="jonah"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              error={errors.username}
              hint={
                usernameStatus === 'available'
                  ? 'Username is available!'
                  : usernameStatus === 'taken'
                  ? 'Username is already taken'
                  : 'Letters, numbers, and underscores only'
              }
              rightElement={usernameRightElement()}
            />

            {/* Display name preview — glass card */}
            <View style={styles.displayNamePreview}>
              <Text style={styles.displayNameLabel}>DISPLAY NAME</Text>
              <Text style={styles.displayNameValue}>
                {firstName.trim() || 'Your Name'}
              </Text>
              <Text style={styles.displayNameHint}>
                You can change this later
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!firstName.trim() || !lastName.trim() || username.length < 3}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 28,
    paddingTop: 16,
  },

  // Spatial orbs — softened with shadow blur
  orb1: {
    position: 'absolute',
    top: -100,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 255, 194, 0.12)',
    shadowColor: 'rgba(0, 255, 194, 0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
  },
  orb2: {
    position: 'absolute',
    bottom: 20,
    left: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(0, 255, 194, 0.12)',
    shadowColor: 'rgba(0, 255, 194, 0.4)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
  },


  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  backText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },

  // Progress bars — green horizontal
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outline,
  },
  progressActive: {
    backgroundColor: Colors.primaryContainer,
  },
  progressComplete: {
    backgroundColor: Colors.primary,
  },

  header: {
    marginBottom: 28,
  },
  title: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: 32,
    letterSpacing: -1,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },

  // Glass form panel
  glassPanel: {
    backgroundColor: Colors.glass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 24,
    marginBottom: 24,
    ...Shadows.card,
  },
  form: {
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },

  // Display name preview — nested glass
  displayNamePreview: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  displayNameLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  displayNameValue: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 4,
  },
  displayNameHint: {
    ...Typography.caption,
    color: Colors.textMuted,
  },

  footer: {
    marginTop: 'auto',
  },
});
