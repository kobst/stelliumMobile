import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RelationshipsScreen from '../screens/relationships/RelationshipsScreen';
import RelationshipAnalysisScreen from '../screens/relationships/RelationshipAnalysisScreen';
import CreateRelationshipScreen from '../screens/relationships/CreateRelationshipScreen';
import { useTheme } from '../theme';

const Stack = createStackNavigator();

const RelationshipsStack: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.onSurface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="RelationshipsMain"
        component={RelationshipsScreen}
        options={{ title: 'Relationships', headerShown: false }}
      />
      <Stack.Screen
        name="RelationshipAnalysis"
        component={RelationshipAnalysisScreen}
        options={{ title: 'Relationship Analysis' }}
      />
      <Stack.Screen
        name="CreateRelationship"
        component={CreateRelationshipScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default RelationshipsStack;
