import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { WizardStep } from '../WizardStep';
import { FloatingLabelInput } from '../FloatingLabelInput';
import { RadioButton } from '../RadioButton';
import { useTheme } from '../../../theme';

interface NameGenderStepProps {
  firstName: string;
  lastName: string;
  gender: string;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
  onGenderChange: (gender: string) => void;
}

export const NameGenderStep: React.FC<NameGenderStepProps> = ({
  firstName,
  lastName,
  gender,
  onFirstNameChange,
  onLastNameChange,
  onGenderChange,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <WizardStep
      title="Who are you?"
      subtitle="Enter your name and select how you identify"
    >
      <View style={styles.formGroup}>
        <FloatingLabelInput
          label="First Name"
          value={firstName}
          onChangeText={onFirstNameChange}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <FloatingLabelInput
          label="Last Name"
          value={lastName}
          onChangeText={onLastNameChange}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Your gender/sex is</Text>
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
          Used to personalize pronouns in readings
        </Text>
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
  radioGroup: {
    gap: 16,
  },
  privacyNote: {
    color: colors.onSurfaceLow,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
});
