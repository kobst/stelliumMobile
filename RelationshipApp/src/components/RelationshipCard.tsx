import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { Avatar } from './Avatar';
import { AvatarPair } from './AvatarPair';
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

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
      ]}
    >
      <View style={styles.topRow}>
        {mode === 'single' ? (
          <Avatar
            size={44}
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
            size={36}
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
          <ShapeBadge kind={shapeKind} />
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
              ? colors.primary
              : isLow
              ? COLOR_LOW
              : colors.text;
            const cellBg = isHigh
              ? 'rgba(202, 190, 255, 0.10)'
              : isLow
              ? 'rgba(232, 133, 107, 0.10)'
              : 'rgba(255, 255, 255, 0.03)';
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
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusLine: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  archetype: {
    fontSize: 14.5,
    fontStyle: 'italic',
    fontWeight: '600',
    fontFamily: 'Georgia',
  },
  scoreStrip: {
    flexDirection: 'row',
    gap: 4,
  },
  scoreCell: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 2,
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  scoreLabel: {
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
