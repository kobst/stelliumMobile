import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChartSelectionScreen from '../screens/chart/ChartSelectionScreen';
import ChartScreen from '../screens/chart/ChartScreen';
import GuestOnboardingScreen from '../screens/chart/GuestOnboardingScreen';

const Stack = createStackNavigator();

const ChartStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1f2937',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ChartSelection" 
        component={ChartSelectionScreen}
        options={{ title: 'Birth Charts' }}
      />
      <Stack.Screen 
        name="ChartMain" 
        component={ChartScreen}
        options={{ title: 'Birth Chart' }}
      />
      <Stack.Screen 
        name="GuestOnboarding" 
        component={GuestOnboardingScreen}
        options={{ title: 'Add Birth Chart' }}
      />
    </Stack.Navigator>
  );
};

export default ChartStack;