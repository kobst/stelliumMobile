import React from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { RelationshipRootParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RelationshipRootParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <PlaceholderScreen
      eyebrow="Relationship App"
      title="Understand your chemistry before you decode the stars."
      body="This app leads with compatibility, attraction, communication, and conflict patterns. Astrology powers the engine, but the visible experience stays centered on relationships."
      primaryLabel="Create Your Profile"
      secondaryLabel="Skip To Home Shell"
      onPrimaryPress={() => navigation.navigate('CreateSelfProfile')}
      onSecondaryPress={() => navigation.navigate('Main')}
    />
  );
};
