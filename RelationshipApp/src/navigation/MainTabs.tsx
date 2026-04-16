import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { useTheme } from '../theme';

export type MainTabParamList = {
  HomeTab: undefined;
  RelationshipsTab: undefined;
  DiscoverTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 76,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen
        name="RelationshipsTab"
        component={HistoryScreen}
        options={{ title: 'Relationships' }}
      />
      <Tab.Screen name="DiscoverTab" component={DiscoverScreen} options={{ title: 'Discover' }} />
      <Tab.Screen name="ProfileTab" component={ProfileSettingsScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};
