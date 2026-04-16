import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { celebritiesApi, Celebrity } from '../api';
import { MainTabParamList } from '../navigation/MainTabs';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import {
  celebrityToSubject,
  getBigThreeSummary,
  getCelebritySunSign,
} from '../utils/mainShell';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  StackNavigationProp<RelationshipRootParamList>
>;

function getWeeklyArticle(profileName: string | undefined, summary: string) {
  return {
    eyebrow: 'Weekly Dispatch',
    title: 'The aspect behind your mixed signals',
    body: profileName
      ? `${profileName}, ${summary} is the right lens for a weekly editorial module. This slot should rotate through one chart theme, one celebrity example, and one practical reason to open the app again.`
      : 'This slot should rotate through one chart theme, one celebrity example, and one practical reason to open the app again.',
  };
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigation>();
  const { colors } = useTheme();
  const profile = useRelationshipAppStore((state) => state.profile);
  const clearActiveRelationshipFlow = useRelationshipAppStore(
    (state) => state.clearActiveRelationshipFlow
  );
  const setActiveTargetType = useRelationshipAppStore((state) => state.setActiveTargetType);
  const setActiveTargetSubject = useRelationshipAppStore((state) => state.setActiveTargetSubject);
  const [trendingCelebs, setTrendingCelebs] = React.useState<Celebrity[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    const loadTrending = async () => {
      try {
        setIsTrendingLoading(true);
        const response = await celebritiesApi.getCelebrities({});
        if (!cancelled) {
          setTrendingCelebs(Array.isArray(response) ? response.slice(0, 8) : response.data.slice(0, 8));
        }
      } catch {
        if (!cancelled) {
          setTrendingCelebs([]);
        }
      } finally {
        if (!cancelled) {
          setIsTrendingLoading(false);
        }
      }
    };

    loadTrending().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const article = getWeeklyArticle(profile?.firstName, getBigThreeSummary(profile));

  const startCelebrityFlow = (celebrity?: Celebrity) => {
    clearActiveRelationshipFlow();
    setActiveTargetType('celebrity');
    setActiveTargetSubject(celebrity ? celebrityToSubject(celebrity) : null);
    navigation.navigate('SelectCelebrity');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={[styles.kicker, { color: colors.primary }]}>Home</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {profile ? `Hi ${profile.firstName}.` : 'Your feed is ready.'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {getBigThreeSummary(profile)}
          </Text>
        </View>

        <View style={[styles.articleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.articleEyebrow, { color: colors.accent }]}>{article.eyebrow}</Text>
          <Text style={[styles.articleTitle, { color: colors.text }]}>{article.title}</Text>
          <Text style={[styles.articleBody, { color: colors.textMuted }]}>{article.body}</Text>
          <View style={styles.articleActions}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('DiscoverTab')}
            >
              <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
                Explore This Theme
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Charts</Text>
              <Text style={[styles.sectionBody, { color: colors.textMuted }]}>
                A lightweight celeb browse strip pulled from the shared database.
              </Text>
            </View>
            <TouchableOpacity onPress={() => startCelebrityFlow()}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>Browse all</Text>
            </TouchableOpacity>
          </View>

          {isTrendingLoading ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.sectionBody, { color: colors.textMuted }]}>
                Loading celebrity charts...
              </Text>
            </View>
          ) : null}

          <View style={styles.trendingList}>
            {trendingCelebs.slice(0, 4).map((celebrity) => (
              <TouchableOpacity
                key={celebrity._id}
                style={[styles.trendingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => startCelebrityFlow(celebrity)}
              >
                <View style={styles.trendingHeader}>
                  <Text style={[styles.trendingName, { color: colors.text }]}>
                    {celebrity.firstName} {celebrity.lastName}
                  </Text>
                  <Text style={[styles.trendingAction, { color: colors.accent }]}>See your connection</Text>
                </View>
                <Text style={[styles.trendingMeta, { color: colors.textMuted }]}>
                  {getCelebritySunSign(celebrity) ?? 'Unknown sign'}
                </Text>
                <Text style={[styles.trendingMeta, { color: colors.textMuted }]} numberOfLines={2}>
                  {celebrity.placeOfBirth}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    gap: 18,
  },
  headerBlock: {
    gap: 8,
    paddingTop: 8,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  articleCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  articleEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  articleBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  articleActions: {
    gap: 10,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendingList: {
    gap: 10,
  },
  trendingCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  trendingHeader: {
    gap: 4,
  },
  trendingName: {
    fontSize: 17,
    fontWeight: '700',
  },
  trendingAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  trendingMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
