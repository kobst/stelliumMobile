import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../theme';
import { ThemeMode } from '../theme';

interface ThemeToggleProps {
  style?: any;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ style }) => {
  const { colors, theme, setTheme } = useTheme();

  const showThemeOptions = () => {
    Alert.alert(
      'Choose Theme',
      'Select your preferred theme:',
      [
        {
          text: 'System',
          onPress: () => setTheme('system'),
          style: theme === 'system' ? 'default' : 'cancel'
        },
        {
          text: 'Light',
          onPress: () => setTheme('light'),
          style: theme === 'light' ? 'default' : 'cancel'
        },
        {
          text: 'Dark',
          onPress: () => setTheme('dark'),
          style: theme === 'dark' ? 'default' : 'cancel'
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const getThemeDisplayName = () => {
    switch (theme) {
      case 'system':
        return 'System';
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
      default:
        return '🔄';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      onPress={showThemeOptions}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={[styles.icon, { color: colors.primary }]}>
            {getThemeIcon()}
          </Text>
          <View style={styles.textContent}>
            <Text style={[styles.title, { color: colors.onSurface }]}>
              Appearance
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Theme: {getThemeDisplayName()}
            </Text>
          </View>
        </View>
        <Text style={[styles.arrow, { color: colors.onSurfaceVariant }]}>
          ›
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '300',
  },
});

export default ThemeToggle;