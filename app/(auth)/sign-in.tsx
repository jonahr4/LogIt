/**
 * Log It — Sign In Screen
 * Email/password + Google + Apple sign-in
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Config } from '@/constants/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmail, signInWithGoogle, signInWithApple, isLoading, error, clearError } =
    useAuthStore();

  const [localError, setLocalError] = useState('');

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
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'logit' });
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };

      const request = new AuthSession.AuthRequest({
        clientId: Config.auth.googleWebClientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
        usePKCE: false,
      });

      const result = await request.promptAsync(discovery);
      if (result.type === 'success' && result.params.id_token) {
        await signInWithGoogle(result.params.id_token);
      }
    } catch {
      // Error handled by store
    }
  };

  const handleAppleSignIn = async () => {
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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {displayError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        ) : null}

        {/* Email/Password Form */}
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

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Sign-In */}
        <View style={styles.socialButtons}>
          <Button
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            variant="secondary"
            icon={<Text style={styles.socialIcon}>G</Text>}
          />
          {Platform.OS === 'ios' && (
            <Button
              title="Continue with Apple"
              onPress={handleAppleSignIn}
              variant="secondary"
              icon={<Text style={styles.socialIcon}></Text>}
            />
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
    backgroundColor: Colors.background,
  },
  content: {
    padding: 28,
    paddingTop: 48,
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
  errorBanner: {
    backgroundColor: 'rgba(255, 113, 108, 0.15)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
  },
  form: {
    gap: 4,
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outline,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    paddingHorizontal: 16,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 32,
  },
  socialIcon: {
    fontSize: 18,
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
    color: Colors.primary,
    fontWeight: '600',
  },
});
