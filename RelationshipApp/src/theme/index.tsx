import React, { createContext, useContext } from 'react';

export interface RelationshipTheme {
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    border: string;
    primary: string;
    primaryMuted: string;
    accent: string;
    accentMuted: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    success: string;
    error: string;
    inputBackground: string;
    cardBackground: string;
  };
}

const theme: RelationshipTheme = {
  colors: {
    background: '#0B0A14',
    surface: '#141322',
    surfaceMuted: '#1A1930',
    border: '#2A2845',
    primary: '#9B8ADB',
    primaryMuted: '#6B5CA5',
    accent: '#D4A853',
    accentMuted: '#A8863F',
    text: '#E8E4F0',
    textMuted: '#8A849E',
    textSubtle: '#5C5775',
    success: '#4CAF7D',
    error: '#D35F5F',
    inputBackground: '#161528',
    cardBackground: '#111020',
  },
};

const ThemeContext = createContext<RelationshipTheme>(theme);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export function useTheme(): RelationshipTheme {
  return useContext(ThemeContext);
}
