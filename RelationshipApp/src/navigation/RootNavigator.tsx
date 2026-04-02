import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { CreateSelfProfileScreen } from '../screens/CreateSelfProfileScreen';
import { ChooseTargetTypeScreen } from '../screens/ChooseTargetTypeScreen';
import { CreatePartnerScreen } from '../screens/CreatePartnerScreen';
import { SelectCelebrityScreen } from '../screens/SelectCelebrityScreen';
import { RelationshipPreviewScreen } from '../screens/RelationshipPreviewScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { MainTabs } from './MainTabs';
import { BootstrapStatusScreen } from '../screens/BootstrapStatusScreen';
import { useRelationshipAppStore } from '../store';

export type RelationshipRootParamList = {
  Welcome: undefined;
  CreateSelfProfile: undefined;
  ChooseTargetType: undefined;
  CreatePartner: undefined;
  SelectCelebrity: undefined;
  RelationshipPreview: undefined;
  Unlock: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RelationshipRootParamList>();

export const RootNavigator: React.FC = () => {
  const authStatus = useRelationshipAppStore((state) => state.authStatus);
  const bootstrapStatus = useRelationshipAppStore((state) => state.bootstrapStatus);
  const bootstrapError = useRelationshipAppStore((state) => state.bootstrapError);
  const hasCompletedSelfProfile = useRelationshipAppStore(
    (state) => state.hasCompletedSelfProfile
  );

  if (bootstrapStatus === 'loading' || authStatus === 'booting') {
    return (
      <BootstrapStatusScreen
        title="Connecting your relationship account."
        body="Checking Firebase session state and loading the relationship-app profile if one already exists."
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

  const initialRouteName = hasCompletedSelfProfile
    ? 'Main'
    : authStatus === 'signedIn'
      ? 'CreateSelfProfile'
      : 'Welcome';

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
        <Stack.Screen name="ChooseTargetType" component={ChooseTargetTypeScreen} />
        <Stack.Screen name="CreatePartner" component={CreatePartnerScreen} />
        <Stack.Screen name="SelectCelebrity" component={SelectCelebrityScreen} />
        <Stack.Screen name="RelationshipPreview" component={RelationshipPreviewScreen} />
        <Stack.Screen name="Unlock" component={UnlockScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
