import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { WheelColumn, ITEM_HEIGHT, PICKER_HEIGHT } from './WheelColumn';

interface BirthDatePickerProps {
  value: string;
  onChange: (nextValue: string) => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MIN_YEAR = 1920;
const MAX_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, index) => String(MIN_YEAR + index),
);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function buildDayItems(month: number, year: number): string[] {
  const count = daysInMonth(month, year);
  return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0'));
}

function parseDate(value: string) {
  const [rawYear, rawMonth, rawDay] = value.split('-').map(Number);
  const year = clamp(
    Number.isFinite(rawYear) ? rawYear : 1995,
    MIN_YEAR,
    MAX_YEAR,
  );
  const month = clamp(Number.isFinite(rawMonth) ? rawMonth : 1, 1, 12);
  const maxDay = daysInMonth(month, year);
  const day = clamp(Number.isFinite(rawDay) ? rawDay : 1, 1, maxDay);

  return {
    yearStr: String(year),
    monthStr: MONTH_NAMES[month - 1],
    dayStr: String(day).padStart(2, '0'),
    year,
    month,
    day,
  };
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const BirthDatePicker: React.FC<BirthDatePickerProps> = ({
  value,
  onChange,
}) => {
  const { colors } = useTheme();
  const parsed = useMemo(() => parseDate(value), [value]);
  const dayItems = useMemo(
    () => buildDayItems(parsed.month, parsed.year),
    [parsed.month, parsed.year],
  );

  const prevDayRef = useRef(parsed.dayStr);
  useEffect(() => {
    prevDayRef.current = parsed.dayStr;
  }, [parsed.dayStr]);

  const handleMonthSelect = (nextMonthName: string) => {
    const nextMonth = MONTH_NAMES.indexOf(nextMonthName) + 1;
    if (nextMonth < 1) {
      return;
    }
    const maxDay = daysInMonth(nextMonth, parsed.year);
    const clampedDay = Math.min(parsed.day, maxDay);
    onChange(formatDate(parsed.year, nextMonth, clampedDay));
  };

  const handleDaySelect = (nextDayStr: string) => {
    const nextDay = Number(nextDayStr);
    if (!Number.isFinite(nextDay)) {
      return;
    }
    onChange(formatDate(parsed.year, parsed.month, nextDay));
  };

  const handleYearSelect = (nextYearStr: string) => {
    const nextYear = Number(nextYearStr);
    if (!Number.isFinite(nextYear)) {
      return;
    }
    const maxDay = daysInMonth(parsed.month, nextYear);
    const clampedDay = Math.min(parsed.day, maxDay);
    onChange(formatDate(nextYear, parsed.month, clampedDay));
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.selectionBand,
          { backgroundColor: 'rgba(202,190,255,0.06)', borderColor: 'rgba(202,190,255,0.2)' },
        ]}
      />

      <View style={styles.content}>
        <View
          style={[styles.axisLine, { backgroundColor: colors.ghostBorder }]}
        />

        <View style={styles.columns}>
          <WheelColumn
            items={MONTH_NAMES}
            selectedValue={parsed.monthStr}
            onSelect={handleMonthSelect}
            flex={1}
            emphasis="label"
            wrap
          />

          <WheelColumn
            items={dayItems}
            selectedValue={parsed.dayStr}
            onSelect={handleDaySelect}
            flex={0.7}
            wrap
          />

          <WheelColumn
            items={YEARS}
            selectedValue={parsed.yearStr}
            onSelect={handleYearSelect}
            flex={1}
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
    width: 280,
    height: ITEM_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    opacity: 0.9,
  },
  content: {
    width: 300,
    height: PICKER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  axisLine: {
    position: 'absolute',
    width: 260,
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
});
