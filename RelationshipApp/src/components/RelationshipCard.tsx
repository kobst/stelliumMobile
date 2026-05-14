import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import { Avatar } from './Avatar';
import { AvatarPair } from './AvatarPair';
import { Halo } from './atmosphere/Halo';
import type { MiniRadarScores } from './MiniRadar';
import { ShapeBadge } from './shape/ShapeBadge';
import { ModifierChipRow } from './shape/ModifierChipRow';
import type { ModifierKey } from './shape/modifierTokens';
import type { ShapeKind } from './shape/shapeTokens';

export type RelationshipKind = 'celeb' | 'person';

const SCORE_ORDER: { key: keyof MiniRadarScores; label: string }[] = [
  { key: 'Harmony', label: 'HAR' },
  { key: 'Passion', label: 'PAS' },
  { key: 'Connection', label: 'CON' },
  { key: 'Stability', label: 'STA' },
  { key: 'Growth', label: 'GRO' },
];

const HIGH_THRESHOLD = 75;
const LOW_THRESHOLD = 45;
const COLOR_LOW = '#E8856B';

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

type RelationshipCardProps = {
  archetype?: string | null;
  scores?: MiniRadarScores | null;
  shapeKind?: ShapeKind | string | null;
  modifiers?: readonly (ModifierKey | string)[] | null;
  onPress: () => void;
} & (
  | ({ mode: 'single' } & SinglePartner)
  | ({ mode: 'pair' } & PairPartners)
);

export function RelationshipCard(props: RelationshipCardProps) {
  const { colors } = useTheme();
  const { archetype, scores, shapeKind, modifiers, onPress, mode } = props;
  const hasScores = Boolean(scores);

  const displayName = mode === 'single' ? props.name : props.pairLabel;
  const isLowSignal = hasScores && scores
    ? Object.values(scores).every((value) => (value ?? 0) < LOW_THRESHOLD)
    : false;

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
            size={48}
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
            size={40}
          />
        )}

        <View style={styles.headerCopy}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          {hasScores && archetype ? (
            <Text
              style={[styles.archetype, { color: colors.accent }]}
              numberOfLines={1}
            >
              {archetype}
            </Text>
          ) : !hasScores ? (
            <Text style={[styles.statusLine, { color: colors.textSubtle }]}>
              Analyzing…
            </Text>
          ) : null}
        </View>

        {hasScores && shapeKind ? (
          <View style={styles.shapeColumn}>
            <ShapeBadge kind={shapeKind} />
          </View>
        ) : null}
      </View>

      {hasScores && modifiers && modifiers.length > 0 ? (
        <ModifierChipRow modifiers={modifiers} max={2} />
      ) : null}

      {hasScores && scores ? (
        <View style={styles.scoreStrip}>
          {SCORE_ORDER.map((item) => {
            const raw = scores[item.key] ?? 0;
            const value = Math.round(Math.max(0, Math.min(100, raw)));
            const isHigh = value >= HIGH_THRESHOLD;
            const isLow = value < LOW_THRESHOLD;
            const valueColor = isHigh
              ? colors.accent
              : isLow
              ? COLOR_LOW
              : colors.text;
            const cellBg = isHigh
              ? 'rgba(202, 190, 255, 0.06)'
              : isLow
              ? 'rgba(232, 133, 107, 0.06)'
              : 'rgba(255, 255, 255, 0.025)';
            return (
              <View key={item.key} style={[styles.scoreCell, { backgroundColor: cellBg }]}>
                <Text style={[styles.scoreValue, { color: valueColor }]}>{value}</Text>
                <Text style={[styles.scoreLabel, { color: colors.textSubtle }]}>
                  {item.label}
                </Text>
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
    gap: 3,
  },
  name: {
    fontFamily: SERIF_FONT,
    fontSize: 21,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  statusLine: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  archetype: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  shapeColumn: {
    alignItems: 'center',
    gap: 4,
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
