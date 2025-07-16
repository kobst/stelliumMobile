import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import UserOnboardingScreen from '../screens/UserOnboardingScreen';
import { useStore } from '../store';

const Stack = createStackNavigator();

const RootNavigator: React.FC = () => {
  const { userData } = useStore();
  
  console.log('\n=== NAVIGATION CHECK ===');
  console.log('userData exists:', !!userData);
  if (userData) {
    console.log('userData.id:', userData.id);
    console.log('userData.birthChart exists:', !!userData.birthChart);
    console.log('Full userData keys:', Object.keys(userData));
  }
  
  const profileComplete = Boolean(
    userData && userData.id && userData.birthChart,
  );
  
  console.log('profileComplete:', profileComplete);
  console.log('Will show:', profileComplete ? 'Main' : 'Onboarding');
  console.log('====================\n');

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