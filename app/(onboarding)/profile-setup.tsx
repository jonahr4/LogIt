/**
 * Log It — Profile Setup Screen (Onboarding Step 1)
 * First name, last name, username with real-time availability check
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import type { UsernameCheckResponse } from '@/types/api';

export default function ProfileSetupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Store data in router params for the next screen
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
      return <Text style={{ color: Colors.success, fontSize: 16 }}>✓</Text>;
    }
    if (usernameStatus === 'taken') {
      return <Text style={{ color: Colors.error, fontSize: 16 }}>✗</Text>;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        <View style={styles.progress}>
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Set Up Your Profile</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
        </View>

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

          <View style={styles.displayNamePreview}>
            <Text style={styles.displayNameLabel}>Display Name</Text>
            <Text style={styles.displayNameValue}>
              {firstName.trim() || 'Your Name'}
            </Text>
            <Text style={styles.displayNameHint}>
              You can change this later
            </Text>
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
    backgroundColor: Colors.background,
  },
  content: {
    padding: 28,
    paddingTop: 24,
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outline,
  },
  progressActive: {
    backgroundColor: Colors.primaryContainer,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  form: {
    gap: 8,
    marginBottom: 40,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  displayNamePreview: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  displayNameLabel: {
    ...Typography.labelUppercase,
    color: Colors.textMuted,
    marginBottom: 4,
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
