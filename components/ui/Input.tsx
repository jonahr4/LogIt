/**
 * Log It — Input Component
 * Spatial Green v2: solid dark input fields with glass border
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  Animated,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography, FontFamily } from '@/constants/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  rightElement,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1319',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: 'rgba(0, 255, 194, 0.5)',
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rightElement: {
    paddingRight: 12,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 6,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 6,
  },
});

