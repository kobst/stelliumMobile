import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RelationshipsScreen from '../screens/relationships/RelationshipsScreen';
import RelationshipAnalysisScreen from '../screens/relationships/RelationshipAnalysisScreen';
import CategoryDetailScreen from '../screens/relationships/CategoryDetailScreen';
import CreateRelationshipScreen from '../screens/relationships/CreateRelationshipScreen';
import { useTheme } from '../theme';
import { UserCompositeChart, ClusterMetrics, ClusterAnalysis, ClusterScoredItem } from '../api/relationships';

export type RelationshipsStackParamList = {
  RelationshipsMain: undefined;
  RelationshipAnalysis: {
    relationship: UserCompositeChart;
  };
  CategoryDetail: {
    categoryName: string;
    categoryData: ClusterMetrics;
    analysisData: ClusterAnalysis & { keyAspects?: any };
    color: string;
    icon: string;
    relationshipId: string;
    userAName: string;
    userBName: string;
    consolidatedItems: ClusterScoredItem[];
  };
  CreateRelationship: undefined;
};

const Stack = createStackNavigator<RelationshipsStackParamList>();

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
        name="CategoryDetail"
        component={CategoryDetailScreen}
        options={({ route }) => ({
          title: route.params.categoryName,
          headerBackTitle: 'Back',
        })}
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
