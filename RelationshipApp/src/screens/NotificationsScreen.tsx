import React, { useCallback, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { useRelationshipAppStore, type NotificationPrefs } from '../store';
import {
  getNotificationPrefs,
  updateNotificationPrefs,
} from '../api/profile';
import { SettingsNavBar } from '../components/SettingsNavBar';
import { SettingsInfoCard } from '../components/SettingsInfoCard';
import { Toggle } from '../components/Toggle';

export function NotificationsScreen() {
  const { colors } = useTheme();
  const prefs = useRelationshipAppStore((state) => state.notificationPrefs);
  const setPrefs = useRelationshipAppStore((state) => state.setNotificationPrefs);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const value = await getNotificationPrefs();
        if (active) {
          setPrefs(value);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[NotificationsScreen] failed to load prefs', error);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [setPrefs]);

  const togglePref = useCallback(
    (key: keyof NotificationPrefs) => (value: boolean) => {
      const next = { ...prefs, [key]: value };
      setPrefs(next);
      updateNotificationPrefs(next).catch((error) => {
        if (__DEV__) {
          console.warn('[NotificationsScreen] failed to persist prefs', error);
        }
      });
    },
    [prefs, setPrefs]
  );

  const rows = [
    {
      key: 'weekly',
      label: 'Weekly Article',
      subtitle: 'New editorial content about aspects, transits, and celebrity charts.',
      trailing: (
        <Toggle
          value={prefs.weeklyArticle}
          onValueChange={togglePref('weeklyArticle')}
          accessibilityLabel="Weekly Article"
        />
      ),
    },
    {
      key: 'product',
      label: 'Product Updates',
      subtitle: 'New features and improvements to Iris.',
      trailing: (
        <Toggle
          value={prefs.productUpdates}
          onValueChange={togglePref('productUpdates')}
          accessibilityLabel="Product Updates"
        />
      ),
    },
    {
      key: 'transits',
      label: 'Transit Alerts',
      subtitle: 'When planetary transits activate your chart placements.',
      tag: 'Coming soon',
      trailing: (
        <Toggle
          value={prefs.transitAlerts}
          disabled
          accessibilityLabel="Transit Alerts (coming soon)"
        />
      ),
    },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Notifications" backLabel="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <SettingsInfoCard rows={rows} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
});
