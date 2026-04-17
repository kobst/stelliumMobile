import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import type { AskMessage } from '../store';

export interface AskIrisCardCopy {
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  suggestions: readonly string[];
}

interface AskIrisCardProps {
  copy: AskIrisCardCopy;
  lastUserMessage: AskMessage | null;
  lastIrisMessage: AskMessage | null;
  costLabel?: string;
  onPressInput: (prefill?: string) => void;
  onPressContinue: () => void;
}

export function AskIrisCard({
  copy,
  lastUserMessage,
  lastIrisMessage,
  costLabel = '◆ 1',
  onPressInput,
  onPressContinue,
}: AskIrisCardProps) {
  const { colors } = useTheme();
  const hasHistory = Boolean(lastUserMessage && lastIrisMessage);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.ghostBorder,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconBubble}>
          <Text style={[styles.iconText, { color: colors.tertiary }]}>✦</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{copy.subtitle}</Text>
        </View>
      </View>

      {hasHistory && lastUserMessage && lastIrisMessage ? (
        <View style={styles.historyBlock}>
          <Text
            style={[styles.userQuestion, { color: colors.textSubtle }]}
            numberOfLines={2}
          >
            {lastUserMessage.text}
          </Text>
          <Text
            style={[styles.irisReply, { color: colors.text }]}
            numberOfLines={2}
          >
            {lastIrisMessage.text}
          </Text>
          <TouchableOpacity onPress={onPressContinue} activeOpacity={0.7}>
            <Text style={[styles.continueLink, { color: colors.primary }]}>
              Continue conversation →
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => onPressInput()}
          activeOpacity={0.8}
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.surfaceHigh,
              borderColor: colors.ghostBorder,
            },
          ]}
        >
          <Text style={[styles.inputPlaceholder, { color: colors.textSubtle }]} numberOfLines={1}>
            {copy.inputPlaceholder}
          </Text>
          <View style={styles.costPill}>
            <Text style={[styles.costText, { color: colors.accent }]}>{costLabel}</Text>
          </View>
        </TouchableOpacity>
      )}

      {copy.suggestions.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionRow}
        >
          {copy.suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              activeOpacity={0.8}
              onPress={() => onPressInput(suggestion)}
              style={[
                styles.suggestionChip,
                {
                  backgroundColor: colors.surfaceHigh,
                  borderColor: colors.ghostBorder,
                },
              ]}
            >
              <Text style={[styles.suggestionText, { color: colors.textMuted }]}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 220, 229, 0.12)',
  },
  iconText: {
    fontSize: 16,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
  },
  historyBlock: {
    gap: 8,
  },
  userQuestion: {
    fontSize: 13,
    lineHeight: 18,
  },
  irisReply: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  continueLink: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputPlaceholder: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
  },
  costPill: {
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: 'rgba(233, 195, 73, 0.15)',
  },
  costText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    fontSize: 12,
  },
});
