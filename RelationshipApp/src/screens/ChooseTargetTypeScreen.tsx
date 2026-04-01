import React from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';

type Props = StackScreenProps<RelationshipRootParamList, 'ChooseTargetType'>;

export const ChooseTargetTypeScreen: React.FC<Props> = ({ navigation }) => {
  const setActiveTargetType = useRelationshipAppStore((state) => state.setActiveTargetType);

  return (
    <PlaceholderScreen
      eyebrow="Target"
      title="Choose who you want to analyze."
      body="This flow branches into a real-person path and a celebrity path. Both should end in the same preview-first compatibility result."
      primaryLabel="Someone I Know"
      secondaryLabel="Celebrity"
      onPrimaryPress={() => {
        setActiveTargetType('person');
        navigation.navigate('CreatePartner');
      }}
      onSecondaryPress={() => {
        setActiveTargetType('celebrity');
        navigation.navigate('SelectCelebrity');
      }}
    />
  );
};
