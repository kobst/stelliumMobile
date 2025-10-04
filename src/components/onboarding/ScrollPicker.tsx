import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useTheme } from '../../theme';

interface ScrollPickerProps {
  items: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  height?: number;
}

const ITEM_HEIGHT = 50;

export const ScrollPicker: React.FC<ScrollPickerProps> = ({
  items,
  selectedValue,
  onValueChange,
  height = 150,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors, height);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const selectedIndex = items.indexOf(selectedValue);
    if (selectedIndex !== -1 && scrollViewRef.current && !isScrolling) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const handlePress = (item: string, index: number) => {
    onValueChange(item);
    scrollViewRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: true,
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIsScrolling(true);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

    if (items[clampedIndex] && items[clampedIndex] !== selectedValue) {
      onValueChange(items[clampedIndex]);
    }
    setIsScrolling(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.highlightContainer}>
        <View style={styles.highlight} />
      </View>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={`${item}-${index}`}
            style={styles.item}
            onPress={() => handlePress(item, index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.itemText,
                selectedValue === item && styles.itemTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any, height: number) => StyleSheet.create({
  container: {
    height,
    position: 'relative',
  },
  highlightContainer: {
    position: 'absolute',
    top: (height - ITEM_HEIGHT) / 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 1,
  },
  highlight: {
    height: ITEM_HEIGHT,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  scrollContent: {
    paddingVertical: (height - ITEM_HEIGHT) / 2,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 20,
    color: colors.onSurfaceMed,
    fontWeight: '500',
  },
  itemTextSelected: {
    fontSize: 24,
    color: colors.onSurface,
    fontWeight: '700',
  },
});
