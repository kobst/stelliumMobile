import React from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { RelationshipRootParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RelationshipRootParamList, 'CreatePartner'>;

export const CreatePartnerScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <PlaceholderScreen
      eyebrow="Real Person"
      title="Enter partner details for the first preview flow."
      body="This screen will create or reuse a guest subject, then request the structured relationship preview from the shared relationship analysis API."
      primaryLabel="Generate Preview"
      secondaryLabel="Back"
      onPrimaryPress={() => navigation.navigate('RelationshipPreview')}
      onSecondaryPress={() => navigation.goBack()}
    />
  );
};
