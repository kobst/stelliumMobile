import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChartSelectionScreen from '../screens/chart/ChartSelectionScreen';
import ChartScreen from '../screens/chart/ChartScreen';
import GuestOnboardingScreen from '../screens/chart/GuestOnboardingScreen';
import CelebrityDetailScreen from '../screens/celebrity/CelebrityDetailScreen';
import RelationshipAnalysisScreen from '../screens/relationships/RelationshipAnalysisScreen';
import ChartCategoryDetailScreen from '../screens/chart/ChartCategoryDetailScreen';
import { useTheme } from '../theme';
import { BirthChart } from '../types';

export type ChartStackParamList = {
  ChartSelection: undefined;
  ChartMain: { subject: any };
  GuestOnboarding: { onGuestCreated?: () => void };
  CelebrityDetail: { celebrityId: string };
  CelebrityRelationshipAnalysis: { relationship: any };
  ChartCategoryDetail: {
    categoryKey: string;
    categoryName: string;
    categoryData: any;
    birthChart: BirthChart;
    icon: string;
  };
};

const Stack = createStackNavigator<ChartStackParamList>();

const ChartStack: React.FC = () => {
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
      <Stack.Screen
        name="ChartCategoryDetail"
        component={ChartCategoryDetailScreen}
        options={({ route }) => ({
          title: route.params.categoryName,
        })}
      />
    </Stack.Navigator>
  );
};

export default ChartStack;
