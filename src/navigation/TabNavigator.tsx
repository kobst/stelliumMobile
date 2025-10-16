import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useStore } from '../store';
import { useTheme } from '../theme';

// Import stack navigators
import HoroscopeStack from './HoroscopeStack';
import ChartStack from './ChartStack';
import RelationshipsStack from './RelationshipsStack';
import CelebrityStack from './CelebrityStack';
import ChatStack from './ChatStack';

// Import SVG icons
import HoroscopeIcon from '../../assets/navigation/horoscopes.svg';
import ChartIcon from '../../assets/navigation/charts.svg';
import RelationshipsIcon from '../../assets/navigation/relationships.svg';
import CelebritiesIcon from '../../assets/navigation/celebrities.svg';
import ChatIcon from '../../assets/navigation/chat.svg';

const Tab = createBottomTabNavigator();

// Tab icon component with SVG icons
const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({ name, focused, color }) => {
  const getIcon = () => {
    switch (name) {
      case 'Horoscope': return HoroscopeIcon;
      case 'Chart': return ChartIcon;
      case 'Relationships': return RelationshipsIcon;
      case 'Celebrity': return CelebritiesIcon;
      case 'Ask': return ChatIcon;
      default: return null;
    }
  };

  const Icon = getIcon();
  if (!Icon) return null;

  return (
    <View style={styles.iconContainer}>
      <Icon width={24} height={24} color={color} fill={color} />
    </View>
  );
};

const TabNavigator: React.FC = () => {
  const { setActiveTab } = useStore();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 8,
          height: 80,
        },
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
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
        options={{ title: 'Relations' }}
      />
      <Tab.Screen
        name="Celebrity"
        component={CelebrityStack}
        options={{ title: 'Celebrity' }}
      />
      <Tab.Screen
        name="Ask"
        component={ChatStack}
        options={{ title: 'Ask' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  tabBarItem: {
    paddingHorizontal: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TabNavigator;
