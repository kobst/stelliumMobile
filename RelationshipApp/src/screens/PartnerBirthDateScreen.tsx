import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { BirthDateStep } from '../components/BirthDateStep';
import { useRelationshipAppStore } from '../store';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

export function PartnerBirthDateScreen() {
  const navigation = useNavigation<RootNavigation>();
  const draft = useRelationshipAppStore((state) => state.partnerDraft);
  const updateDraft = useRelationshipAppStore((state) => state.updatePartnerDraft);

  const value = draft?.dateOfBirth ?? '1995-01-01';
  const firstName = draft?.firstName?.trim() ?? '';
  const subjectName = firstName || 'them';

  const handleChange = useCallback(
    (next: string) => {
      updateDraft({ dateOfBirth: next });
    },
    [updateDraft]
  );

  const handleContinue = useCallback(() => {
    navigation.navigate('PartnerBirthTime');
  }, [navigation]);

  return (
    <BirthDateStep
      title={`When was ${subjectName} born?`}
      value={value}
      onChange={handleChange}
      onContinue={handleContinue}
      continueLabel="Continue"
      backLabel="Back"
    />
  );
}
