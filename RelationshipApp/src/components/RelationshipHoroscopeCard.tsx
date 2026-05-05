import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RelationshipRootParamList } from '../navigation/RootNavigator';
import { useTheme } from '../theme';
import { relationshipHoroscopesApi, type RelationshipHoroscopeDocument } from '../api';
import type { UserCompositeChart } from '../../../shared/api/relationships';
import {
  composeHoroscopeHeadline,
  splitInterpretationParagraphs,
} from '../utils/horoscopeFormat';
import { getInitials, getRelationshipArchetypeLabel } from '../utils/mainShell';
import { AvatarPair } from './AvatarPair';

interface RelationshipHoroscopeCardProps {
  relationship: UserCompositeChart;
  selfProfileId: string | null;
  onPress?: () => void;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface PartySides {
  selfName: string;
  selfInitial: string;
  selfPhotoUri: string | null;
  partnerName: string;
  partnerInitial: string;
  partnerPhotoUri: string | null;
}

function resolveSides(
  relationship: UserCompositeChart,
  selfProfileId: string | null
): PartySides {
  const selfIsA = Boolean(selfProfileId) && relationship.userA_id === selfProfileId;
  const selfName = selfIsA ? relationship.userA_name : relationship.userB_name;
  const partnerName = selfIsA ? relationship.userB_name : relationship.userA_name;
  const selfPhoto = selfIsA
    ? relationship.userA_profilePhotoUrl ?? relationship.userA_photoUrl
    : relationship.userB_profilePhotoUrl ?? relationship.userB_photoUrl;
  const partnerPhoto = selfIsA
    ? relationship.userB_profilePhotoUrl ?? relationship.userB_photoUrl
    : relationship.userA_profilePhotoUrl ?? relationship.userA_photoUrl;
  return {
    selfName: selfName ?? 'You',
    selfInitial: getInitials(selfName ?? 'You') || 'Y',
    selfPhotoUri: selfPhoto ?? null,
    partnerName: partnerName ?? 'Partner',
    partnerInitial: getInitials(partnerName ?? 'P') || 'P',
    partnerPhotoUri: partnerPhoto ?? null,
  };
}

type Navigation = StackNavigationProp<
  RelationshipRootParamList,
  'WeeklyRelationshipHoroscopeDetail'
>;

export function RelationshipHoroscopeCard({
  relationship,
  selfProfileId,
  onPress,
}: RelationshipHoroscopeCardProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<Navigation>();
  const [horoscope, setHoroscope] = useState<RelationshipHoroscopeDocument | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const compositeChartId = relationship._id;

  const load = useCallback(async () => {
    if (!compositeChartId) return;
    setState('loading');
    setError(null);
    try {
      const result = await relationshipHoroscopesApi.ensureCurrentRelationshipUnified(
        compositeChartId,
        'weekly'
      );
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log(
          '[RelationshipHoroscopeCard] unified horoscope FULL RESPONSE\n' +
            JSON.stringify(result, null, 2)
        );
      }
      setHoroscope(result);
      setState('ready');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load horoscope';
      setError(message);
      setState('error');
    }
  }, [compositeChartId]);

  useEffect(() => {
    load();
  }, [load]);

  const sides = resolveSides(relationship, selfProfileId);
  const archetype = getRelationshipArchetypeLabel(relationship);
  const pairLabel = `You & ${sides.partnerName}`;

  const headline = horoscope
    ? composeHoroscopeHeadline(horoscope.analysis?.keyThemes, '')
    : '';
  const paragraphs = splitInterpretationParagraphs(horoscope?.interpretation);
  const previewParagraph = paragraphs[0] ?? null;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
      ]}
    >
      <View style={styles.headerRow}>
        <AvatarPair
          leftPhotoUri={sides.selfPhotoUri}
          leftInitial={sides.selfInitial}
          rightPhotoUri={sides.partnerPhotoUri}
          rightInitial={sides.partnerInitial}
          leftGradient="lavender"
          rightGradient="green"
          size={32}
          ringColor={colors.surface}
        />
        <View style={styles.headerCopy}>
          <Text style={[styles.pairLabel, { color: colors.text }]}>{pairLabel}</Text>
          <Text style={[styles.archetype, { color: colors.accent }]}>{archetype}</Text>
        </View>
      </View>

      {state === 'loading' && !horoscope ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Reading this week's transits…
          </Text>
        </View>
      ) : null}

      {state === 'error' ? (
        <View style={styles.errorBlock}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error ?? 'Could not load this week.'}
          </Text>
          <TouchableOpacity onPress={load} accessibilityRole="button">
            <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {horoscope ? (
        <>
          {headline ? (
            <Text style={[styles.headline, { color: colors.text }]}>{headline}.</Text>
          ) : null}

          {previewParagraph ? (
            <View style={styles.bodyBlock}>
              <Text
                style={[styles.body, { color: colors.textMuted }]}
                numberOfLines={4}
                ellipsizeMode="tail"
              >
                {previewParagraph}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={(event) => {
              event.stopPropagation();
              navigation.navigate('WeeklyRelationshipHoroscopeDetail', {
                compositeChartId,
              });
            }}
            accessibilityRole="button"
            accessibilityLabel="Read full horoscope"
          >
            <Text style={[styles.expandToggle, { color: colors.primary }]}>
              Read full horoscope →
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  pairLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  archetype: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  headline: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  bodyBlock: {
    gap: 8,
  },
  body: {
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  expandToggle: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
  },
  errorBlock: {
    gap: 4,
  },
  errorText: {
    fontSize: 12,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
