import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme';

interface BirthTimePickerProps {
  value: string;
  onChange: (nextValue: string) => void;
}

type Meridiem = 'AM' | 'PM';

const ITEM_HEIGHT = 56;
const VISIBLE_ROWS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const CENTER_OFFSET = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;
const WRAP_REPETITIONS = 5;
const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const MERIDIEMS: Meridiem[] = ['AM', 'PM'];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseTime(value: string) {
  const [rawHours, rawMinutes] = value.split(':').map(Number);
  const safeHours = Number.isFinite(rawHours) ? rawHours : 12;
  const safeMinutes = clamp(Number.isFinite(rawMinutes) ? rawMinutes : 0, 0, 59);
  const meridiem: Meridiem = safeHours >= 12 ? 'PM' : 'AM';
  const hour12 = String(safeHours % 12 || 12);

  return {
    hour12,
    minute: String(safeMinutes).padStart(2, '0'),
    meridiem,
  };
}

function to24Hour(hour12: string, minute: string, meridiem: Meridiem) {
  const parsedHour = Number(hour12);
  const normalizedHour = Number.isFinite(parsedHour) ? parsedHour : 12;
  let hours24 = normalizedHour % 12;

  if (meridiem === 'PM') {
    hours24 += 12;
  }

  return `${String(hours24).padStart(2, '0')}:${minute}`;
}

function getTranslateForIndex(index: number) {
  return CENTER_OFFSET - index * ITEM_HEIGHT;
}

interface WheelColumnProps {
  items: readonly string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  flex?: number;
  emphasis?: 'number' | 'meridiem';
  wrap?: boolean;
}

const WheelColumn: React.FC<WheelColumnProps> = ({
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

  const commitToNearestIndex = useCallback((rawTranslate: number) => {
    const rawNearestIndex = Math.round((CENTER_OFFSET - rawTranslate) / ITEM_HEIGHT);

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
      const middleTranslate = getTranslateForIndex(logicalIndex + middleOffset);
      startTranslateRef.current = middleTranslate;
      translateY.setValue(middleTranslate);
      const nextValue = items[logicalIndex];
      if (nextValue && nextValue !== selectedValue) {
        onSelect(nextValue);
      }
    });
  }, [items, middleOffset, onSelect, selectedValue, translateY, wrap]);

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
          commitToNearestIndex(startTranslateRef.current + gestureState.dy);
        },
        onPanResponderTerminate: (_evt, gestureState) => {
          commitToNearestIndex(startTranslateRef.current + gestureState.dy);
        },
      }),
    [commitToNearestIndex, translateY]
  );

  return (
    <View style={[styles.columnShell, { flex }]} {...panResponder.panHandlers}>
      <View style={styles.fadeTop} pointerEvents="none" />
      <View style={styles.fadeBottom} pointerEvents="none" />
      <Animated.View
        style={[
          styles.columnTrack,
          {
            transform: [{ translateY }],
          },
        ]}
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
                  emphasis === 'meridiem' ? styles.meridiemText : styles.numberText,
                  {
                    color: textColor,
                    opacity: distance > 2 ? 0.35 : 1,
                  },
                  isSelected &&
                    (emphasis === 'meridiem' ? styles.selectedMeridiemText : styles.selectedText),
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

export const BirthTimePicker: React.FC<BirthTimePickerProps> = ({ value, onChange }) => {
  const { colors } = useTheme();
  const { hour12, minute, meridiem } = useMemo(() => parseTime(value), [value]);

  const updateTime = (nextHour12: string, nextMinute: string, nextMeridiem: Meridiem) => {
    onChange(to24Hour(nextHour12, nextMinute, nextMeridiem));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.selectionBand, { backgroundColor: colors.surfaceLow, borderColor: colors.ghostBorder }]} />

      <View style={styles.content}>
        <View style={[styles.axisLine, { backgroundColor: colors.ghostBorder }]} />

        <View style={styles.columns}>
          <WheelColumn
            items={HOURS}
            selectedValue={hour12}
            onSelect={(nextHour12) => updateTime(nextHour12, minute, meridiem)}
            wrap
          />

          <View style={styles.colonWrap}>
            <Text style={[styles.colonText, { color: colors.accent }]}>:</Text>
          </View>

          <WheelColumn
            items={MINUTES}
            selectedValue={minute}
            onSelect={(nextMinute) => updateTime(hour12, nextMinute, meridiem)}
            wrap
          />

          <WheelColumn
            items={MERIDIEMS}
            selectedValue={meridiem}
            onSelect={(nextMeridiem) => updateTime(hour12, minute, nextMeridiem)}
            flex={0.75}
            emphasis="meridiem"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  selectionBand: {
    position: 'absolute',
    width: 200,
    height: ITEM_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    opacity: 0.9,
  },
  content: {
    width: 240,
    height: PICKER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  axisLine: {
    position: 'absolute',
    width: 180,
    height: 1,
    top: PICKER_HEIGHT / 2,
    marginTop: -0.5,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
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
  meridiemText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    lineHeight: 18,
  },
  selectedText: {
    fontSize: 48,
    fontStyle: 'normal',
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 56,
  },
  selectedMeridiemText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.4,
    lineHeight: 22,
  },
  colonWrap: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colonText: {
    fontSize: 34,
    fontWeight: '700',
    marginTop: -4,
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
