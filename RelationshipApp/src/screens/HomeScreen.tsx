import React, { useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from '../navigation/MainTabs';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { useRelationshipHistory } from '../hooks/useRelationshipHistory';
import { useWeeklyArticle } from '../hooks/useWeeklyArticle';
import { CreditPill } from '../components/CreditPill';
import { SectionLabel } from '../components/SectionLabel';
import { SignsRow } from '../components/SignsRow';
import { TopCelebMatchesRail } from '../components/TopCelebMatchesRail';
import { PersonalHoroscopeCard } from '../components/PersonalHoroscopeCard';
import { WeeklyDispatchCard } from '../components/WeeklyDispatchCard';
import { ThisWeekTogetherSection } from '../components/ThisWeekTogetherSection';
import { QuickActionsRow, type QuickAction } from '../components/QuickActionsRow';
import { HomeAskIrisCard } from '../components/HomeAskIrisCard';
import { Stardust } from '../components/atmosphere/Stardust';
import { Halo } from '../components/atmosphere/Halo';
import { buildHistorySelectionState } from './historySelection';
import type { UserCompositeChart } from '../../../shared/api/relationships';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  StackNavigationProp<RelationshipRootParamList>
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigation>();
  const { colors } = useTheme();
  const profile = useRelationshipAppStore((state) => state.profile);
  const credits = useRelationshipAppStore((state) => state.credits);
  const relationshipHistory = useRelationshipAppStore((state) => state.relationshipHistory);
  const selfProfileId = useRelationshipAppStore((state) => state.selfProfileId);
  const setActiveRelationshipId = useRelationshipAppStore(
    (state) => state.setActiveRelationshipId
  );
  const setActivePartnerRomanticAssets = useRelationshipAppStore(
    (state) => state.setActivePartnerRomanticAssets
  );
  const setPreviewAnalysis = useRelationshipAppStore((state) => state.setPreviewAnalysis);
  const setFullAnalysis = useRelationshipAppStore((state) => state.setFullAnalysis);
  const setWorkflowState = useRelationshipAppStore((state) => state.setWorkflowState);

  useRelationshipHistory(true);
  const { article: weeklyArticle, state: weeklyArticleState } = useWeeklyArticle();

  const userId = profile?.id ?? null;

  const openRelationship = useCallback(
    (relationship: UserCompositeChart) => {
      const selectionState = buildHistorySelectionState(relationship);
      setActivePartnerRomanticAssets(null);
      setPreviewAnalysis(selectionState.previewAnalysis);
      setActiveRelationshipId(relationship._id);
      setFullAnalysis(selectionState.fullAnalysis);
      setWorkflowState({
        workflowStatus: null,
        workflowPhase: selectionState.workflowPhase,
        workflowError: null,
      });
      navigation.navigate('RelationshipPreview');
    },
    [
      navigation,
      setActivePartnerRomanticAssets,
      setActiveRelationshipId,
      setFullAnalysis,
      setPreviewAnalysis,
      setWorkflowState,
    ]
  );

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'add-someone',
        label: 'Add someone',
        icon: '+',
        tint: 'primary',
        onPress: () => navigation.navigate('AddConnection'),
      },
      {
        id: 'ask-iris',
        label: 'Ask Iris',
        icon: '✦',
        tint: 'tertiary',
      },
      {
        id: 'your-chart',
        label: 'Your chart',
        icon: '☉',
        tint: 'accent',
        onPress: () => navigation.navigate('RomanticProfileFull'),
      },
    ],
    [navigation]
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface }]}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Stardust density={70} seed={1} color={colors.primary} />
      </View>
      <Halo color={colors.primary} size={520} opacity={0.1} top={40} left="50%" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text style={[styles.brand, { color: colors.text }]}>Iris</Text>
          <CreditPill balance={credits?.balance ?? null} onPress={() => {}} />
        </View>

        <View style={styles.headerBlock}>
          <View pointerEvents="none">
            <Halo color={colors.primary} size={280} opacity={0.13} top={-90} left="35%" />
          </View>
          <SectionLabel>Home</SectionLabel>
          <Text style={[styles.title, { color: colors.text }]}>
            {profile?.firstName ? `Hi ${profile.firstName}.` : 'Hi.'}
          </Text>
          <SignsRow profile={profile} />
        </View>

        <PersonalHoroscopeCard userId={userId} />

        <WeeklyDispatchCard
          article={weeklyArticle}
          state={weeklyArticleState}
          onPress={() => navigation.navigate('WeeklyArticleDetail')}
        />

        <ThisWeekTogetherSection
          relationships={relationshipHistory}
          selfProfileId={selfProfileId}
          onPressCard={openRelationship}
        />

        <View style={styles.celebSection}>
          <SectionLabel>Your Chart in the Wild</SectionLabel>
          <Text style={[styles.celebSubtitle, { color: colors.textMuted }]}>
            Celebs whose charts resonate with yours this week
          </Text>
          <TopCelebMatchesRail
            title=""
            subtitle=""
            matches={(profile?.topCelebMatches ?? []).slice(0, 5)}
          />
        </View>

        <View style={styles.quickActionsBlock}>
          <SectionLabel>Quick Actions</SectionLabel>
          <QuickActionsRow actions={quickActions} />
        </View>

        <HomeAskIrisCard />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontFamily: SERIF_FONT,
    fontSize: 26,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  headerBlock: {
    gap: 10,
    position: 'relative',
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 42,
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  celebSection: {
    gap: 6,
  },
  celebSubtitle: {
    fontSize: 13,
    marginBottom: 6,
  },
  quickActionsBlock: {
    gap: 12,
  },
});
