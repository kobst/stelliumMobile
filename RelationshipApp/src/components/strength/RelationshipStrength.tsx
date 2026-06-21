import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../theme';
import { SERIF_FONT } from '../../theme/typography';
import { ShapeGlyph } from '../shape/ShapeGlyph';
import {
  CLUSTER_META,
  CLUSTER_ORDER,
  ClusterKey,
  PillarScores,
  StrengthModel,
} from './strengthModel';

// Fixed lilac → cyan gradient regardless of value, so a low reading never
// reads as a "fail" (mirrors the Iris StrengthRing design intent).
const RING_GRADIENT_ID = 'relationshipStrengthGrad';

interface StrengthRingProps {
  score: number;
  size?: number;
  stroke?: number;
}

export function StrengthRing({ score, size = 148, stroke = 11 }: StrengthRingProps) {
  const { colors } = useTheme();
  const radius = size / 2 - stroke / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={RING_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#cabeff" />
            <Stop offset="55%" stopColor="#a9b6ff" />
            <Stop offset="100%" stopColor="#00dce5" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(202,190,255,0.18)"
          strokeWidth={stroke}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${RING_GRADIENT_ID})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.ringLabel} pointerEvents="none">
        <Text style={[styles.ringScore, { color: colors.text, fontSize: size * 0.34 }]}>
          {Math.round(score)}
        </Text>
      </View>
    </View>
  );
}

interface FlavorTagProps {
  flavorPresent: boolean;
  flavorCluster: ClusterKey | null;
}

// "{Cluster}-Forward" when one pillar clearly leads, otherwise a soft, positive
// "broad" line. Never uses the word "Balanced".
export function FlavorTag({ flavorPresent, flavorCluster }: FlavorTagProps) {
  const { colors } = useTheme();

  if (flavorPresent && flavorCluster) {
    const meta = CLUSTER_META[flavorCluster];
    return (
      <View style={[styles.flavorTag, { backgroundColor: `${meta.tint}1A`, borderColor: `${meta.tint}55` }]}>
        <Text style={[styles.flavorEmoji, { color: meta.tint }]}>{meta.emoji}</Text>
        <Text style={[styles.flavorLabel, { color: meta.tint }]}>{meta.label}-Forward</Text>
      </View>
    );
  }

  return (
    <View style={[styles.flavorTag, styles.flavorTagBroad]}>
      <Text style={[styles.flavorEmoji, { color: colors.primary }]}>✦</Text>
      <Text style={[styles.flavorBroad, { color: colors.textMuted }]}>
        Broad across the five pillars
      </Text>
    </View>
  );
}

interface StrengthBlockProps {
  model: StrengthModel;
}

// Hero strength block: ring + soft caption + flavour tag. Leads the hierarchy.
export function StrengthBlock({ model }: StrengthBlockProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.strengthBlock}>
      <StrengthRing score={model.strengthScore} size={148} />
      <Text style={[styles.strengthCaption, { color: colors.textMuted }]}>
        RELATIONSHIP STRENGTH
      </Text>
      <View style={styles.flavorSpacing}>
        <FlavorTag flavorPresent={model.flavorPresent} flavorCluster={model.flavorCluster} />
      </View>
    </View>
  );
}

interface PillarSummaryProps {
  scores: PillarScores;
}

// Five-pillar bars — explain WHY the strength reads the way it does.
export function PillarSummary({ scores }: PillarSummaryProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.pillars}>
      {CLUSTER_ORDER.map((key) => {
        const meta = CLUSTER_META[key];
        const value = Math.round(scores[key] || 0);
        return (
          <View key={key} style={styles.pillarRow}>
            <Text style={[styles.pillarLabel, { color: colors.text }]}>{meta.label}</Text>
            <View style={styles.pillarTrack}>
              <View
                style={[styles.pillarFill, { width: `${Math.max(2, value)}%`, backgroundColor: meta.tint }]}
              />
            </View>
            <Text style={[styles.pillarValue, { color: meta.tint }]}>{value}</Text>
          </View>
        );
      })}
    </View>
  );
}

interface PatternDetailCardProps {
  pattern: string | null;
  blurb: string | null;
  shapeKind?: string | null;
}

// Archetype detail — DEMOTED below the strength lead (was the headline).
export function PatternDetailCard({ pattern, blurb, shapeKind }: PatternDetailCardProps) {
  const { colors } = useTheme();
  if (!pattern && !blurb) {
    return null;
  }
  return (
    <View style={[styles.patternCard, { backgroundColor: colors.surfaceLow }]}>
      <View style={styles.patternHeader}>
        {shapeKind ? <ShapeGlyph kind={shapeKind} size={40} /> : null}
        <View style={styles.patternHeaderCopy}>
          <Text style={[styles.patternEyebrow, { color: colors.textSubtle }]}>
            PATTERN DETAIL
          </Text>
          {pattern ? (
            <Text style={[styles.patternName, { color: colors.accent }]}>{pattern}</Text>
          ) : null}
        </View>
      </View>
      {blurb ? (
        <Text style={[styles.patternBlurb, { color: colors.textMuted }]}>{blurb}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ringLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontFamily: SERIF_FONT,
    fontWeight: '500',
    letterSpacing: -1,
  },
  strengthBlock: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  strengthCaption: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginTop: 16,
  },
  flavorSpacing: {
    marginTop: 12,
  },
  flavorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  flavorTagBroad: {
    backgroundColor: 'rgba(202,190,255,0.06)',
    borderColor: 'rgba(202,190,255,0.20)',
  },
  flavorEmoji: {
    fontSize: 12,
    marginRight: 8,
  },
  flavorLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  flavorBroad: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontStyle: 'italic',
  },
  pillars: {
    gap: 11,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillarLabel: {
    width: 86,
    fontSize: 12.5,
    fontWeight: '500',
  },
  pillarTrack: {
    flex: 1,
    height: 7,
    borderRadius: 6,
    marginHorizontal: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(202,190,255,0.12)',
  },
  pillarFill: {
    height: '100%',
    borderRadius: 6,
  },
  pillarValue: {
    width: 26,
    textAlign: 'right',
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontStyle: 'italic',
  },
  patternCard: {
    borderRadius: 18,
    padding: 18,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  patternHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  patternEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  patternName: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontStyle: 'italic',
    fontWeight: '500',
    marginTop: 4,
  },
  patternBlurb: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 23,
    marginTop: 14,
  },
});
