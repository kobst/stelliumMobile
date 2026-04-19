import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import type { AskAspectRef } from '../store';

interface AskInputBarProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  selectedAspects: readonly AskAspectRef[];
  onRemoveAspect: (aspect: AskAspectRef) => void;
  onOpenPicker: () => void;
  placeholder: string;
  costLabel: string;
  maxSelection?: number;
  canSend: boolean;
  aspectsAvailable: boolean;
}

export function AskInputBar({
  value,
  onChangeText,
  onSend,
  selectedAspects,
  onRemoveAspect,
  onOpenPicker,
  placeholder,
  costLabel,
  maxSelection = 3,
  canSend,
  aspectsAvailable,
}: AskInputBarProps) {
  const { colors } = useTheme();
  const hasSelection = selectedAspects.length > 0;

  return (
    <View
      style={[
        styles.wrap,
        { borderTopColor: colors.ghostBorder, backgroundColor: colors.surfaceLow },
      ]}
    >
      {hasSelection ? (
        <View style={styles.selectedRow}>
          {selectedAspects.map((aspect) => (
            <View
              key={aspect.id}
              style={[
                styles.selectedPill,
                {
                  backgroundColor: 'rgba(233, 195, 73, 0.14)',
                  borderColor: 'rgba(233, 195, 73, 0.25)',
                },
              ]}
            >
              <Text style={[styles.selectedName, { color: colors.accent }]} numberOfLines={1}>
                {aspect.shortName}
              </Text>
              <TouchableOpacity
                onPress={() => onRemoveAspect(aspect)}
                hitSlop={8}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectedRemove, { color: colors.accent }]}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.bottomRow}>
        {aspectsAvailable ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenPicker}
            style={[
              styles.contextButton,
              {
                backgroundColor: hasSelection ? 'rgba(233, 195, 73, 0.12)' : colors.surface,
                borderColor: hasSelection ? 'rgba(233, 195, 73, 0.25)' : colors.ghostBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.contextIcon,
                { color: hasSelection ? colors.accent : colors.textSubtle },
              ]}
            >
              ⊕
            </Text>
            {hasSelection ? (
              <Text style={[styles.contextCount, { color: colors.accent }]}>
                {selectedAspects.length}/{maxSelection}
              </Text>
            ) : null}
          </TouchableOpacity>
        ) : null}

        <View
          style={[
            styles.inputShell,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textSubtle}
            style={[styles.input, { color: colors.text }]}
            multiline
            onSubmitEditing={() => {
              if (canSend) onSend();
            }}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            disabled={!canSend}
            onPress={onSend}
            activeOpacity={canSend ? 0.8 : 1}
            style={[
              styles.sendButton,
              {
                backgroundColor: canSend ? colors.primary : colors.surfaceHigh,
              },
            ]}
          >
            <Text
              style={[
                styles.sendLabel,
                { color: canSend ? colors.onPrimary : colors.textSubtle },
              ]}
            >
              {costLabel} ↑
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.footnote, { color: colors.textSubtle }]}>
        Viewing history is free · {costLabel} per new question
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectedName: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 150,
  },
  selectedRemove: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  contextButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  contextIcon: {
    fontSize: 16,
  },
  contextCount: {
    fontSize: 9,
    fontWeight: '700',
  },
  inputShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    borderWidth: 1,
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 42,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    maxHeight: 120,
  },
  sendButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  footnote: {
    marginTop: 8,
    fontSize: 10.5,
    textAlign: 'center',
  },
});
