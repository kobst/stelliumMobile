import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { WizardStep } from '../WizardStep';
import { ScrollPicker } from '../ScrollPicker';
import { useTheme } from '../../../theme';

interface BirthDateTimeStepProps {
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  birthMinute: string;
  amPm: 'AM' | 'PM';
  unknownTime: boolean;
  onBirthYearChange: (text: string) => void;
  onBirthMonthChange: (text: string) => void;
  onBirthDayChange: (text: string) => void;
  onBirthHourChange: (text: string) => void;
  onBirthMinuteChange: (text: string) => void;
  onAmPmChange: (amPm: 'AM' | 'PM') => void;
  onUnknownTimeChange: (unknown: boolean) => void;
}

export const BirthDateTimeStep: React.FC<BirthDateTimeStepProps> = ({
  birthYear,
  birthMonth,
  birthDay,
  birthHour,
  birthMinute,
  amPm,
  unknownTime,
  onBirthYearChange,
  onBirthMonthChange,
  onBirthDayChange,
  onBirthHourChange,
  onBirthMinuteChange,
  onAmPmChange,
  onUnknownTimeChange,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Generate picker data
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100;
    return Array.from({ length: 101 }, (_, i) => String(currentYear - i));
  }, []);

  const months = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')),
  []);

  // Calculate days in the selected month
  const days = useMemo(() => {
    const year = parseInt(birthYear) || new Date().getFullYear();
    const month = parseInt(birthMonth) || 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  }, [birthYear, birthMonth]);

  const hours = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')),
  []);

  const minutes = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),
  []);

  // Auto-adjust day if it exceeds the max for the selected month
  useEffect(() => {
    const maxDay = days.length;
    const currentDay = parseInt(birthDay);
    if (currentDay > maxDay) {
      onBirthDayChange(String(maxDay).padStart(2, '0'));
    }
  }, [days, birthDay]);

  const RadioButton: React.FC<{
    selected: boolean;
    onPress: () => void;
    label: string;
  }> = ({ selected, onPress, label }) => (
    <TouchableOpacity style={styles.radioContainer} onPress={onPress}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <WizardStep
      title="When were you born?"
      subtitle="Your birth date and time create the foundation of your chart"
    >
      <View style={styles.formGroup}>
        <Text style={styles.label}>Birth date</Text>
        <View style={styles.pickerRow}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>YEAR</Text>
            <ScrollPicker
              items={years}
              selectedValue={birthYear}
              onValueChange={onBirthYearChange}
              height={140}
            />
          </View>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>MONTH</Text>
            <ScrollPicker
              items={months}
              selectedValue={birthMonth.padStart(2, '0')}
              onValueChange={onBirthMonthChange}
              height={140}
            />
          </View>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>DAY</Text>
            <ScrollPicker
              items={days}
              selectedValue={birthDay.padStart(2, '0')}
              onValueChange={onBirthDayChange}
              height={140}
            />
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Birth time</Text>
        <View style={styles.timeToggleRow}>
          <RadioButton
            selected={!unknownTime}
            onPress={() => onUnknownTimeChange(false)}
            label="Known Time"
          />
          <RadioButton
            selected={unknownTime}
            onPress={() => onUnknownTimeChange(true)}
            label="Unknown Time"
          />
        </View>

        {!unknownTime && (
          <View style={styles.timeContainer}>
            <View style={styles.timePickerRow}>
              <View style={styles.timePickerContainer}>
                <Text style={styles.pickerLabel}>HOUR</Text>
                <ScrollPicker
                  items={hours}
                  selectedValue={birthHour.padStart(2, '0')}
                  onValueChange={onBirthHourChange}
                  height={120}
                />
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timePickerContainer}>
                <Text style={styles.pickerLabel}>MIN</Text>
                <ScrollPicker
                  items={minutes}
                  selectedValue={birthMinute.padStart(2, '0')}
                  onValueChange={onBirthMinuteChange}
                  height={120}
                />
              </View>
            </View>
            <View style={styles.amPmRow}>
              <RadioButton
                selected={amPm === 'AM'}
                onPress={() => onAmPmChange('AM')}
                label="AM"
              />
              <RadioButton
                selected={amPm === 'PM'}
                onPress={() => onAmPmChange('PM')}
                label="PM"
              />
            </View>
          </View>
        )}

        {unknownTime && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              If you don't know your birth time, we'll use a solar chart for your readings
            </Text>
          </View>
        )}
      </View>
    </WizardStep>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: colors.onBackground,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    color: colors.onSurfaceMed,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeToggleRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
    justifyContent: 'center',
  },
  timeContainer: {
    marginTop: 12,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 14,
    padding: 14,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  timePickerContainer: {
    flex: 1,
  },
  timeSeparator: {
    color: colors.onBackground,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
  },
  amPmRow: {
    flexDirection: 'row',
    gap: 32,
    justifyContent: 'center',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    color: colors.onBackground,
    fontSize: 17,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
  },
  infoText: {
    color: colors.onSurfaceMed,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
