import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { Avatar } from './Avatar';
import { AvatarPair } from './AvatarPair';
import { Halo } from './atmosphere/Halo';
import type { MiniRadarScores } from './MiniRadar';
import { StrengthRing } from './strength/StrengthRing';
import { DetailArchetypeLabel } from './strength/DetailArchetypeLabel';
import { CompositeChip } from './strength/CompositeChip';
import { scoreColor } from './strength/heat';
import { strengthOf, type PillarScores } from './strength/strengthModel';
import type { CompositeCharacter, DetailArchetype } from '../../../shared/api/relationships';

export type RelationshipKind = 'celeb' | 'person';

const SCORE_ORDER: { key: keyof MiniRadarScores; label: string }[] = [
  { key: 'Harmony', label: 'HAR' },
  { key: 'Passion', label: 'PAS' },
  { key: 'Connection', label: 'CON' },
  { key: 'Stability', label: 'STA' },
  { key: 'Growth', label: 'GRO' },
];

const LOW_THRESHOLD = 45;

interface SinglePartner {
  name: string;
  initial?: string | null;
  photoUri?: string | null;
  kind: RelationshipKind;
}

interface PairPartners {
  left: { initial?: string | null; photoUri?: string | null };
  right: { initial?: string | null; photoUri?: string | null };
  pairLabel: string;
}

interface RelationshipCardCommon {
  // Cluster archetype label — used as the graceful fallback headline when no
  // detail archetype is present (rows whose payload predates the contract).
  archetype?: string | null;
  // Detail-tier archetype (preferred headline + family glyph) when available.
  detailArchetype?: DetailArchetype | null;
  // Composite "character" entity coordinate, when available.
  composite?: CompositeCharacter | null;
  // Backend-authoritative strength score; falls back to the mean of `scores`.
  strengthScore?: number | null;
  scores?: MiniRadarScores | null;
  onPress: () => void;
}

type RelationshipCardProps = RelationshipCardCommon &
  (({ mode: 'single' } & SinglePartner) | ({ mode: 'pair' } & PairPartners));

export function RelationshipCard(props: RelationshipCardProps) {
  const { colors } = useTheme();
  const { archetype, detailArchetype, composite, strengthScore, scores, onPress, mode } = props;
  const hasScores = Boolean(scores);

  const displayName = mode === 'single' ? props.name : props.pairLabel;
  const isLowSignal =
    hasScores && scores
      ? Object.values(scores).every((value) => (value ?? 0) < LOW_THRESHOLD)
      : false;

  const resolvedStrength =
    typeof strengthScore === 'number'
      ? Math.round(Math.max(0, Math.min(100, strengthScore)))
      : scores
      ? strengthOf(scores as PillarScores)
      : null;

  const showHeadline = hasScores && (detailArchetype || archetype);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surfaceLow }]}
    >
      <Halo
        color={isLowSignal ? '#E8856B' : colors.primary}
        size={180}
        opacity={isLowSignal ? 0.18 : 0.16}
        top={-70}
        right={-50}
      />
      <View style={styles.topRow}>
        {mode === 'single' ? (
          <Avatar
            size={52}
            gradient={props.kind === 'celeb' ? 'gold' : 'green'}
            fallbackInitial={props.initial}
            photoUri={props.photoUri}
          />
        ) : (
          <AvatarPair
            leftPhotoUri={props.left.photoUri}
            leftInitial={props.left.initial}
            leftGradient="gold"
            rightPhotoUri={props.right.photoUri}
            rightInitial={props.right.initial}
            rightGradient="gold"
            size={42}
          />
        )}

        <View style={styles.headerCopy}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          {showHeadline ? (
            <View style={styles.headlineRow}>
              <DetailArchetypeLabel detail={detailArchetype} fallbackLabel={archetype} size="sm" />
            </View>
          ) : !hasScores ? (
            <Text style={[styles.statusLine, { color: colors.textSubtle }]}>Analyzing…</Text>
          ) : null}
        </View>

        {hasScores && resolvedStrength !== null ? (
          <View style={styles.strengthColumn}>
            <StrengthRing score={resolvedStrength} size={56} stroke={5} />
            <Text style={[styles.strengthCaption, { color: 'rgba(202, 190, 255, 0.55)' }]}>
              STRENGTH
            </Text>
          </View>
        ) : null}
      </View>

      {composite ? (
        <View style={styles.compositeRow}>
          <CompositeChip composite={composite} />
        </View>
      ) : null}

      {hasScores && scores ? (
        <View style={styles.scoreStrip}>
          {SCORE_ORDER.map((item) => {
            const raw = scores[item.key] ?? 0;
            const value = Math.round(Math.max(0, Math.min(100, raw)));
            const cellBg = isLowSignal
              ? 'rgba(232, 155, 124, 0.06)'
              : 'rgba(202, 190, 255, 0.06)';
            return (
              <View key={item.key} style={[styles.scoreCell, { backgroundColor: cellBg }]}>
                <Text style={[styles.scoreValue, { color: scoreColor(value) }]}>{value}</Text>
                <Text style={[styles.scoreLabel, { color: colors.textSubtle }]}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  name: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  headlineRow: {
    flexDirection: 'row',
  },
  statusLine: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  strengthColumn: {
    alignItems: 'center',
    gap: 4,
  },
  strengthCaption: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  compositeRow: {
    flexDirection: 'row',
  },
  scoreStrip: {
    flexDirection: 'row',
    gap: 6,
  },
  scoreCell: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 2,
    gap: 6,
  },
  scoreValue: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: -0.4,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
});
