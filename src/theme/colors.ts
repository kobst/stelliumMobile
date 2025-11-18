export interface ColorPalette {
  // Primary colors
  primary: string;
  primaryVariant: string;

  // Surface colors
  background: string;
  surface: string;
  surfaceVariant: string;

  // Content colors
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  onPrimary: string;

  // Semantic colors
  error: string;
  onError: string;
  success: string;
  onSuccess: string;
  warning: string;
  onWarning: string;

  // Border and divider colors
  border: string;
  divider: string;

  // Interactive states
  ripple: string;
  pressed: string;

  // Navigation
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Accent colors
  accentPrimary: string;
  accentSecondary: string;
  accentSupport: string;
  accentWarning: string;
  onAccent: string;

  // Surface variants
  surfaceCard: string;
  surfaceModal: string;
  surfaceElevated: string;

  // Elevation shadows
  shadowElev1: string;
  shadowElev2: string;
  shadowNone: string;

  // Stroke variants
  strokeSubtle: string;
  strokeMedium: string;

  // Text hierarchy
  onSurfaceHigh: string;
  onSurfaceMed: string;
  onSurfaceLow: string;

  // Aspect colors (astrological)
  aspectTrine: string;
  aspectSquare: string;
  aspectOpposition: string;
  aspectSextile: string;
  aspectConjunction: string;
  aspectQuincunx: string;

  // Zodiac sign colors
  signAries: string;
  signTaurus: string;
  signGemini: string;
  signCancer: string;
  signLeo: string;
  signVirgo: string;
  signLibra: string;
  signScorpio: string;
  signSagittarius: string;
  signCapricorn: string;
  signAquarius: string;
  signPisces: string;

  // Gradient colors for buttons
  gradientPrimaryStart: string;
  gradientPrimaryEnd: string;
  gradientDisabledStart: string;
  gradientDisabledEnd: string;
}

export const darkTheme: ColorPalette = {
  // Primary colors
  primary: '#A07BFF',
  primaryVariant: '#8b5cf6',

  // Surface colors
  background: '#0f172a',
  surface: '#1e293b',
  surfaceVariant: '#1a2540',

  // Content colors
  onBackground: '#EAF0FF',
  onSurface: '#EAF0FF',
  onSurfaceVariant: '#9BA9C8',
  onPrimary: '#ffffff',

  // Semantic colors
  error: '#FF5656',
  onError: '#ffffff',
  success: '#22c55e',
  onSuccess: '#ffffff',
  warning: '#fbbf24',
  onWarning: '#92400e',

  // Border and divider colors
  border: '#1E2B49',
  divider: '#334155',

  // Interactive states
  ripple: 'rgba(139, 92, 246, 0.12)',
  pressed: 'rgba(139, 92, 246, 0.08)',

  // Navigation
  tabBarBackground: '#1f2937',
  tabBarBorder: '#374151',
  tabBarActive: '#8b5cf6',
  tabBarInactive: '#6b7280',

  // Accent colors
  accentPrimary: '#8b5cf6',
  accentSecondary: '#A07BFF',
  accentSupport: '#10b981',
  accentWarning: '#f59e0b',
  onAccent: '#ffffff',

  // Surface variants
  surfaceCard: '#1e293b',
  surfaceModal: '#374151',
  surfaceElevated: '#475569',

  // Elevation shadows
  shadowElev1: 'rgba(0, 0, 0, 0.25)',
  shadowElev2: 'rgba(0, 0, 0, 0.35)',
  shadowNone: 'rgba(0, 0, 0, 0)',

  // Stroke variants
  strokeSubtle: '#334155',
  strokeMedium: '#475569',

  // Text hierarchy
  onSurfaceHigh: '#EAF0FF',
  onSurfaceMed: '#CBD5E1',
  onSurfaceLow: '#9BA9C8',

  // Aspect colors (astrological)
  aspectTrine: '#22c55e',      // Green - harmonious
  aspectSquare: '#ef4444',     // Red - challenging
  aspectOpposition: '#f97316', // Orange - tension
  aspectSextile: '#3b82f6',    // Blue - supportive
  aspectConjunction: '#8b5cf6', // Purple - intense
  aspectQuincunx: '#eab308',   // Yellow - adjustment

  // Zodiac sign colors
  signAries: '#ef4444',        // Fire - Red
  signTaurus: '#22c55e',       // Earth - Green
  signGemini: '#eab308',       // Air - Yellow
  signCancer: '#06b6d4',       // Water - Cyan
  signLeo: '#f97316',          // Fire - Orange
  signVirgo: '#84cc16',        // Earth - Lime
  signLibra: '#ec4899',        // Air - Pink
  signScorpio: '#dc2626',      // Water - Dark Red
  signSagittarius: '#a855f7',  // Fire - Purple
  signCapricorn: '#059669',    // Earth - Emerald
  signAquarius: '#0ea5e9',     // Air - Sky
  signPisces: '#8b5cf6',       // Water - Violet

  // Gradient colors for buttons
  gradientPrimaryStart: '#A07BFF',
  gradientPrimaryEnd: '#8B5FFF',
  gradientDisabledStart: '#4A5568',
  gradientDisabledEnd: '#2D3748',
};

