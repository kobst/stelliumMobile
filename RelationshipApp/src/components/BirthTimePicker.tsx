import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { WheelColumn, ITEM_HEIGHT, PICKER_HEIGHT } from './WheelColumn';

interface BirthTimePickerProps {
  value: string;
  onChange: (nextValue: string) => void;
}

type Meridiem = 'AM' | 'PM';

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0'),
);
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

export const BirthTimePicker: React.FC<BirthTimePickerProps> = ({
  value,
  onChange,
}) => {
  const { colors } = useTheme();
  const { hour12, minute, meridiem } = useMemo(() => parseTime(value), [value]);

  const updateTime = (
    nextHour12: string,
    nextMinute: string,
    nextMeridiem: Meridiem,
  ) => {
    onChange(to24Hour(nextHour12, nextMinute, nextMeridiem));
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.selectionBand,
          { backgroundColor: colors.surfaceLow, borderColor: colors.ghostBorder },
        ]}
      />

      <View style={styles.content}>
        <View
          style={[styles.axisLine, { backgroundColor: colors.ghostBorder }]}
        />

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
            onSelect={(nextMinute) =>
              updateTime(hour12, nextMinute, meridiem)
            }
            wrap
          />

          <WheelColumn
            items={MERIDIEMS}
            selectedValue={meridiem}
            onSelect={(nextMeridiem) =>
              updateTime(hour12, minute, nextMeridiem as Meridiem)
            }
            flex={0.75}
            emphasis="label"
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
});
