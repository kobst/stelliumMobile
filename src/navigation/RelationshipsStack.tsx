import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RelationshipsScreen from '../screens/relationships/RelationshipsScreen';
import RelationshipAnalysisScreen from '../screens/relationships/RelationshipAnalysisScreen';

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
      <Stack.Screen 
        name="RelationshipAnalysis" 
        component={RelationshipAnalysisScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default RelationshipsStack;