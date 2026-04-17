import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { AvatarPair } from './AvatarPair';

export type RelationshipKind = 'celeb' | 'person';
export type RelationshipTier = 'blurb' | 'overview' | 'full';

interface RelationshipCardProps {
  userInitial: string;
  kind: RelationshipKind;
  name: string;
  archetype: string | null;
  aspect: string | null;
  tier: RelationshipTier;
  otherInitial?: string | null;
  otherPhotoUri?: string | null;
  onPress: () => void;
}

const TIER_COPY: Record<RelationshipTier, { label: string; glyph: string }> = {
  blurb: { label: 'Blurb', glyph: '·' },
  overview: { label: 'Overview', glyph: '✦' },
  full: { label: 'Full', glyph: '◆' },
};

export function RelationshipCard({
  userInitial,
  kind,
  name,
  archetype,
  aspect,
  tier,
  otherInitial,
  otherPhotoUri,
  onPress,
}: RelationshipCardProps) {
  const { colors } = useTheme();
  const tierCopy = TIER_COPY[tier];
  const tierStyle = resolveTierStyle(tier, colors);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
      ]}
    >
      <AvatarPair
        userInitial={userInitial}
        otherInitial={otherInitial}
        otherPhotoUri={otherPhotoUri}
        otherGradient={kind === 'celeb' ? 'gold' : 'green'}
        size={38}
      />

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, { color: colors.text }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <View
            style={[
              styles.typePill,
              {
                backgroundColor: colors.surfaceHigh,
                borderColor: colors.ghostBorder,
              },
            ]}
          >
            <Text style={[styles.typePillText, { color: colors.textSubtle }]}>
              {kind === 'celeb' ? 'Celeb' : 'Personal'}
            </Text>
          </View>
        </View>
        {archetype ? (
          <Text style={[styles.archetype, { color: colors.accent }]} numberOfLines={1}>
            {archetype}
          </Text>
        ) : null}
        {aspect ? (
          <Text style={[styles.aspect, { color: colors.textMuted }]} numberOfLines={1}>
            {aspect}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.tierPill,
          {
            backgroundColor: tierStyle.bg,
            borderColor: tierStyle.border,
          },
        ]}
      >
        <Text style={[styles.tierGlyph, { color: tierStyle.fg }]}>{tierCopy.glyph}</Text>
        <Text style={[styles.tierLabel, { color: tierStyle.fg }]}>{tierCopy.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function resolveTierStyle(
  tier: RelationshipTier,
  colors: ReturnType<typeof useTheme>['colors']
): { bg: string; border: string; fg: string } {
  if (tier === 'full') {
    return {
      bg: 'rgba(233, 195, 73, 0.15)',
      border: 'rgba(233, 195, 73, 0.25)',
      fg: colors.accent,
    };
  }
  if (tier === 'overview') {
    return {
      bg: 'rgba(202, 190, 255, 0.14)',
      border: 'rgba(202, 190, 255, 0.22)',
      fg: colors.primary,
    };
  }
  return {
    bg: colors.surfaceHigh,
    border: colors.ghostBorder,
    fg: colors.textSubtle,
  };
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  typePill: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  archetype: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  aspect: {
    fontSize: 12,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  tierGlyph: {
    fontSize: 11,
  },
  tierLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
