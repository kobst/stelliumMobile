import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { ColorPalette, darkTheme, lightTheme, ThemeMode } from './colors';
import { useStore } from '../store';
import { superwallService } from '../services/SuperwallService';

interface ThemeContextType {
  colors: ColorPalette;
  isDark: boolean;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { themeMode, setThemeMode } = useStore();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(themeMode);

  // Determine if we should use dark theme based on preference and system
  const shouldUseDarkTheme =
    currentTheme === 'dark' ||
    (currentTheme === 'system' && systemColorScheme === 'dark');

  const colors = shouldUseDarkTheme ? darkTheme : lightTheme;
  const isDark = shouldUseDarkTheme;

  const setTheme = (theme: ThemeMode) => {
    setCurrentTheme(theme);
    setThemeMode(theme);
  };

  // Update theme when system changes and user preference is 'system'
  useEffect(() => {
    if (currentTheme === 'system') {
      // Force re-render when system theme changes
      setCurrentTheme('system');
    }
  }, [systemColorScheme, currentTheme]);

  // Update status bar style based on theme
  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
    // On Android, also set background color
    if (StatusBar.setBackgroundColor) {
      StatusBar.setBackgroundColor(colors.background, true);
    }
  }, [isDark, colors.background]);

  // Sync Superwall paywall theme with app theme
  useEffect(() => {
    const colorScheme = isDark ? 'dark' : 'light';
    superwallService.setInterfaceStyle(colorScheme);
  }, [isDark]);

  const contextValue: ThemeContextType = {
    colors,
    isDark,
    theme: currentTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
