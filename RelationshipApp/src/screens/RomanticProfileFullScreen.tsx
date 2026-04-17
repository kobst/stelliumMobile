import React, { useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useRelationshipAppStore } from '../store';
import { useTheme } from '../theme';
import { getBigThree } from '../utils/mainShell';
import { getRomanticPlacements } from '../utils/placements';
import { PlacementRow } from '../components/PlacementRow';
import { AskIrisCard } from '../components/AskIrisCard';

const PROFILE_THREAD_KEY = 'profile' as const;

const PLACEMENT_ASK_COPY = {
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

  const big = useMemo(() => getBigThree(profile), [profile]);
  const placements = useMemo(() => getRomanticPlacements(profile), [profile]);

  const summaryText =
    overview ??
    profile?.romanticOverview ??
    profile?.romanticProfileBlurb ??
    'Your romantic reading will appear here once your chart has finished processing.';

  const chips = [
    big.sun ? `${big.sun} Sun` : null,
    big.moon ? `${big.moon} Moon` : null,
    big.rising ? `${big.rising} Rising` : null,
  ].filter((value): value is string => typeof value === 'string');

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
        prefill,
      });
    },
    [navigation]
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backLink}
        >
          <Text style={[styles.backText, { color: colors.textMuted }]}>← Profile</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Your Romantic Profile</Text>
          <Text style={[styles.title, { color: colors.text }]}>Celestial Blueprint</Text>
          {chips.length > 0 ? (
            <View style={styles.chipRow}>
              {chips.map((chip) => (
                <View
                  key={chip}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: colors.surfaceHigh,
                      borderColor: colors.ghostBorder,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.textMuted }]}>{chip}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <Text style={[styles.summary, { color: colors.text }]}>{summaryText}</Text>

        <View style={[styles.divider, { backgroundColor: colors.ghostBorder }]} />

        <View style={styles.placementsHeader}>
          <Text style={[styles.sectionLabel, { color: colors.accent }]}>
            Your Romantic Placements
          </Text>
          <Text style={[styles.placementsSub, { color: colors.textMuted }]}>
            The planets that shape how you love, desire, and connect.
          </Text>
        </View>

        <View style={styles.placementsList}>
          {placements.map((placement) => (
            <PlacementRow key={placement.key} placement={placement} />
          ))}
        </View>

        <AskIrisCard
          copy={PLACEMENT_ASK_COPY}
          lastUserMessage={lastUser}
          lastIrisMessage={lastIris}
          onPressInput={openAsk}
          onPressContinue={() => openAsk()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 18,
  },
  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    gap: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summary: {
    fontSize: 18,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  placementsHeader: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  placementsSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  placementsList: {
    gap: 10,
  },
});
