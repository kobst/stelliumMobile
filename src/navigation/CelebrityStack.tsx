import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CelebrityScreen from '../screens/celebrity/CelebrityScreen';
import CelebrityDetailScreen from '../screens/celebrity/CelebrityDetailScreen';
import RelationshipAnalysisScreen from '../screens/relationships/RelationshipAnalysisScreen';
import { useTheme } from '../theme';

const Stack = createStackNavigator();

const CelebrityStack: React.FC = () => {
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
        name="CelebrityMain"
        component={CelebrityScreen}
        options={{ title: 'Celebrity Charts', headerShown: false }}
      />
      <Stack.Screen
        name="CelebrityDetail"
        component={CelebrityDetailScreen}
        options={{
          title: 'Celebrity Birth Charts',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="CelebrityRelationshipAnalysis"
        component={RelationshipAnalysisScreen}
        options={{
          title: 'Celebrity Relationship Analysis',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default CelebrityStack;
