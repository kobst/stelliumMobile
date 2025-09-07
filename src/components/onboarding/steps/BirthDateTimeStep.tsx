import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { WizardStep } from '../WizardStep';
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
      icon="🌙"
    >
      <View style={styles.formGroup}>
        <Text style={styles.label}>My birth date is</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Year</Text>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="YYYY"
              placeholderTextColor={colors.onSurfaceVariant}
              value={birthYear}
              onChangeText={(text) => {
                if (/^\d{0,4}$/.test(text)) {
                  onBirthYearChange(text);
                }
              }}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Month</Text>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="MM"
              placeholderTextColor={colors.onSurfaceVariant}
              value={birthMonth}
              onChangeText={(text) => {
                if (/^\d{0,2}$/.test(text) && (text === '' || (parseInt(text) >= 1 && parseInt(text) <= 12))) {
                  onBirthMonthChange(text);
                }
              }}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Day</Text>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="DD"
              placeholderTextColor={colors.onSurfaceVariant}
              value={birthDay}
              onChangeText={(text) => {
                if (/^\d{0,2}$/.test(text) && (text === '' || parseInt(text) <= 31)) {
                  onBirthDayChange(text);
                }
              }}
              keyboardType="numeric"
              maxLength={2}
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
            <View style={styles.timeRow}>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeLabel}>Hour</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="HH"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={birthHour}
                  onChangeText={(text) => {
                    if (/^\d{0,2}$/.test(text) && (text === '' || (parseInt(text) >= 1 && parseInt(text) <= 12))) {
                      onBirthHourChange(text);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeLabel}>Min</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="MM"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={birthMinute}
                  onChangeText={(text) => {
                    if (/^\d{0,2}$/.test(text) && (text === '' || parseInt(text) <= 59)) {
                      onBirthMinuteChange(text);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={2}
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
    marginBottom: 32,
  },
  label: {
    color: colors.onBackground,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    color: colors.onSurfaceMed,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  dateInput: {
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.onSurface,
    backgroundColor: colors.surface,
    fontSize: 16,
    fontWeight: '500',
  },
  timeToggleRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  timeContainer: {
    marginTop: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    color: colors.onSurfaceMed,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  timeInput: {
    textAlign: 'center',
  },
  timeSeparator: {
    color: colors.onBackground,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  amPmRow: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    color: colors.onBackground,
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    color: colors.onSurfaceMed,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
