import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HoroscopeScreen from '../screens/horoscope/HoroscopeScreen';
import TransitSelectionScreen from '../screens/horoscope/TransitSelectionScreen';
import CustomHoroscopeScreen from '../screens/horoscope/CustomHoroscopeScreen';
import { useTheme } from '../theme';

const Stack = createStackNavigator();

const HoroscopeStack: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: '',
        headerBackTitleVisible: false,
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
      }}
    >
      <Stack.Screen
        name="HoroscopeMain"
        component={HoroscopeScreen}
        options={{ title: 'Daily Horoscope', headerShown: false }}
      />
      <Stack.Screen
        name="TransitSelection"
        component={TransitSelectionScreen}
        options={{ title: 'Select Transits' }}
      />
      <Stack.Screen
        name="CustomHoroscope"
        component={CustomHoroscopeScreen}
        options={{ title: 'Custom Horoscope' }}
      />
    </Stack.Navigator>
  );
};

export default HoroscopeStack;
