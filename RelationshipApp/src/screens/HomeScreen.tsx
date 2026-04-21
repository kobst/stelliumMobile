import React from 'react';
import {
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
import { MainTabParamList } from '../navigation/MainTabs';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { getBigThreeSummary } from '../utils/mainShell';
import { TopCelebMatchesRail } from '../components/TopCelebMatchesRail';

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

  const article = getWeeklyArticle(profile?.firstName, getBigThreeSummary(profile));

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

        <TopCelebMatchesRail
          title="Your Chart in the Wild"
          subtitle="Celeb overlaps from your saved relationship-app profile."
          matches={(profile?.topCelebMatches ?? []).slice(0, 5)}
        />
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