export const lightTheme: ColorPalette = {
  // Primary colors
  primary: '#6B4DFF',
  primaryVariant: '#5b3fd1',

  // Surface colors
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F7FC',

  // Content colors
  onBackground: '#131528',
  onSurface: '#131528',
  onSurfaceVariant: '#4F5A78',
  onPrimary: '#ffffff',

  // Semantic colors
  error: '#FF5656',
  onError: '#ffffff',
  success: '#16a34a',
  onSuccess: '#ffffff',
  warning: '#d97706',
  onWarning: '#ffffff',

  // Border and divider colors
  border: '#E1E6F0',
  divider: '#E5E7EB',

  // Interactive states
  ripple: 'rgba(107, 77, 255, 0.12)',
  pressed: 'rgba(107, 77, 255, 0.08)',

  // Navigation
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E1E6F0',
  tabBarActive: '#6B4DFF',
  tabBarInactive: '#6B7280',

  // Accent colors
  accentPrimary: '#5b3fd1',
  accentSecondary: '#6B4DFF',
  accentSupport: '#059669',
  accentWarning: '#d97706',
  onAccent: '#ffffff',

  // Surface variants
  surfaceCard: '#FFFFFF',
  surfaceModal: '#F8FAFC',
  surfaceElevated: '#F1F5F9',

  // Elevation shadows
  shadowElev1: 'rgba(0, 0, 0, 0.08)',
  shadowElev2: 'rgba(0, 0, 0, 0.12)',
  shadowNone: 'rgba(0, 0, 0, 0)',

  // Stroke variants
  strokeSubtle: '#E2E8F0',
  strokeMedium: '#CBD5E1',

  // Text hierarchy
  onSurfaceHigh: '#131528',
  onSurfaceMed: '#334155',
  onSurfaceLow: '#64748B',

  // Aspect colors (astrological)
  aspectTrine: '#16a34a',      // Green - harmonious
  aspectSquare: '#dc2626',     // Red - challenging
  aspectOpposition: '#ea580c', // Orange - tension
  aspectSextile: '#2563eb',    // Blue - supportive
  aspectConjunction: '#5b3fd1', // Purple - intense
  aspectQuincunx: '#ca8a04',   // Yellow - adjustment

  // Zodiac sign colors
  signAries: '#dc2626',        // Fire - Red
  signTaurus: '#16a34a',       // Earth - Green
  signGemini: '#ca8a04',       // Air - Yellow
  signCancer: '#0891b2',       // Water - Cyan
  signLeo: '#ea580c',          // Fire - Orange
  signVirgo: '#65a30d',        // Earth - Lime
  signLibra: '#db2777',        // Air - Pink
  signScorpio: '#b91c1c',      // Water - Dark Red
  signSagittarius: '#9333ea',  // Fire - Purple
  signCapricorn: '#047857',    // Earth - Emerald
  signAquarius: '#0284c7',     // Air - Sky
  signPisces: '#5b3fd1',       // Water - Violet

  // Gradient colors for buttons
  gradientPrimaryStart: '#7C5BFF',
  gradientPrimaryEnd: '#6B4DFF',
  gradientDisabledStart: '#CBD5E0',
  gradientDisabledEnd: '#A0AEC0',
};

export type ThemeMode = 'light' | 'dark' | 'system';
