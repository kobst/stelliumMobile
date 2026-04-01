import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AskScreen } from '../screens/AskScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { useTheme } from '../theme';

const Tab = createBottomTabNavigator();

export const MainTabs: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 76,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} options={{ title: 'History' }} />
      <Tab.Screen name="AskTab" component={AskScreen} options={{ title: 'Ask' }} />
      <Tab.Screen name="ProfileTab" component={ProfileSettingsScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};
