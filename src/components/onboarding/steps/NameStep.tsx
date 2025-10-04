import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { WizardStep } from '../WizardStep';
import { FloatingLabelInput } from '../FloatingLabelInput';

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
  return (
    <WizardStep
      title="Let's get to know you"
      subtitle="What should we call you?"
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
    </WizardStep>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    marginTop: 8,
  },
});