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
    <View style={[styles.list, { backgroundColor: colors.surfaceLow }]}>
      {rows.map((row, index) => (
        <TouchableOpacity
          key={row.key}
          activeOpacity={0.7}
          onPress={row.onPress}
          style={[
            styles.row,
            index < rows.length - 1 ? styles.rowDivider : null,
            index < rows.length - 1 ? { borderBottomColor: 'rgba(202, 190, 255, 0.07)' } : null,
          ]}
        >
          <View
            style={[
              styles.iconBubble,
              {
                backgroundColor: 'rgba(202, 190, 255, 0.08)',
              },
            ]}
          >
            <Text
              style={[
                styles.iconText,
                { color: row.destructive ? colors.error : colors.primary },
              ]}
            >
              {row.icon}
            </Text>
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
    borderRadius: 22,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 15,
  },
  label: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
  },
  chev: {
    fontSize: 18,
    fontWeight: '500',
  },
});
