import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChartScreen from '../screens/chart/ChartScreen';

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
        name="ChartMain" 
        component={ChartScreen}
        options={{ title: 'Birth Chart' }}
      />
    </Stack.Navigator>
  );
};

export default ChartStack;