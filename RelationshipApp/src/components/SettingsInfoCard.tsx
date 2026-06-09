import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

export interface SettingsInfoRow {
  key: string;
  icon?: string;
  label: string;
  subtitle?: string;
  tag?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  alignTop?: boolean;
}

interface SettingsInfoCardProps {
  rows: readonly SettingsInfoRow[];
}

export function SettingsInfoCard({ rows }: SettingsInfoCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceLow }]}>
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        const content = (
          <View
            style={[
              styles.row,
              row.alignTop ? styles.rowAlignTop : null,
              isLast ? null : { borderBottomWidth: 1, borderBottomColor: 'rgba(202, 190, 255, 0.07)' },
            ]}
          >
            {row.icon ? (
              <View style={[styles.iconBubble, { backgroundColor: colors.surfaceHigh }]}>
                <Text style={[styles.iconText, { color: colors.textMuted }]}>{row.icon}</Text>
              </View>
            ) : null}
            <View style={styles.body}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>{row.label}</Text>
                {row.tag ? (
                  <View
                    style={[
                      styles.tag,
                      { backgroundColor: 'rgba(233, 195, 73, 0.16)' },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.accent }]}>{row.tag}</Text>
                  </View>
                ) : null}
              </View>
              {row.subtitle ? (
                <Text style={[styles.subtitle, { color: colors.textSubtle }]}>{row.subtitle}</Text>
              ) : null}
            </View>
            {row.trailing ?? null}
            {row.chevron ? (
              <Text style={[styles.chev, { color: colors.textSubtle }]}>›</Text>
            ) : null}
          </View>
        );
        if (row.onPress) {
          return (
            <TouchableOpacity
              key={row.key}
              onPress={row.onPress}
              activeOpacity={0.75}
            >
              {content}
            </TouchableOpacity>
          );
        }
        return <View key={row.key}>{content}</View>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rowAlignTop: {
    alignItems: 'flex-start',
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
  },
  body: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  chev: {
    fontSize: 18,
  },
});
