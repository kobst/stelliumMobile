import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SERIF_FONT } from '../../theme/typography';
import type { DetailArchetype } from '../../../../shared/api/relationships';
import { FamilyGlyph } from './FamilyGlyph';
import { valenceOf } from './archetypeTokens';

interface DetailArchetypeLabelProps {
  // The detail-tier archetype (preferred headline). When absent or suppressed
  // (Mosaic), we fall back to `fallbackLabel` rendered in a neutral tone.
  detail?: DetailArchetype | null;
  // Legacy cluster archetype label, used when there is no usable detail name.
  fallbackLabel?: string | null;
  size?: 'lg' | 'sm';
}

const NEUTRAL_FG = '#C7C2DE';

/**
 * The detail-archetype headline: family glyph + valence-coloured italic name.
 * Graceful fallback — when no detail archetype is present (e.g. list rows whose
 * payload predates the contract), it renders the cluster archetype label in a
 * muted neutral tone with no glyph.
 */
export function DetailArchetypeLabel({ detail, fallbackLabel, size = 'lg' }: DetailArchetypeLabelProps) {
  const big = size === 'lg';
  const usableDetail = detail?.label && !detail.suppressed ? detail : null;
  const label = usableDetail?.label ?? fallbackLabel ?? null;
  if (!label) return null;

  const color = usableDetail ? valenceOf(usableDetail).fg : NEUTRAL_FG;

  return (
    <View style={[styles.row, { gap: big ? 11 : 8 }]}>
      {usableDetail ? (
        <FamilyGlyph route={usableDetail.route} color={color} size={big ? 24 : 18} />
      ) : null}
      <Text
        style={[
          styles.label,
          { fontSize: big ? 26 : 16, color },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  label: {
    fontFamily: SERIF_FONT,
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
});
