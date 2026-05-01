import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme';

export interface FilterSheetOption<T extends string> {
  key: T;
  label: string;
  count: number;
  /** Optional leading element (glyph, dot, etc.). */
  leading?: React.ReactNode;
}

interface FilterSheetProps<T extends string> {
  visible: boolean;
  title: string;
  options: readonly FilterSheetOption<T>[];
  selected: T;
  onSelect: (key: T) => void;
  onClose: () => void;
}

export function FilterSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: FilterSheetProps<T>) {
  const { colors } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={[styles.dismiss, { color: colors.textMuted }]}>Done</Text>
            </Pressable>
          </View>
          <View style={styles.list}>
            {options.map((option) => {
              const isActive = option.key === selected;
              const isDisabled = option.count === 0 && !isActive;
              return (
                <Pressable
                  key={option.key}
                  disabled={isDisabled}
                  onPress={() => onSelect(option.key)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      borderBottomColor: colors.ghostBorder,
                      opacity: isDisabled ? 0.4 : pressed ? 0.7 : 1,
                      backgroundColor: isActive
                        ? 'rgba(127, 119, 221, 0.12)'
                        : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.rowLeft}>
                    {option.leading ? (
                      <View style={styles.leading}>{option.leading}</View>
                    ) : null}
                    <Text
                      style={[
                        styles.rowLabel,
                        {
                          color: colors.text,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                  <Text style={[styles.count, { color: colors.textSubtle }]}>
                    {option.count}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  dismiss: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  leading: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 14,
  },
  count: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
