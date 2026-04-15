import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { CreateSelfProfileScreen } from '../screens/CreateSelfProfileScreen';
import { ProfileRevealScreen } from '../screens/ProfileRevealScreen';
import { CreateAccountScreen } from '../screens/CreateAccountScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { FullRelationshipAnalysisScreen } from '../screens/FullRelationshipAnalysisScreen';
import { MainTabs } from './MainTabs';
import { BootstrapStatusScreen } from '../screens/BootstrapStatusScreen';
import { useRelationshipAppStore } from '../store';

export type RelationshipRootParamList = {
  Welcome: undefined;
  CreateSelfProfile: undefined;
  ProfileReveal: undefined;
  CreateAccount: undefined;
  SignIn: undefined;
  Unlock: undefined;
  FullRelationshipAnalysis: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RelationshipRootParamList>();

export const RootNavigator: React.FC = () => {
  const bootstrapStatus = useRelationshipAppStore((state) => state.bootstrapStatus);
  const bootstrapError = useRelationshipAppStore((state) => state.bootstrapError);
  const hasCompletedSelfProfile = useRelationshipAppStore(
    (state) => state.hasCompletedSelfProfile
  );
  const guestProfileDraft = useRelationshipAppStore((state) => state.guestProfileDraft);
  const profileReveal = useRelationshipAppStore((state) => state.profileReveal);

  if (bootstrapStatus === 'loading') {
    return (
      <BootstrapStatusScreen
        title="Setting things up."
        body="Loading your profile if one already exists."
        showSpinner
      />
    );
  }

  if (bootstrapStatus === 'error') {
    return (
      <BootstrapStatusScreen
        title="We couldn't load your account."
        body={bootstrapError ?? 'The relationship app could not finish bootstrapping.'}
      />
    );
  }

  let initialRouteName: keyof RelationshipRootParamList = 'Welcome';
  if (hasCompletedSelfProfile) {
    initialRouteName = 'Main';
  } else if (profileReveal && guestProfileDraft) {
    initialRouteName = 'ProfileReveal';
  } else if (guestProfileDraft) {
    initialRouteName = 'CreateSelfProfile';
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={initialRouteName}
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="CreateSelfProfile" component={CreateSelfProfileScreen} />
        <Stack.Screen name="ProfileReveal" component={ProfileRevealScreen} />
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="Unlock" component={UnlockScreen} />
        <Stack.Screen name="FullRelationshipAnalysis" component={FullRelationshipAnalysisScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
