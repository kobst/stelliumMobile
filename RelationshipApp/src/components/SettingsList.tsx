import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

export interface SettingsRowConfig {
  key: string;
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface SettingsListProps {
  rows: readonly SettingsRowConfig[];
}

export function SettingsList({ rows }: SettingsListProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.list,
        {
          backgroundColor: colors.surface,
          borderColor: colors.ghostBorder,
        },
      ]}
    >
      {rows.map((row, index) => (
        <TouchableOpacity
          key={row.key}
          activeOpacity={0.7}
          onPress={row.onPress}
          style={[
            styles.row,
            index < rows.length - 1 ? styles.rowDivider : null,
            index < rows.length - 1 ? { borderBottomColor: colors.ghostBorder } : null,
          ]}
        >
          <View
            style={[
              styles.iconBubble,
              {
                backgroundColor: colors.surfaceHigh,
                borderColor: colors.ghostBorder,
              },
            ]}
          >
            <Text style={[styles.iconText, { color: colors.textMuted }]}>{row.icon}</Text>
          </View>
          <Text
            style={[
              styles.label,
              { color: row.destructive ? colors.error : colors.text },
            ]}
          >
            {row.label}
          </Text>
          <Text style={[styles.chev, { color: colors.textSubtle }]}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  chev: {
    fontSize: 18,
    fontWeight: '500',
  },
});
