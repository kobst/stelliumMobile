import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { useTheme } from '../../theme';

interface TabItem {
  label: string;
  routeName: string;
}

interface TopTabBarProps {
  items: TabItem[];
  activeRoute: string;
  onTabPress: (routeName: string) => void;
}

export const TopTabBar: React.FC<TopTabBarProps> = ({ items, activeRoute, onTabPress }) => {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleTabPress = (routeName: string, index: number) => {
    onTabPress(routeName);

    // Announce tab change for accessibility
    AccessibilityInfo.announceForAccessibility(`${items[index].label} tab selected`);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item, index) => {
          const isActive = activeRoute === item.routeName;
          return (
            <TouchableOpacity
              key={item.routeName}
              onPress={() => handleTabPress(item.routeName, index)}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={item.label}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? colors.primary : colors.onSurfaceMed,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {item.label}
              </Text>
              {isActive && (
                <View
                  style={[
                    styles.indicator,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 20,
    minWidth: '100%',
  },
  tab: {
    marginRight: 24,
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
});
