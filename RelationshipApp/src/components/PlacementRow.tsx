import React, { useState } from 'react';
import { LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import type { PlacementDetail } from '../utils/placements';
import { formatPlacementSummary } from '../utils/placements';
import type { PlacementAspect } from '../utils/placementAspects';
import { AspectFocusChart } from '../../../shared/components/chart/AspectFocusChart';

const PLANET_GLYPHS: Record<PlacementDetail['key'], string> = {
  sun: '☉',
  moon: '☽',
  venus: '♀',
  mars: '♂',
  ascendant: '↑',
  descendant: '↓',
};

const SOURCE_PLANET_NAMES: Record<PlacementDetail['key'], string> = {
  sun: 'Sun',
  moon: 'Moon',
  venus: 'Venus',
  mars: 'Mars',
  ascendant: 'Ascendant',
  // Backend does not emit aspects against the Descendant; we reuse Ascendant's
  // aspect set, but the mini chart still labels the placement as Ascendant
  // since that is the natal point those aspects target.
  descendant: 'Ascendant',
};

const SUPPORT_COLOR = '#82C8B4';
const TENSION_COLOR = '#E8856B';
const FUSION_COLOR = '#D4A843';
const SUPPORT_BG = 'rgba(130, 200, 180, 0.12)';
const TENSION_BG = 'rgba(232, 133, 107, 0.12)';
const FUSION_BG = 'rgba(212, 168, 67, 0.15)';

function natureColor(nature: PlacementAspect['nature']): string {
  if (nature === 'support') return SUPPORT_COLOR;
  if (nature === 'fusion') return FUSION_COLOR;
  return TENSION_COLOR;
}

function natureBg(nature: PlacementAspect['nature']): string {
  if (nature === 'support') return SUPPORT_BG;
  if (nature === 'fusion') return FUSION_BG;
  return TENSION_BG;
}

function natureLabel(nature: PlacementAspect['nature']): string {
  if (nature === 'support') return 'Flowing';
  if (nature === 'fusion') return 'Fusion';
  return 'Tension';
}

interface PlacementRowProps {
  placement: PlacementDetail;
  aspects?: PlacementAspect[];
  // Owner's Ascendant longitude — used to rotate the per-aspect mini chart so
  // the chart sits in the same orientation as the owner's natal wheel.
  ascendantDegree?: number;
}

export function PlacementRow({
  placement,
  aspects = [],
  ascendantDegree = 0,
}: PlacementRowProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [openAspectIndex, setOpenAspectIndex] = useState<number | null>(null);

  const aspectCount = aspects.length;
  const sourcePlanetName = SOURCE_PLANET_NAMES[placement.key];

  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => {
      if (prev) {
        setOpenAspectIndex(null);
      }
      return !prev;
    });
  };

  const handleAspectPress = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenAspectIndex((prev) => (prev === index ? null : index));
  };

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.ghostBorder,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.header}>
        <View
          style={[
            styles.glyph,
            {
              backgroundColor: colors.surfaceHigh,
              borderColor: colors.ghostBorder,
            },
          ]}
        >
          <Text style={[styles.glyphText, { color: colors.accent }]}>
            {PLANET_GLYPHS[placement.key]}
          </Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.label, { color: colors.text }]}>{placement.label}</Text>
          <Text style={[styles.summary, { color: colors.textMuted }]}>
            {formatPlacementSummary(placement)}
          </Text>
        </View>
        {aspectCount > 0 ? (
          <View style={[styles.countPill, { backgroundColor: colors.surfaceHigh }]}>
            <Text style={[styles.countPillText, { color: colors.textSubtle }]}>
              {aspectCount} {aspectCount === 1 ? 'aspect' : 'aspects'}
            </Text>
          </View>
        ) : null}
        <Text style={[styles.chev, { color: colors.textSubtle }]}>{expanded ? '˅' : '›'}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.body}>
          <View style={[styles.divider, { backgroundColor: colors.ghostBorder }]} />
          <Text style={[styles.interpretation, { color: colors.textMuted }]}>
            {placement.interpretation}
          </Text>

          {aspectCount > 0 ? (
            <View style={styles.aspectsBlock}>
              <Text style={[styles.aspectsLabel, { color: colors.textSubtle }]}>Aspects</Text>
              {aspects.map((aspect, index) => {
                const isOpen = openAspectIndex === index;
                const color = natureColor(aspect.nature);
                const bg = natureBg(aspect.nature);
                return (
                  <View key={`${aspect.otherPlanet}-${aspect.type}-${index}`}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleAspectPress(index)}
                      style={[
                        styles.aspectRow,
                        {
                          backgroundColor: colors.surfaceHigh,
                          borderColor: colors.ghostBorder,
                        },
                      ]}
                    >
                      <View style={[styles.aspectAccent, { backgroundColor: color }]} />
                      <View style={styles.aspectText}>
                        <View style={styles.aspectTitleRow}>
                          <Text style={[styles.aspectTitle, { color: colors.text }]}>
                            {placement.label} {aspect.type} {aspect.otherPlanet}
                          </Text>
                          <View style={[styles.naturePill, { backgroundColor: bg }]}>
                            <Text style={[styles.naturePillText, { color }]}>
                              {natureLabel(aspect.nature)}
                            </Text>
                          </View>
                        </View>
                        {aspect.otherSign ? (
                          <Text style={[styles.aspectMeta, { color: colors.textMuted }]}>
                            {aspect.otherPlanet} in {aspect.otherSign}
                            {aspect.otherDegree !== null ? ` ${aspect.otherDegree}°` : ''}
                            {aspect.orb !== null ? ` · orb ${aspect.orb.toFixed(1)}°` : ''}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={[styles.aspectChev, { color: colors.textSubtle }]}>
                        {isOpen ? '˅' : '›'}
                      </Text>
                    </TouchableOpacity>

                    {isOpen && (!placement.sign || !aspect.otherSign) ? (
                      <View style={styles.aspectChartWrap}>
                        <Text style={[styles.unavailable, { color: colors.textSubtle }]}>
                          Mini chart unavailable for this aspect — birth time
                          required to place {!placement.sign ? placement.label : aspect.otherPlanet}.
                        </Text>
                      </View>
                    ) : null}

                    {isOpen && placement.sign && aspect.otherSign ? (
                      <View style={styles.aspectChartWrap}>
                        <AspectFocusChart
                          aspect={aspect.type}
                          source="natal"
                          planet1={{
                            name: sourcePlanetName,
                            sign: placement.sign,
                            degree: placement.degree ?? 0,
                            house: placement.house ?? undefined,
                          }}
                          planet2={{
                            name: aspect.otherPlanet,
                            sign: aspect.otherSign,
                            degree: aspect.otherDegree ?? 0,
                            house: aspect.otherHouse ?? undefined,
                          }}
                          ascendantDegree={ascendantDegree}
                          size={150}
                        />
                        <View style={styles.aspectChartLegend}>
                          <View style={styles.aspectChartLegendCol}>
                            <Text style={[styles.legendName, { color: colors.text }]}>
                              {placement.label}
                            </Text>
                            <Text style={[styles.legendMeta, { color: colors.textSubtle }]}>
                              {placement.degree ?? 0}° {placement.sign}
                            </Text>
                          </View>
                          <Text style={[styles.legendType, { color }]}>{aspect.type}</Text>
                          <View style={styles.aspectChartLegendCol}>
                            <Text style={[styles.legendName, { color: colors.text }]}>
                              {aspect.otherPlanet}
                            </Text>
                            <Text style={[styles.legendMeta, { color: colors.textSubtle }]}>
                              {aspect.otherDegree ?? 0}° {aspect.otherSign}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  glyph: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphText: {
    fontSize: 14,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  summary: {
    fontSize: 12,
  },
  countPill: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  chev: {
    fontSize: 18,
    fontWeight: '500',
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  divider: {
    height: 1,
  },
  interpretation: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  aspectsBlock: {
    gap: 6,
  },
  aspectsLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  aspectRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  aspectAccent: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
  },
  aspectText: {
    flex: 1,
    gap: 2,
  },
  aspectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  aspectTitle: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  naturePill: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  naturePillText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  aspectMeta: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  aspectChev: {
    alignSelf: 'center',
    fontSize: 14,
  },
  aspectChartWrap: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  aspectChartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aspectChartLegendCol: {
    alignItems: 'center',
  },
  legendName: {
    fontSize: 11,
    fontWeight: '700',
  },
  legendMeta: {
    fontSize: 10,
  },
  legendType: {
    fontSize: 11,
    fontWeight: '600',
  },
  unavailable: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
