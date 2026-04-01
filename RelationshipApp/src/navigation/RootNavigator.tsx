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
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
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
