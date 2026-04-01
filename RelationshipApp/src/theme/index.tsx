import React, { createContext, useContext } from 'react';

export interface RelationshipTheme {
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    border: string;
    primary: string;
    primaryMuted: string;
    text: string;
    textMuted: string;
    success: string;
  };
}

const theme: RelationshipTheme = {
  colors: {
    background: '#F6F1E8',
    surface: '#FFF9F0',
    surfaceMuted: '#EADFCC',
    border: '#CDBCA3',
    primary: '#8C3D35',
    primaryMuted: '#C68679',
    text: '#2B211C',
    textMuted: '#6F6158',
    success: '#3E7C59',
  },
};

const ThemeContext = createContext<RelationshipTheme>(theme);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export function useTheme(): RelationshipTheme {
  return useContext(ThemeContext);
}
