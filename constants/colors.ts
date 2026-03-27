/**
 * Log It — Design Tokens
 * Colors from UI_AND_FLOWS.md design system
 */

export const Colors = {
  background: '#0a0e14',
  surfaceContainerHigh: '#1b2028',
  surfaceContainerLow: '#111820',
  surfaceContainerLowest: '#000000',
  primary: '#aaffdc',
  primaryContainer: '#00fdc1',
  primaryFixed: '#00fdc1',
  secondary: '#679cff',
  tertiary: '#ac89ff',
  error: '#ff716c',
  success: '#4ade80',
  warning: '#fbbf24',
  onSurface: '#f1f3fc',
  onSurfaceVariant: '#a8abb3',
  onPrimary: '#0a0e14',
  outline: '#2a2f38',
  brandGlow: '#00FFC2',

  // Semantic aliases
  text: '#f1f3fc',
  textSecondary: '#a8abb3',
  textMuted: '#6b7280',
  card: '#1b2028',
  input: '#000000',
  border: '#2a2f38',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export const Gradients = {
  primaryCta: ['#aaffdc', '#00fdc1'] as const,
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
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
