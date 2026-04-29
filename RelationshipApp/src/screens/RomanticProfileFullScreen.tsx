import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { getBigThree } from '../utils/mainShell';
import { getRomanticPlacements } from '../utils/placements';
import { AstrologicalProfileView } from '../components/AstrologicalProfileView';
import { SingleChartModal } from '../components/SingleChartModal';

const PROFILE_THREAD_KEY = 'profile' as const;

const ASK_COPY = {
  title: 'Want to go deeper?',
  subtitle: 'Ask Iris anything about your placements',
  inputPlaceholder: 'What does my 7th house Saturn mean?',
  suggestions: [
    'What does my 7th house Saturn mean?',
    'How does my Venus shape who I fall for?',
    'Why is my Mars in the 5th so loud?',
  ],
} as const;

export function RomanticProfileFullScreen() {
  const navigation = useNavigation<StackNavigationProp<RelationshipRootParamList>>();
  const { colors } = useTheme();

  const profile = useRelationshipAppStore((state) => state.profile);
  const overview = useRelationshipAppStore((state) => state.selfProfileOverview);
  const askThreads = useRelationshipAppStore((state) => state.askThreads);

  const [chartModalVisible, setChartModalVisible] = useState(false);

  const big = useMemo(() => getBigThree(profile), [profile]);
  const placements = useMemo(() => getRomanticPlacements(profile), [profile]);

  const summaryText =
    overview ??
    profile?.romanticOverview ??
    profile?.romanticProfileBlurb ??
    'Your romantic reading will appear here once your chart has finished processing.';

  const thread = useMemo(
    () => askThreads[PROFILE_THREAD_KEY] ?? [],
    [askThreads]
  );
  const lastUser = useMemo(
    () => [...thread].reverse().find((message) => message.role === 'user') ?? null,
    [thread]
  );
  const lastIris = useMemo(
    () => [...thread].reverse().find((message) => message.role === 'iris') ?? null,
    [thread]
  );

  const openAsk = useCallback(
    (prefill?: string) => {
      navigation.navigate('AskIris', {
        context: 'profile',
        threadKey: PROFILE_THREAD_KEY,
        prefill,
      });
    },
    [navigation]
  );

  const headerSlot = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.goBack()}
      style={styles.backLink}
    >
      <Text style={[styles.backText, { color: colors.textMuted }]}>← Profile</Text>
    </TouchableOpacity>
  );

  // birthChart lives on the SubjectDocument; profile.subject ?? profile keeps
  // the call shape uniform with how getRomanticPlacements resolves it.
  const chartSource = useMemo(() => {
    if (!profile) return null;
    const subject = (profile as unknown as { subject?: { birthChart?: unknown } }).subject;
    return subject ?? (profile as unknown as { birthChart?: unknown });
  }, [profile]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <View style={styles.container}>
        <AstrologicalProfileView
          variant="self"
          name={profile?.displayName ?? 'You'}
          sun={big.sun}
          moon={big.moon}
          rising={big.rising}
          source={chartSource}
          placements={placements}
          overview={summaryText}
          eyebrow="Your Romantic Profile"
          headerSlot={headerSlot}
          askCopy={ASK_COPY}
          lastUserMessage={lastUser}
          lastIrisMessage={lastIris}
          onPressAsk={openAsk}
          onPressViewFullChart={
            (chartSource as { birthChart?: unknown } | null)?.birthChart
              ? () => setChartModalVisible(true)
              : undefined
          }
        />
      </View>

      <SingleChartModal
        visible={chartModalVisible}
        onClose={() => setChartModalVisible(false)}
        subjectName={profile?.displayName ?? 'You'}
        birthChart={(chartSource as { birthChart?: unknown } | null)?.birthChart}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
