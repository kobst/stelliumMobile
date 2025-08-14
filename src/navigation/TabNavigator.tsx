import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text } from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../theme';

// Import stack navigators
import HoroscopeStack from './HoroscopeStack';
import ChartStack from './ChartStack';
import RelationshipsStack from './RelationshipsStack';
import CelebrityStack from './CelebrityStack';

const Tab = createBottomTabNavigator();

// Simple icon component placeholder (we'll improve this later)
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => {
  const getIconText = () => {
    switch (name) {
      case 'Horoscope': return '☀️';
      case 'Chart': return '⭕';
      case 'Relationships': return '💕';
      case 'Celebrity': return '⭐';
      default: return '•';
    }
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconText, focused && styles.iconTextFocused]}>
        {getIconText()}
      </Text>
    </View>
  );
};

const TabNavigator: React.FC = () => {
  const { setActiveTab } = useStore();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      })}
      screenListeners={{
        tabPress: (e) => {
          const routeName = e.target?.split('-')[0] as any;
          setActiveTab(routeName);
        },
      }}
    >
      <Tab.Screen
        name="Horoscope"
        component={HoroscopeStack}
        options={{ title: 'Horoscope' }}
      />
      <Tab.Screen
        name="Chart"
        component={ChartStack}
        options={{ title: 'Chart' }}
      />
      <Tab.Screen
        name="Relationships"
        component={RelationshipsStack}
        options={{ title: 'Relationships' }}
      />
      <Tab.Screen
        name="Celebrity"
        component={CelebrityStack}
        options={{ title: 'Celebrity' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
    opacity: 0.6,
  },
  iconTextFocused: {
    opacity: 1,
  },
});

export default TabNavigator;
