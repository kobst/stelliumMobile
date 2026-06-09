import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const TINT_FILL: Record<QuickAction['tint'], string> = {
  primary: 'rgba(202, 190, 255, 0.16)',
  tertiary: 'rgba(0, 220, 229, 0.13)',
  accent: 'rgba(233, 195, 73, 0.13)',
};

const TINT_GLOW: Record<QuickAction['tint'], string> = {
  primary: '#cabeff',
  tertiary: '#00dce5',
  accent: '#e9c349',
};

export function QuickActionsRow({ actions }: QuickActionsRowProps) {
  const { colors } = useTheme();

  function tintColor(tint: QuickAction['tint']) {
    if (tint === 'primary') {
      return colors.primary;
    }
    if (tint === 'tertiary') {
      return colors.tertiary;
    }
    return colors.accent;
  }

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          activeOpacity={action.onPress ? 0.85 : 1}
          disabled={!action.onPress}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={[styles.tile, { backgroundColor: colors.surfaceLow }]}
        >
          <View
            style={[
              styles.iconBubble,
              {
                backgroundColor: TINT_FILL[action.tint],
                ...Platform.select({
                  ios: {
                    shadowColor: TINT_GLOW[action.tint],
                    shadowOpacity: 0.55,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 0 },
                  },
                  android: {},
                }),
              },
            ]}
          >
            <Text style={[styles.iconGlyph, { color: tintColor(action.tint) }]}>
              {action.icon}
            </Text>
          </View>
          <Text style={[styles.label, { color: colors.text }]}>{action.label}</Text>
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
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 18,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});
