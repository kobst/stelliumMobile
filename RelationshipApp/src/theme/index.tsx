import React, { createContext, useContext } from 'react';

export interface RelationshipTheme {
  colors: {
    // Surface hierarchy
    surface: string;
    surfaceLow: string;
    surfaceHigh: string;
    surfaceHighest: string;
    // Primary tones
    primary: string;
    primaryMuted: string;
    primaryContainer: string;
    // Accent tones
    accent: string;
    accentMuted: string;
    // Tertiary
    tertiary: string;
    // Text hierarchy
    text: string;
    textMuted: string;
    textSubtle: string;
    onPrimary: string;
    // Semantic
    success: string;
    error: string;
    // Ghost border (15% opacity outline)
    ghostBorder: string;
    // Legacy aliases (used by screens not yet migrated)
    background: string;
    border: string;
  };
}

const theme: RelationshipTheme = {
  colors: {
    // Surface hierarchy (No-Line Rule: use these for tonal boundaries)
    surface: '#13131b',
    surfaceLow: '#1b1b23',
    surfaceHigh: '#252530',
    surfaceHighest: '#34343d',
    // Primary (Cosmic Lilac)
    primary: '#cabeff',
    primaryMuted: '#8a7cb8',
    primaryContainer: '#3d3560',
    // Accent (Antique Gold)
    accent: '#e9c349',
    accentMuted: '#a8863f',
    // Tertiary (Supernova Cyan)
    tertiary: '#00dce5',
    // Text
    text: '#e8e4f0',
    textMuted: '#8a849e',
    textSubtle: '#5c5775',
    onPrimary: '#1a1530',
    // Semantic
    success: '#4CAF7D',
    error: '#ffb4ab',
    // Ghost border for accessibility fallback (outline_variant at 15%)
    ghostBorder: 'rgba(202, 190, 255, 0.15)',
    // Legacy aliases (used by screens not yet migrated to design system)
    background: '#13131b',
    border: '#252530',
  },
};

const ThemeContext = createContext<RelationshipTheme>(theme);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export function useTheme(): RelationshipTheme {
  return useContext(ThemeContext);
}
