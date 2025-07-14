import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import UserOnboardingScreen from '../screens/UserOnboardingScreen';
import { useStore } from '../store';

const Stack = createStackNavigator();

const RootNavigator: React.FC = () => {
  const { userData } = useStore();
  const profileComplete = Boolean(
    userData && userData.birthLocation && userData.timezone,
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {profileComplete ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Onboarding" component={UserOnboardingScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;