import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CelebrityScreen from '../screens/celebrity/CelebrityScreen';

const Stack = createStackNavigator();

const CelebrityStack: React.FC = () => {
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
        name="CelebrityMain" 
        component={CelebrityScreen}
        options={{ title: 'Celebrity Charts' }}
      />
    </Stack.Navigator>
  );
};

export default CelebrityStack;