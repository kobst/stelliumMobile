import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WizardStep } from '../WizardStep';
import { RadioButton } from '../RadioButton';
import { useTheme } from '../../../theme';

interface GuestBirthDateTimeStepProps {
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

export const GuestBirthDateTimeStep: React.FC<GuestBirthDateTimeStepProps> = ({
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

  // Create date object from current values
  const currentDate = useMemo(() => {
    const year = parseInt(birthYear) || new Date().getFullYear() - 25;
    const month = parseInt(birthMonth) || 1;
    const day = parseInt(birthDay) || 1;
    return new Date(year, month - 1, day);
  }, [birthYear, birthMonth, birthDay]);

  // Create time object from current values
  const currentTime = useMemo(() => {
    let hour = parseInt(birthHour) || 12;
    const minute = parseInt(birthMinute) || 0;

    // Convert to 24-hour format
    if (amPm === 'AM') {
      hour = hour === 12 ? 0 : hour;
    } else {
      hour = hour === 12 ? 12 : hour + 12;
    }

    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
  }, [birthHour, birthMinute, amPm]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      onBirthYearChange(String(selectedDate.getFullYear()));
      onBirthMonthChange(String(selectedDate.getMonth() + 1).padStart(2, '0'));
      onBirthDayChange(String(selectedDate.getDate()).padStart(2, '0'));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      let hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();

      // Convert to 12-hour format
      const newAmPm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;

      onBirthHourChange(String(hours).padStart(2, '0'));
      onBirthMinuteChange(String(minutes).padStart(2, '0'));
      onAmPmChange(newAmPm);
    }
  };

  return (
    <WizardStep
      title="When were they born?"
      subtitle="Date and time form the foundation of their chart"
    >
      <View style={styles.formGroup}>
        <Text style={styles.label}>Birth date</Text>
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      </View>

      <View style={styles.formGroup}>
        <View style={styles.timeHeaderRow}>
          <Text style={styles.label}>Birth time</Text>
          <View style={styles.timeToggleRow}>
            <RadioButton
              selected={!unknownTime}
              onPress={() => onUnknownTimeChange(false)}
              label="Known"
            />
            <RadioButton
              selected={unknownTime}
              onPress={() => onUnknownTimeChange(true)}
              label="Unknown"
            />
          </View>
        </View>

        {!unknownTime && (
          <View style={styles.timePickerContainer}>
            <DateTimePicker
              value={currentTime}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              locale="en_US"
            />
          </View>
        )}

        {unknownTime && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              We'll use a solar chart if the exact time isn't known
            </Text>
          </View>
        )}
      </View>
    </WizardStep>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  formGroup: {
    marginBottom: 28,
  },
  label: {
    color: colors.onBackground,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeToggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timePickerContainer: {
    height: 180,
  },
  infoContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 14,
    padding: 18,
    marginTop: 10,
  },
  infoText: {
    color: colors.onSurfaceMed,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
