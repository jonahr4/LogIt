/**
 * Log It — Design Tokens
 * Colors from spatial-green-v2 design system
 */

export const Colors = {
  // Spatial Green v2 — exact values
  background: '#030712',
  surfaceContainerHigh: '#1b2028',
  surfaceContainerLow: '#111820',
  surfaceContainerLowest: '#000000',
  primary: '#aaffdc',
  primaryContainer: '#00FFC2',
  primaryFixed: '#00FFC2',
  secondary: '#679cff',
  tertiary: '#ac89ff',
  error: '#ff716c',
  success: '#4ade80',
  warning: '#fbbf24',
  onSurface: '#f1f3fc',
  onSurfaceVariant: '#a8abb3',
  onPrimary: '#030712',
  outline: '#2a2f38',
  brandGlow: '#00FFC2',

  // Glass tokens (spatial-green-v2 — solid for RN, no backdrop-filter)
  glass: '#0e1218',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassSurface: 'rgba(255, 255, 255, 0.05)',

  // Semantic aliases
  text: '#f1f3fc',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  card: '#1b2028',
  input: '#000000',
  border: '#2a2f38',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export const Gradients = {
  primaryCta: ['#aaffdc', '#00FFC2'] as const,
  glow: ['rgba(0, 255, 194, 0.3)', 'rgba(0, 255, 194, 0)'] as const,
  atmospheric: ['rgba(170, 255, 220, 0.15)', 'rgba(103, 156, 255, 0.1)', 'rgba(0, 0, 0, 0)'] as const,
} as const;

export const Shadows = {
  glowPrimary: {
    shadowColor: '#00FFC2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  glowPrimaryStrong: {
    shadowColor: '#00FFC2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 5,
  },
} as const;
