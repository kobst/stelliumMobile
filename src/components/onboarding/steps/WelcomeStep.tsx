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

interface WelcomeStepProps {
  firstName: string;
  lastName: string;
  gender: string;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
  onGenderChange: (gender: string) => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  firstName,
  lastName,
  gender,
  onFirstNameChange,
  onLastNameChange,
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
      title="Let's get to know your stars ✨"
      subtitle="Your birth details help us create your personalized chart and insights"
      icon="☀️"
    >
      <View style={styles.formGroup}>
        <Text style={styles.label}>My name is</Text>
        <View style={styles.nameRow}>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="First Name"
            placeholderTextColor={colors.onSurfaceVariant}
            value={firstName}
            onChangeText={onFirstNameChange}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="Last Name"
            placeholderTextColor={colors.onSurfaceVariant}
            value={lastName}
            onChangeText={onLastNameChange}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>My gender/pronouns are</Text>
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
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
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