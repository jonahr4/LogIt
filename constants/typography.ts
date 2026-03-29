/**
 * LogIt — Typography
 * Atkinson Hyperlegible Next for headlines (distinct I ≠ l), Inter for body
 * Tight letter-spacing for bold headlines — no wide tracking
 */

export const FontFamily = {
  headlineRegular: 'AtkinsonHyperlegibleNext_400Regular',
  headlineMedium: 'AtkinsonHyperlegibleNext_500Medium',
  headlineSemiBold: 'AtkinsonHyperlegibleNext_600SemiBold',
  headlineBold: 'AtkinsonHyperlegibleNext_700Bold',
  headlineExtraBold: 'AtkinsonHyperlegibleNext_800ExtraBold',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const LineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
} as const;

export const LetterSpacing = {
  tightest: -1.5,
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  widest: 1.5,
  uppercase: 2,
} as const;

export const Typography = {
  h1: {
    fontFamily: FontFamily.headlineExtraBold,
    fontSize: FontSize['4xl'],
    letterSpacing: LetterSpacing.tightest,
    lineHeight: FontSize['4xl'] * LineHeight.tight,
  },
  h2: {
    fontFamily: FontFamily.headlineBold,
    fontSize: FontSize['3xl'],
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize['3xl'] * LineHeight.tight,
  },
  h3: {
    fontFamily: FontFamily.headlineSemiBold,
    fontSize: FontSize['2xl'],
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize['2xl'] * LineHeight.snug,
  },
  h4: {
    fontFamily: FontFamily.headlineSemiBold,
    fontSize: FontSize.xl,
    lineHeight: FontSize.xl * LineHeight.snug,
  },
  body: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  bodyMedium: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  bodySemiBold: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: LetterSpacing.wide,
  },
  labelUppercase: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: LetterSpacing.uppercase,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
} as const;
