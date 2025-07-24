import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { useTheme } from '../../theme';

interface SegmentItem {
  label: string;
  value: string;
}

interface StickySegmentProps {
  items: SegmentItem[];
  selectedValue: string;
  onChange: (value: string) => void;
}

export const StickySegment: React.FC<StickySegmentProps> = ({
  items,
  selectedValue,
  onChange,
}) => {
  const { colors } = useTheme();

  const handlePress = (value: string, label: string) => {
    onChange(value);
    AccessibilityInfo.announceForAccessibility(`${label} selected`);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadowElev1,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const isSelected = selectedValue === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              onPress={() => handlePress(item.value, item.label)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? colors.accentPrimary
                    : colors.surfaceVariant,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={item.label}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected
                      ? colors.onAccent
                      : colors.onSurfaceMed,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 44, // Increased for better touch targets
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 24, // 24px radius as specified
    marginRight: 8,
    minHeight: 28,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
  },
});
