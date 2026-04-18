import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRelationshipAppStore } from '../store';
import { BirthCityStep } from '../components/BirthCityStep';
import type { PlaceDetails } from '../api';

export function EditBirthCityScreen() {
  const navigation = useNavigation();
  const draft = useRelationshipAppStore((state) => state.birthDetailsDraft);
  const updateDraft = useRelationshipAppStore((state) => state.updateBirthDetailsDraft);

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

  const handleDone = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  return (
    <BirthCityStep
      title="Where were you born?"
      value={draft?.placeOfBirth ?? ''}
      onChangeText={handleChangeText}
      onSelectSuggestion={handleSelectSuggestion}
      latitude={draft?.latitude ?? null}
      longitude={draft?.longitude ?? null}
      totalOffsetHours={draft?.totalOffsetHours ?? null}
      onLatitudeChange={(latitude) => updateDraft({ latitude })}
      onLongitudeChange={(longitude) => updateDraft({ longitude })}
      onOffsetChange={(totalOffsetHours) => updateDraft({ totalOffsetHours })}
      onContinue={handleDone}
      continueLabel="Done"
      backLabel="Birth details"
    />
  );
}
