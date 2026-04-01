import React from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { RelationshipRootParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RelationshipRootParamList, 'Unlock'>;

export const UnlockScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <PlaceholderScreen
      eyebrow="Unlock"
      title="Relationship unlocks should feel entitlement-based."
      body="This screen will use relationship-first purchase language: unlock this relationship, unlock your romantic profile, and optionally unlock deeper Ask Stellium access."
      primaryLabel="Enter Home Shell"
      secondaryLabel="Back To Preview"
      onPrimaryPress={() => navigation.navigate('Main')}
      onSecondaryPress={() => navigation.goBack()}
    />
  );
};
