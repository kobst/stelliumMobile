import React from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';

type Props = StackScreenProps<RelationshipRootParamList, 'CreateSelfProfile'>;

export const CreateSelfProfileScreen: React.FC<Props> = ({ navigation }) => {
  const setCompletedSelfProfile = useRelationshipAppStore((state) => state.setCompletedSelfProfile);

  return (
    <PlaceholderScreen
      eyebrow="You"
      title="Create your persistent relationship profile."
      body="This screen will collect the one self profile used across repeated analyses. It replaces the old astrology-first onboarding with a lighter relationship-first entry."
      primaryLabel="Continue To Target"
      secondaryLabel="Back"
      onPrimaryPress={() => {
        setCompletedSelfProfile(true);
        navigation.navigate('ChooseTargetType');
      }}
      onSecondaryPress={() => navigation.goBack()}
    />
  );
};
