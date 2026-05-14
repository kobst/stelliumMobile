import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { Halo } from './atmosphere/Halo';

const SUGGESTIONS: readonly string[] = [
  'Why do I keep attracting Scorpios?',
  'What should I look for this week?',
  'Compare my two connections',
];

interface HomeAskIrisCardProps {
  onPressSuggestion?: (suggestion: string) => void;
  costLabel?: string;
}

const TERTIARY_FILL = 'rgba(0, 220, 229, 0.13)';

export function HomeAskIrisCard({
  onPressSuggestion,
  costLabel = '◆ 1 per question',
}: HomeAskIrisCardProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceLow }]}>
      <Halo color={colors.tertiary} size={160} opacity={0.16} top={-50} right={-50} />
      <View style={styles.header}>
        <View
          style={[
            styles.iconBubble,
            {
              backgroundColor: TERTIARY_FILL,
              ...Platform.select({
                ios: {
                  shadowColor: colors.tertiary,
                  shadowOpacity: 0.55,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                },
                android: {},
              }),
            },
          ]}
        >
          <Text style={[styles.iconText, { color: colors.tertiary }]}>✦</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>Ask Iris anything</Text>
          <Text style={[styles.cost, { color: colors.textMuted }]}>{costLabel}</Text>
        </View>
      </View>

      <View style={styles.suggestionStack}>
        {SUGGESTIONS.map((suggestion) => (
          <TouchableOpacity
            key={suggestion}
            activeOpacity={onPressSuggestion ? 0.8 : 1}
            disabled={!onPressSuggestion}
            onPress={() => onPressSuggestion?.(suggestion)}
            style={[
              styles.suggestionChip,
              { backgroundColor: 'rgba(255,255,255,0.025)', borderColor: colors.ghostBorder },
            ]}
          >
            <Text style={[styles.suggestionText, { color: colors.textMuted }]}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    gap: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  cost: {
    fontSize: 11.5,
  },
  suggestionStack: {
    gap: 8,
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
