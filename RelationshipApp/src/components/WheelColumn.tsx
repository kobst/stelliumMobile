import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme';

export const ITEM_HEIGHT = 56;
export const VISIBLE_ROWS = 5;
export const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

const CENTER_OFFSET = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;
const WRAP_REPETITIONS = 5;
const MOMENTUM_FACTOR = 220;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTranslateForIndex(index: number) {
  return CENTER_OFFSET - index * ITEM_HEIGHT;
}

export interface WheelColumnProps {
  items: readonly string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  flex?: number;
  emphasis?: 'number' | 'label';
  wrap?: boolean;
}

export const WheelColumn: React.FC<WheelColumnProps> = ({
  items,
  selectedValue,
  onSelect,
  flex = 1,
  emphasis = 'number',
  wrap = false,
}) => {
  const { colors } = useTheme();
  const displayItems = useMemo(
    () =>
      wrap
        ? Array.from({ length: WRAP_REPETITIONS }).flatMap(() => items as string[])
        : (items as string[]),
    [items, wrap],
  );
  const middleOffset = wrap ? Math.floor(WRAP_REPETITIONS / 2) * items.length : 0;
  const logicalSelectedIndex = Math.max(items.indexOf(selectedValue), 0);
  const centeredIndex = logicalSelectedIndex + middleOffset;

  const translateY = useRef(new Animated.Value(0)).current;
  const startTranslateRef = useRef(getTranslateForIndex(centeredIndex));

  useEffect(() => {
    const nextTranslate = getTranslateForIndex(centeredIndex);
    startTranslateRef.current = nextTranslate;
    Animated.spring(translateY, {
      toValue: nextTranslate,
      useNativeDriver: true,
      tension: 110,
      friction: 14,
    }).start();
  }, [centeredIndex, translateY]);

  const commitToNearestIndex = useCallback(
    (rawTranslate: number) => {
      const rawNearestIndex = Math.round(
        (CENTER_OFFSET - rawTranslate) / ITEM_HEIGHT,
      );

      if (!wrap) {
        const nextIndex = clamp(rawNearestIndex, 0, items.length - 1);
        const snappedTranslate = getTranslateForIndex(nextIndex);
        startTranslateRef.current = snappedTranslate;

        Animated.spring(translateY, {
          toValue: snappedTranslate,
          useNativeDriver: true,
          tension: 110,
          friction: 14,
        }).start();

        const nextValue = items[nextIndex];
        if (nextValue && nextValue !== selectedValue) {
          onSelect(nextValue);
        }
        return;
      }

      const snappedTranslate = getTranslateForIndex(rawNearestIndex);
      startTranslateRef.current = snappedTranslate;

      Animated.spring(translateY, {
        toValue: snappedTranslate,
        useNativeDriver: true,
        tension: 110,
        friction: 14,
      }).start(({ finished }) => {
        if (!finished) {
          return;
        }
        const logicalIndex =
          ((rawNearestIndex % items.length) + items.length) % items.length;
        const middleTranslate = getTranslateForIndex(
          logicalIndex + middleOffset,
        );
        startTranslateRef.current = middleTranslate;
        translateY.setValue(middleTranslate);
        const nextValue = items[logicalIndex];
        if (nextValue && nextValue !== selectedValue) {
          onSelect(nextValue);
        }
      });
    },
    [items, middleOffset, onSelect, selectedValue, translateY, wrap],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 3,
        onPanResponderGrant: () => {
          translateY.stopAnimation((value) => {
            startTranslateRef.current = value;
          });
        },
        onPanResponderMove: (_evt, gestureState) => {
          translateY.setValue(startTranslateRef.current + gestureState.dy);
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_evt, gestureState) => {
          const current = startTranslateRef.current + gestureState.dy;
          commitToNearestIndex(current + gestureState.vy * MOMENTUM_FACTOR);
        },
        onPanResponderTerminate: (_evt, gestureState) => {
          const current = startTranslateRef.current + gestureState.dy;
          commitToNearestIndex(current + gestureState.vy * MOMENTUM_FACTOR);
        },
      }),
    [commitToNearestIndex, translateY],
  );

  return (
    <View style={[styles.columnShell, { flex }]} {...panResponder.panHandlers}>
      <View style={styles.fadeTop} pointerEvents="none" />
      <View style={styles.fadeBottom} pointerEvents="none" />
      <Animated.View
        style={[styles.columnTrack, { transform: [{ translateY }] }]}
      >
        {displayItems.map((item, index) => {
          const distance = Math.abs(index - centeredIndex);
          const isSelected = index === centeredIndex;
          const textColor =
            distance === 0
              ? colors.text
              : distance === 1
                ? colors.textMuted
                : colors.textSubtle;

          return (
            <View key={`${index}-${item}`} style={styles.itemRow}>
              <Text
                style={[
                  emphasis === 'label' ? styles.labelText : styles.numberText,
                  {
                    color: textColor,
                    opacity: distance > 2 ? 0.35 : 1,
                  },
                  isSelected &&
                    (emphasis === 'label'
                      ? styles.selectedLabelText
                      : styles.selectedNumberText),
                ]}
              >
                {item}
              </Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  columnShell: {
    height: PICKER_HEIGHT,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  itemRow: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 24,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 22,
  },
  selectedNumberText: {
    fontSize: 48,
    fontStyle: 'normal',
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 56,
  },
  selectedLabelText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.6,
    lineHeight: 28,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
  },
});
