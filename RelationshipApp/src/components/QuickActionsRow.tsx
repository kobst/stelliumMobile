import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  tint: 'primary' | 'tertiary' | 'accent';
  onPress?: () => void;
}

interface QuickActionsRowProps {
  actions: QuickAction[];
}

const ACCENT_FILL = 'rgba(233, 195, 73, 0.15)';
const PRIMARY_FILL = 'rgba(202, 190, 255, 0.12)';
const TERTIARY_FILL = 'rgba(0, 220, 229, 0.12)';

export function QuickActionsRow({ actions }: QuickActionsRowProps) {
  const { colors } = useTheme();

  function tintBackground(tint: QuickAction['tint']) {
    if (tint === 'primary') return PRIMARY_FILL;
    if (tint === 'tertiary') return TERTIARY_FILL;
    return ACCENT_FILL;
  }
  function tintColor(tint: QuickAction['tint']) {
    if (tint === 'primary') return colors.primary;
    if (tint === 'tertiary') return colors.tertiary;
    return colors.accent;
  }

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          activeOpacity={action.onPress ? 0.8 : 1}
          disabled={!action.onPress}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={[
            styles.tile,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <View
            style={[
              styles.iconBubble,
              { backgroundColor: tintBackground(action.tint) },
            ]}
          >
            <Text style={[styles.iconGlyph, { color: tintColor(action.tint) }]}>
              {action.icon}
            </Text>
          </View>
          <Text style={[styles.label, { color: colors.textMuted }]}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 16,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
