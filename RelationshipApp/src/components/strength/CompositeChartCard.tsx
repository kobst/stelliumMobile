import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { SERIF_FONT } from '../../theme/typography';
import { Halo } from '../atmosphere/Halo';
import type { CompositeCharacter } from '../../../../shared/api/relationships';
import { CompositeChip } from './CompositeChip';
import { ELEMENT_TINT } from './archetypeTokens';

interface CompositeChartCardProps {
  composite?: CompositeCharacter | null;
  // Plain-text composite summary; paragraphs separated by `\n\n` (no markdown).
  summary?: string | null;
}

const DEFAULT_TINT = '#cabeff';

function toParagraphs(summary: string | null | undefined): string[] {
  if (!summary) return [];
  return summary
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * The "Composite chart" card on the relationship Overview — the relationship read
 * as its own entity. Shows the composite-character chip + phrase, then the
 * multi-paragraph composite summary. Rendered only in the fully-unlocked state.
 */
export function CompositeChartCard({ composite, summary }: CompositeChartCardProps) {
  const { colors } = useTheme();
  const paragraphs = toParagraphs(summary);
  if (!composite && paragraphs.length === 0) {
    return null;
  }
  const tint = (composite?.element && ELEMENT_TINT[composite.element]) || DEFAULT_TINT;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.eyebrow, { color: colors.accent }]}>Composite chart</Text>
      <Text style={[styles.subtitle, { color: colors.textSubtle }]}>
        The relationship read as its own entity — not the two of you, but the third thing you make
        together.
      </Text>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surfaceLow, borderColor: colors.ghostBorder },
        ]}
      >
        <Halo color={tint} size={150} opacity={0.16} top={-40} right={-40} />
        {composite ? <CompositeChip composite={composite} /> : null}
        {composite?.phrase ? (
          <Text style={[styles.phrase, { color: colors.text }]}>{composite.phrase}</Text>
        ) : null}
        {paragraphs.length > 0 ? (
          <View style={[styles.body, { borderTopColor: 'rgba(202, 190, 255, 0.07)' }]}>
            {paragraphs.map((para, i) => (
              <Text key={i} style={[styles.paragraph, { color: colors.textMuted }]}>
                {para}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 6,
    fontFamily: SERIF_FONT,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  phrase: {
    marginTop: 12,
    fontFamily: SERIF_FONT,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  paragraph: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    lineHeight: 24,
  },
});
