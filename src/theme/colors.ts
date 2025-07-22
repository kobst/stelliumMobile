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
};

export type ThemeMode = 'light' | 'dark' | 'system';