import React from 'react';
import auth from '@react-native-firebase/auth';
import { StackScreenProps } from '@react-navigation/stack';
import { PlaceholderScreen } from '../components/PlaceholderScreen';
import { relationshipAppEnv } from '../config/env';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';

type Props = StackScreenProps<RelationshipRootParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const authStatus = useRelationshipAppStore((state) => state.authStatus);
  const setAuthState = useRelationshipAppStore((state) => state.setAuthState);
  const setBootstrapState = useRelationshipAppStore((state) => state.setBootstrapState);
  const setLocalUxMode = useRelationshipAppStore((state) => state.setLocalUxMode);
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handlePrimaryPress = async () => {
    if (authStatus === 'signedIn') {
      navigation.navigate('CreateSelfProfile');
      return;
    }

    if (relationshipAppEnv.enableLocalUxMode) {
      setLocalUxMode(true);
      setAuthState({
        authStatus: 'signedIn',
        firebaseUid: 'local-demo-user',
        firebaseEmail: null,
      });
      setBootstrapState({ bootstrapStatus: 'ready', bootstrapError: null });
      setErrorMessage(null);
      navigation.reset({
        index: 0,
        routes: [{ name: 'CreateSelfProfile' }],
      });
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
      title="Understand your chemistry before you invest your heart."
      body={
        errorMessage
          ? `Start with your own profile, then explore attraction, communication, conflict patterns, and long-term compatibility in one focused relationship experience.\n\nWe couldn't start your session: ${errorMessage}`
          : 'Start with your own profile, then explore attraction, communication, conflict patterns, and long-term compatibility in one focused relationship experience.'
      }
      primaryLabel={
        isSigningIn
          ? 'Getting Started...'
          : authStatus === 'signedIn'
            ? 'Continue'
            : 'Get Started'
      }
      secondaryLabel="Preview The App"
      onPrimaryPress={handlePrimaryPress}
      onSecondaryPress={() => navigation.navigate('Main')}
    />
  );
};
