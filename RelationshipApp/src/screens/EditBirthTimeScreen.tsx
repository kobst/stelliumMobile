import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRelationshipAppStore } from '../store';
import { BirthTimeStep } from '../components/BirthTimeStep';

export function EditBirthTimeScreen() {
  const navigation = useNavigation();
  const draft = useRelationshipAppStore((state) => state.birthDetailsDraft);
  const updateDraft = useRelationshipAppStore((state) => state.updateBirthDetailsDraft);

  const value = draft?.time ?? '12:00';
  const birthTimeUnknown = draft?.birthTimeUnknown ?? false;

  const handleChange = useCallback(
    (next: string) => {
      updateDraft({ time: next });
    },
    [updateDraft]
  );

  const handleToggleUnknown = useCallback(() => {
    updateDraft({ birthTimeUnknown: !birthTimeUnknown });
  }, [birthTimeUnknown, updateDraft]);

  const handleDone = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  return (
    <BirthTimeStep
      title="What time were you born?"
      value={value}
      birthTimeUnknown={birthTimeUnknown}
      onToggleUnknown={handleToggleUnknown}
      onChange={handleChange}
      onContinue={handleDone}
      continueLabel="Done"
      backLabel="Birth details"
    />
  );
}
