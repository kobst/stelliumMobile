import React from 'react';
import auth from '@react-native-firebase/auth';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';

type Props = StackScreenProps<RelationshipRootParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const authStatus = useRelationshipAppStore((state) => state.authStatus);
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handlePrimaryPress = async () => {
    if (authStatus === 'signedIn') {
      navigation.navigate('CreateSelfProfile');
      return;
    }

    try {
      setIsSigningIn(true);
      setErrorMessage(null);
      await auth().signInAnonymously();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Anonymous Firebase auth is not available yet for this project.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <PlaceholderScreen
      eyebrow="Relationship App"
      title="Understand your chemistry before you decode the stars."
      body={
        errorMessage
          ? `This app leads with compatibility, attraction, communication, and conflict patterns. Astrology powers the engine, but the visible experience stays centered on relationships.\n\nSession setup failed: ${errorMessage}`
          : 'This app leads with compatibility, attraction, communication, and conflict patterns. Astrology powers the engine, but the visible experience stays centered on relationships.\n\nFor now, this wireframe can start with a temporary Firebase session so we can exercise the real backend flows before the final sign-in UX is designed.'
      }
      primaryLabel={
        isSigningIn
          ? 'Starting Session...'
          : authStatus === 'signedIn'
            ? 'Create Your Profile'
            : 'Start Temporary Session'
      }
      secondaryLabel="Skip To Home Shell"
      onPrimaryPress={handlePrimaryPress}
      onSecondaryPress={() => navigation.navigate('Main')}
    />
  );
};
