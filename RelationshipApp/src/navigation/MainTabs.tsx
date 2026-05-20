import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { useTheme } from '../theme';
import { TabIcon, type TabIconKind } from '../components/TabIcon';

export type MainTabParamList = {
  HomeTab: undefined;
  RelationshipsTab: undefined;
  DiscoverTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

interface IconCellProps {
  kind: TabIconKind;
  color: string;
  focused: boolean;
  activeColor: string;
}

function IconCell({ kind, color, focused, activeColor }: IconCellProps) {
  return (
    <View style={styles.iconCell}>
      {focused ? (
        <View
          pointerEvents="none"
          style={[
            styles.activeGlow,
            Platform.select({
              ios: {
                shadowColor: activeColor,
                shadowOpacity: 0.55,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 0 },
              },
              android: {
                backgroundColor: 'rgba(202, 190, 255, 0.16)',
              },
              default: {},
            }) || {},
          ]}
        />
      ) : null}
      <TabIcon kind={kind} color={color} size={24} />
    </View>
  );
}

const ACTIVE_COLOR = '#cabeff';

const renderHomeIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <IconCell kind="home" color={color} focused={focused} activeColor={ACTIVE_COLOR} />
);
const renderRelIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <IconCell kind="rel" color={color} focused={focused} activeColor={ACTIVE_COLOR} />
);
const renderDiscoverIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <IconCell kind="discover" color={color} focused={focused} activeColor={ACTIVE_COLOR} />
);
const renderProfileIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <IconCell kind="profile" color={color} focused={focused} activeColor={ACTIVE_COLOR} />
);

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
        tabBarInactiveTintColor: 'rgba(202, 190, 255, 0.38)',
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: 'rgba(202, 190, 255, 0.08)',
          height: 86,
          paddingBottom: 14,
          paddingTop: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
          letterSpacing: 0.4,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home', tabBarIcon: renderHomeIcon }}
      />
      <Tab.Screen
        name="RelationshipsTab"
        component={HistoryScreen}
        options={{ title: 'Relationships', tabBarIcon: renderRelIcon }}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverScreen}
        options={{ title: 'Discover', tabBarIcon: renderDiscoverIcon }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileSettingsScreen}
        options={{ title: 'Profile', tabBarIcon: renderProfileIcon }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconCell: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
