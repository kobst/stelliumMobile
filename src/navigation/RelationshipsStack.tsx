import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RelationshipsScreen from '../screens/relationships/RelationshipsScreen';

const Stack = createStackNavigator();

const RelationshipsStack: React.FC = () => {
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
        name="RelationshipsMain" 
        component={RelationshipsScreen}
        options={{ title: 'Relationships' }}
      />
    </Stack.Navigator>
  );
};

export default RelationshipsStack;