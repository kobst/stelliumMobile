import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRelationshipAppStore } from '../store';
import { BirthDateStep } from '../components/BirthDateStep';

export function EditBirthDateScreen() {
  const navigation = useNavigation();
  const draft = useRelationshipAppStore((state) => state.birthDetailsDraft);
  const updateDraft = useRelationshipAppStore((state) => state.updateBirthDetailsDraft);

  const value = draft?.dateOfBirth ?? '1995-01-01';

  const handleChange = useCallback(
    (next: string) => {
      updateDraft({ dateOfBirth: next });
    },
    [updateDraft]
  );

  const handleDone = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  return (
    <BirthDateStep
      title="When were you born?"
      value={value}
      onChange={handleChange}
      onContinue={handleDone}
      continueLabel="Done"
      backLabel="Birth details"
    />
  );
}
