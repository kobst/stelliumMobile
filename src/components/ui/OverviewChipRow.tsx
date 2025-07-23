import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface OverviewChip {
  id: string;
  label: string;
  emoji: string;
}

interface OverviewChipRowProps {
  sections: OverviewChip[];
  selectedSection: string | null;
  onSelectSection: (sectionId: string) => void;
  style?: any;
}

const OverviewChipRow: React.FC<OverviewChipRowProps> = ({
  sections,
  selectedSection,
  onSelectSection,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.strokeSubtle }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sections.map((section) => {
          const isSelected = selectedSection === section.id;
          return (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.accentPrimary : colors.surfaceVariant,
                  borderColor: isSelected ? colors.accentPrimary : colors.strokeSubtle,
                },
              ]}
              onPress={() => onSelectSection(section.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={section.label}
            >
              <Text style={styles.chipEmoji}>{section.emoji}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  { color: isSelected ? colors.onAccent : colors.onSurfaceMed },
                ]}
              >
                {section.label}
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
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default OverviewChipRow;
