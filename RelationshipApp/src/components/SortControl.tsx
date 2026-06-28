import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme';

export type SortMode = 'strength' | 'recent';
export type SortDirection = 'asc' | 'desc';

interface SortControlProps {
  mode: SortMode;
  direction: SortDirection;
  onChangeMode: (mode: SortMode) => void;
  onToggleDirection: () => void;
}

const MODES: { key: SortMode; label: string }[] = [
  { key: 'strength', label: 'Strength' },
  { key: 'recent', label: 'Recent' },
];

// Up/down chevrons; the active direction's chevron is emphasised.
function DirectionIcon({ direction, color, dim }: { direction: SortDirection; color: string; dim: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
      <Path
        d="M4 6.5 L8 3 L12 6.5"
        stroke={direction === 'asc' ? color : dim}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 9.5 L8 13 L12 9.5"
        stroke={direction === 'desc' ? color : dim}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * The Relationships-list sort control: a tappable "SORT" button that flips the
 * ascending/descending direction, plus a segmented Strength/Recent selector for
 * the sort mechanism.
 */
export function SortControl({ mode, direction, onChangeMode, onToggleDirection }: SortControlProps) {
  const { colors } = useTheme();
  const directionHint = direction === 'desc' ? 'High to low' : 'Low to high';

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggleDirection}
        accessibilityRole="button"
        accessibilityLabel={`Sort direction: ${directionHint}`}
        hitSlop={8}
        style={({ pressed }) => [styles.sortButton, { opacity: pressed ? 0.7 : 1 }]}
      >
        <DirectionIcon
          direction={direction}
          color={colors.text}
          dim="rgba(202, 190, 255, 0.35)"
        />
        <Text style={[styles.sortLabel, { color: colors.textMuted }]}>SORT</Text>
      </Pressable>

      <View style={[styles.segment, { borderColor: 'rgba(202, 190, 255, 0.12)' }]}>
        {MODES.map((item) => {
          const active = item.key === mode;
          return (
            <Pressable
              key={item.key}
              onPress={() => onChangeMode(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.segmentItem,
                active
                  ? {
                      backgroundColor: 'rgba(202, 190, 255, 0.12)',
                      borderColor: 'rgba(202, 190, 255, 0.35)',
                    }
                  : styles.segmentItemInactive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: active ? colors.text : colors.textMuted,
                    fontWeight: active ? '600' : '500',
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 100,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  segmentItem: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  segmentItemInactive: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  segmentText: {
    fontSize: 13,
    letterSpacing: 0.05,
  },
});
