import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { BirthCityStep } from '../components/BirthCityStep';
import { useRelationshipAppStore } from '../store';
import type { PlaceDetails } from '../api';

type RootNavigation = StackNavigationProp<RelationshipRootParamList>;

export function PartnerBirthCityScreen() {
  const navigation = useNavigation<RootNavigation>();
  const draft = useRelationshipAppStore((state) => state.partnerDraft);
  const updateDraft = useRelationshipAppStore((state) => state.updatePartnerDraft);

  const firstName = draft?.firstName?.trim() ?? '';
  const subjectName = firstName || 'them';

  const handleChangeText = useCallback(
    (next: string) => {
      updateDraft({ placeOfBirth: next });
    },
    [updateDraft]
  );

  const handleSelectSuggestion = useCallback(
    async (selection: PlaceDetails) => {
      updateDraft({
        placeOfBirth:
          selection.formattedAddress ||
          selection.displayName ||
          draft?.placeOfBirth ||
          '',
        latitude: selection.lat ?? null,
        longitude: selection.lng ?? null,
      });
    },
    [draft?.placeOfBirth, updateDraft]
  );

  const handleContinue = useCallback(() => {
    navigation.navigate('PartnerConfirm');
  }, [navigation]);

  return (
    <BirthCityStep
      title={`Where was ${subjectName} born?`}
      value={draft?.placeOfBirth ?? ''}
      onChangeText={handleChangeText}
      onSelectSuggestion={handleSelectSuggestion}
      latitude={draft?.latitude ?? null}
      longitude={draft?.longitude ?? null}
      totalOffsetHours={draft?.totalOffsetHours ?? null}
      onLatitudeChange={(latitude) => updateDraft({ latitude })}
      onLongitudeChange={(longitude) => updateDraft({ longitude })}
      onOffsetChange={(totalOffsetHours) => updateDraft({ totalOffsetHours })}
      onContinue={handleContinue}
      continueVariant="arrow"
      backLabel="Back"
      progress={{ current: 3, total: 5 }}
    />
  );
}
