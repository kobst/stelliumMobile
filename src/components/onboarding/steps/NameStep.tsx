import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { WizardStep } from '../WizardStep';
import { useTheme } from '../../../theme';

interface NameStepProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
}

export const NameStep: React.FC<NameStepProps> = ({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <WizardStep
      title="Let's get to know you ✨"
      subtitle="What should we call you?"
      icon="👋"
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
});