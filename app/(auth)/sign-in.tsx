/**
 * Log It — Sign In Screen
 * Spatial Green v2: glass form panel, orbs, Ionicons
 * Uses native @react-native-google-signin via authStore
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, useWindowDimensions } from 'react-native';
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

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmail, signInWithGoogle, signInWithApple, isLoading, error, clearError } =
    useAuthStore();

  const [localError, setLocalError] = useState('');
  const { width } = useWindowDimensions();
  const isWide = width > 600;

  const handleEmailSignIn = async () => {
    clearError();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    try {
      await signInWithEmail(email.trim(), password);
    } catch {
      // Error is handled by the store
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    try {
      await signInWithGoogle();
    } catch (err: any) {
      // Store handles error display; alert only for Expo Go case
      if (err?.message?.includes('development build')) {
        Alert.alert('Development Mode', err.message, [{ text: 'OK' }]);
      }
    }
  };

  const handleAppleSignIn = async () => {
    clearError();
    try {
      if (Platform.OS === 'web') {
        // Web: Firebase popup handles everything
        await signInWithApple();
      } else {
        // Native iOS: use expo-apple-authentication
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
      }
    } catch {
      // Error handled by store
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.container}>


      <ScrollView
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={Platform.OS !== 'web'}
      >
        {/* Back to welcome */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
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
              placeholder="Your password"
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
            />
            <Button
              title="Sign In"
              onPress={handleEmailSignIn}
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

        {/* Social Sign-In */}
        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={20} color={Colors.text} />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignIn} activeOpacity={0.7}>
              <Ionicons name="logo-apple" size={20} color={Colors.text} />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/sign-up')}
          style={styles.footer}
        >
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text style={styles.footerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
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
  contentWide: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%' as any,
    paddingHorizontal: 48,
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
