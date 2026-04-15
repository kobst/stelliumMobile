import React from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { RelationshipRootParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RelationshipRootParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <PlaceholderScreen
      eyebrow="Relationship App"
      title="Understand your chemistry before you invest your heart."
      body="Start with your own profile, then explore attraction, communication, conflict patterns, and long-term compatibility in one focused relationship experience."
      primaryLabel="Get Started"
      secondaryLabel="Sign In"
      onPrimaryPress={() => navigation.navigate('CreateSelfProfile')}
      onSecondaryPress={() => navigation.navigate('SignIn')}
    />
  );
};
