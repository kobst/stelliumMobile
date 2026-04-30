import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

const SUGGESTIONS: readonly string[] = [
  'Why do I keep attracting Scorpios?',
  'What should I look for this week?',
  'Compare my two connections',
];

interface HomeAskIrisCardProps {
  onPressSuggestion?: (suggestion: string) => void;
  costLabel?: string;
}

const TERTIARY_FILL = 'rgba(0, 220, 229, 0.12)';

export function HomeAskIrisCard({ onPressSuggestion, costLabel = '◆ 1 per question' }: HomeAskIrisCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconBubble, { backgroundColor: TERTIARY_FILL }]}>
          <Text style={[styles.iconText, { color: colors.tertiary }]}>✦</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>Ask Iris anything</Text>
          <Text style={[styles.cost, { color: colors.textMuted }]}>{costLabel}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionRow}
      >
        {SUGGESTIONS.map((suggestion) => (
          <TouchableOpacity
            key={suggestion}
            activeOpacity={onPressSuggestion ? 0.8 : 1}
            disabled={!onPressSuggestion}
            onPress={() => onPressSuggestion?.(suggestion)}
            style={[
              styles.suggestionChip,
              { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: colors.ghostBorder },
            ]}
          >
            <Text style={[styles.suggestionText, { color: colors.textMuted }]}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  cost: {
    fontSize: 11,
  },
  suggestionRow: {
    gap: 8,
    paddingRight: 4,
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  suggestionText: {
    fontSize: 11,
  },
});
