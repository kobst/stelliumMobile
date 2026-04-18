import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { BirthTimeStep } from '../components/BirthTimeStep';
import { useRelationshipAppStore } from '../store';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

export function PartnerBirthTimeScreen() {
  const navigation = useNavigation<RootNavigation>();
  const draft = useRelationshipAppStore((state) => state.partnerDraft);
  const updateDraft = useRelationshipAppStore((state) => state.updatePartnerDraft);

  const value = draft?.time ?? '12:00';
  const birthTimeUnknown = draft?.birthTimeUnknown ?? false;
  const firstName = draft?.firstName?.trim() ?? '';
  const subjectName = firstName || 'them';

  const handleChange = useCallback(
    (next: string) => {
      updateDraft({ time: next });
    },
    [updateDraft]
  );

  const handleToggleUnknown = useCallback(() => {
    updateDraft({ birthTimeUnknown: !birthTimeUnknown });
  }, [birthTimeUnknown, updateDraft]);

  const handleContinue = useCallback(() => {
    navigation.navigate('PartnerBirthCity');
  }, [navigation]);

  return (
    <BirthTimeStep
      title={`What time was ${subjectName} born?`}
      value={value}
      birthTimeUnknown={birthTimeUnknown}
      onToggleUnknown={handleToggleUnknown}
      onChange={handleChange}
      onContinue={handleContinue}
      continueLabel="Continue"
      backLabel="Back"
    />
  );
}
