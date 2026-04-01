import React from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { RelationshipRootParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RelationshipRootParamList, 'SelectCelebrity'>;

export const SelectCelebrityScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <PlaceholderScreen
      eyebrow="Celebrity"
      title="Pick from the shared celebrity dataset."
      body="This screen will use the shared celebrity APIs for search, trending picks, and selection before sending the user into the same preview result shape as real-person analyses."
      primaryLabel="Open Preview"
      secondaryLabel="Back"
      onPrimaryPress={() => navigation.navigate('RelationshipPreview')}
      onSecondaryPress={() => navigation.goBack()}
    />
  );
};
