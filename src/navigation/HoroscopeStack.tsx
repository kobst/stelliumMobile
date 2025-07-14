import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HoroscopeScreen from '../screens/horoscope/HoroscopeScreen';

const Stack = createStackNavigator();

const HoroscopeStack: React.FC = () => {
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
        name="HoroscopeMain" 
        component={HoroscopeScreen}
        options={{ title: 'Daily Horoscope' }}
      />
    </Stack.Navigator>
  );
};

export default HoroscopeStack;