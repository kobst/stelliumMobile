import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { WizardStep } from '../WizardStep';
import { useTheme } from '../../../theme';

interface GenderStepProps {
  gender: string;
  onGenderChange: (gender: string) => void;
}

export const GenderStep: React.FC<GenderStepProps> = ({
  gender,
  onGenderChange,
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
      title="Tell us about yourself"
      subtitle="This helps us personalize your astrological insights"
    >
      <View style={styles.formGroup}>
        <Text style={styles.label}>My gender is</Text>
        <View style={styles.radioGroup}>
          <RadioButton
            selected={gender === 'male'}
            onPress={() => onGenderChange('male')}
            label="Male (he/him)"
          />
          <RadioButton
            selected={gender === 'female'}
            onPress={() => onGenderChange('female')}
            label="Female (she/her)"
          />
          <RadioButton
            selected={gender === 'nonbinary'}
            onPress={() => onGenderChange('nonbinary')}
            label="Non-binary (they/them)"
          />
        </View>
        <Text style={styles.privacyNote}>
          Only used to personalize your reading
        </Text>
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
  radioGroup: {
    gap: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
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
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    color: colors.onBackground,
    fontSize: 16,
    fontWeight: '500',
  },
  privacyNote: {
    color: colors.onSurfaceLow,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
});