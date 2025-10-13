import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChartSelectionScreen from '../screens/chart/ChartSelectionScreen';
import ChartScreen from '../screens/chart/ChartScreen';
import GuestOnboardingScreen from '../screens/chart/GuestOnboardingScreen';
import CelebrityDetailScreen from '../screens/celebrity/CelebrityDetailScreen';
import RelationshipAnalysisScreen from '../screens/relationships/RelationshipAnalysisScreen';
import { useTheme } from '../theme';

const Stack = createStackNavigator();

const ChartStack: React.FC = () => {
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
        name="ChartSelection"
        component={ChartSelectionScreen}
        options={{ title: 'Birth Charts', headerShown: false }}
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
      <Stack.Screen
        name="CelebrityDetail"
        component={CelebrityDetailScreen}
        options={{
          title: '',
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

export default ChartStack;
