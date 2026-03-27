/**
 * Log It — Sign Up Screen
 * Spatial Green v2: glass form panel, orbs, Ionicons
 * Uses expo-auth-session/providers/google for simple Google OAuth
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Colors, Shadows } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUpWithEmail, signInWithGoogle, signInWithApple, isLoading, error, clearError } =
    useAuthStore();

  const [localError, setLocalError] = useState('');

  const handleEmailSignUp = async () => {
    clearError();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await signUpWithEmail(email.trim(), password);
    } catch {
      // Error is handled by the store
    }
  };

  const handleGoogleSignUp = async () => {
    clearError();
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.message?.includes('development build')) {
        Alert.alert('Development Mode', err.message, [{ text: 'OK' }]);
      }
    }
  };

  const handleAppleSignUp = async () => {
    if (Platform.OS !== 'ios') return;
    clearError();
    try {
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (credential.identityToken) {
        await signInWithApple(credential.identityToken, nonce);
      }
    } catch {
      // Error handled by store
    }
  };

  const displayError = localError || error;

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
        {/* Back to welcome */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the community of event trackers</Text>
        </View>

        {displayError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        ) : null}

        {/* Glass form panel */}
        <View style={styles.glassPanel}>
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
            />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              textContentType="newPassword"
            />
            <Button
              title="Create Account"
              onPress={handleEmailSignUp}
              loading={isLoading}
            />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Sign-In — glass cards */}
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleSignUp}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={20} color={Colors.text} />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignUp} activeOpacity={0.7}>
              <Ionicons name="logo-apple" size={20} color={Colors.text} />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/sign-in')}
          style={styles.footer}
        >
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.footerLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
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
    paddingTop: 16,
  },

  // Spatial orbs
  orb1: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
  },
  orb2: {
    position: 'absolute',
    bottom: 100,
    right: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(0, 255, 194, 0.15)',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  backText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  header: {
    marginBottom: 32,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 113, 108, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 113, 108, 0.3)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    flex: 1,
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
    gap: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.glassBorder,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
    fontFamily: FontFamily.bodySemiBold,
  },

  // Social buttons — glass style
  socialButtons: {
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingVertical: 16,
    paddingHorizontal: 24,
    ...Shadows.card,
  },
  socialButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  footerLink: {
    color: Colors.primaryContainer,
    fontWeight: '600',
  },
});
