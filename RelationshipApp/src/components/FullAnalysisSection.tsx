import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RelationshipTheme } from '../theme';
import { decodeAstroCode } from '../utils/astroCode';
import { AspectFocusChart } from '../../../shared/components/chart/AspectFocusChart';
import { PlacementFocusChart } from '../../../shared/components/chart/PlacementFocusChart';
import { FullChartModal } from './FullChartModal';
import { RelationshipHoroscopeTab } from './RelationshipHoroscopeTab';
import { CompositeChartCard } from './strength/CompositeChartCard';
import Svg, { Circle, Line as SvgLine } from 'react-native-svg';
import type { TextStyle, StyleProp } from 'react-native';

const SUPPORT_COLOR = '#82C8B4';
const SUPPORT_BG = 'rgba(130, 200, 180, 0.12)';
const SUPPORT_BORDER = 'rgba(130, 200, 180, 0.18)';
const CHALLENGE_COLOR = '#E8856B';
const CHALLENGE_BG = 'rgba(232, 133, 107, 0.12)';
const CHALLENGE_BORDER = 'rgba(232, 133, 107, 0.18)';
const SYNTH_BG = 'rgba(202, 190, 255, 0.12)';
const SYNTH_BORDER = 'rgba(202, 190, 255, 0.18)';

const HARMONIOUS_ASPECTS = new Set(['trine', 'sextile']);
const HARD_ASPECTS = new Set(['square', 'opposition', 'quincunx']);

const ASPECT_GLYPHS: Record<string, string> = {
  conjunction: '\u260C',
  sextile: '\u26B9',
  square: '\u25A1',
  trine: '\u25B3',
  opposition: '\u260D',
  quincunx: '\u26BB',
};

function aspectGlyph(aspect?: string): string {
  if (!aspect) return '';
  return ASPECT_GLYPHS[aspect.toLowerCase()] ?? aspect;
}

function valenceFromAspect(aspect?: string): number | undefined {
  if (!aspect) return undefined;
  const a = aspect.toLowerCase();
  if (HARMONIOUS_ASPECTS.has(a)) return 1;
  if (HARD_ASPECTS.has(a)) return -1;
  return 0;
}

const SIGN_ABBR: Record<string, string> = {
  Aries: 'Ari', Taurus: 'Tau', Gemini: 'Gem', Cancer: 'Can',
  Leo: 'Leo', Virgo: 'Vir', Libra: 'Lib', Scorpio: 'Sco',
  Sagittarius: 'Sag', Capricorn: 'Cap', Aquarius: 'Aqu', Pisces: 'Pis',
};

function abbrSign(sign?: string): string | null {
  if (!sign) return null;
  return SIGN_ABBR[sign] ?? sign.slice(0, 3);
}

function shortPlacement(p?: { sign?: string; degree?: number; house?: number }): string | null {
  if (!p) return null;
  const parts: string[] = [];
  const sign = abbrSign(p.sign);
  if (sign) parts.push(sign);
  if (typeof p.degree === 'number' && Number.isFinite(p.degree)) {
    const within = ((p.degree % 30) + 30) % 30;
    parts.push(`${Math.floor(within)}°`);
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

function formatPlacement(p?: { sign?: string; degree?: number; house?: number; isRetro?: boolean }): string | null {
  if (!p) return null;
  const parts: string[] = [];
  if (typeof p.degree === 'number' && Number.isFinite(p.degree)) {
    const within = ((p.degree % 30) + 30) % 30;
    parts.push(`${Math.floor(within)}°`);
  }
  if (p.sign) parts.push(p.sign);
  if (typeof p.house === 'number' && p.house > 0) parts.push(`H${p.house}`);
  if (p.isRetro) parts.push('℞');
  return parts.length > 0 ? parts.join(' ') : null;
}

const CLUSTER_ORDER = ['Harmony', 'Passion', 'Connection', 'Stability', 'Growth'] as const;
type ClusterName = (typeof CLUSTER_ORDER)[number];

const CLUSTER_ICONS: Record<ClusterName, string> = {
  Harmony: '\u2764',
  Passion: '\uD83D\uDD25',
  Connection: '\uD83E\uDDE0',
  Stability: '\uD83D\uDC8E',
  Growth: '\uD83C\uDF31',
};

interface PanelData {
  supportPanel?: string | null;
  challengePanel?: string | null;
  synthesisPanel?: string | null;
}

interface ClusterCompleteAnalysis {
  synastry?: PanelData;
  composite?: PanelData;
}

interface ClusterMetrics {
  score?: number;
  supportPct?: number;
  challengePct?: number;
}

interface AspectChartData {
  source: 'synastry' | 'composite' | 'natal';
  aspect: string;
  planet1: {
    name: string;
    sign: string;
    degree?: number;
    house?: number;
    isRetro?: boolean;
  };
  planet2: {
    name: string;
    sign: string;
    degree?: number;
    house?: number;
    isRetro?: boolean;
  };
}

interface KeystoneAnnotation {
  title?: string;
  sentence?: string;
  primaryCluster?: string;
  rank?: number;
}

interface KeystoneAspect {
  description?: string;
  cluster?: string;
  chart?: AspectChartData;
  dominantValence?: number;
  code?: string;
  annotation?: KeystoneAnnotation;
}

function buildChartFromScoredItem(item: any): AspectChartData | undefined {
  const aspect: string | undefined = item?.aspect;
  const p1Name: string | undefined = item?.planet1;
  const p2Name: string | undefined = item?.planet2;
  const p1Sign: string | undefined = item?.planet1Sign;
  const p2Sign: string | undefined = item?.planet2Sign;
  if (!aspect || !p1Name || !p2Name || !p1Sign || !p2Sign) return undefined;
  const sourceRaw: string | undefined = item?.source;
  const source: AspectChartData['source'] =
    sourceRaw === 'composite' ? 'composite' : sourceRaw === 'natal' ? 'natal' : 'synastry';
  return {
    source,
    aspect,
    planet1: {
      name: p1Name,
      sign: p1Sign,
      degree: typeof item?.planet1Degree === 'number' ? item.planet1Degree : undefined,
      house: typeof item?.planet1House === 'number' ? item.planet1House : undefined,
      isRetro: Boolean(item?.planet1IsRetro),
    },
    planet2: {
      name: p2Name,
      sign: p2Sign,
      degree: typeof item?.planet2Degree === 'number' ? item.planet2Degree : undefined,
      house: typeof item?.planet2House === 'number' ? item.planet2House : undefined,
      isRetro: Boolean(item?.planet2IsRetro),
    },
  };
}

interface ColoredAspectTitleProps {
  description?: string;
  planet1Name?: string;
  planet2Name?: string;
  planet1Color?: string;
  planet2Color?: string;
  baseStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

function ColoredAspectTitle({
  description,
  planet1Name,
  planet2Name,
  planet1Color,
  planet2Color,
  baseStyle,
  numberOfLines,
}: ColoredAspectTitleProps) {
  if (!description) return null;
  if (!planet1Name || !planet2Name || (!planet1Color && !planet2Color)) {
    return (
      <Text style={baseStyle} numberOfLines={numberOfLines}>
        {description}
      </Text>
    );
  }

  type Segment = { text: string; color?: string };
  const segments: Segment[] = [];
  let cursor = 0;

  if (planet1Color) {
    const idx = description.indexOf(planet1Name, cursor);
    if (idx >= cursor) {
      segments.push({ text: description.slice(cursor, idx) });
      segments.push({ text: planet1Name, color: planet1Color });
      cursor = idx + planet1Name.length;
    }
  }
  if (planet2Color) {
    const idx = description.indexOf(planet2Name, cursor);
    if (idx >= cursor) {
      segments.push({ text: description.slice(cursor, idx) });
      segments.push({ text: planet2Name, color: planet2Color });
      cursor = idx + planet2Name.length;
    }
  }
  segments.push({ text: description.slice(cursor) });

  return (
    <Text style={baseStyle} numberOfLines={numberOfLines}>
      {segments.map((s, i) =>
        s.color ? (
          <Text key={i} style={{ color: s.color, fontWeight: '600' }}>
            {s.text}
          </Text>
        ) : (
          s.text
        )
      )}
    </Text>
  );
}

function aggregateKeystoneAspects(
  fullAnalysis: any,
  maxCount: number = 6
): KeystoneAspect[] {
  // Rank by the dominant cluster contribution magnitude per scored item.
  const scoredItems = Array.isArray(fullAnalysis?.scoredItems)
    ? fullAnalysis.scoredItems
    : Array.isArray(fullAnalysis?.clusterScoring?.scoredItems)
    ? fullAnalysis.clusterScoring.scoredItems
    : [];

  type Ranked = KeystoneAspect & { magnitude: number };
  const ranked: Ranked[] = [];

  for (const item of scoredItems) {
    const description: string | undefined = item?.description;
    if (!description) continue;
    const contributions = Array.isArray(item?.clusterContributions)
      ? item.clusterContributions
      : [];
    if (contributions.length === 0) continue;

    let dominantCluster: string | undefined;
    let dominantMagnitude = -Infinity;
    for (const c of contributions) {
      const score = typeof c?.score === 'number' ? c.score : 0;
      if (score === 0 || !c?.cluster) continue;
      const magnitude = Math.abs(score);
      if (magnitude > dominantMagnitude) {
        dominantMagnitude = magnitude;
        dominantCluster = c.cluster;
      }
    }
    if (dominantMagnitude <= 0) continue;

    ranked.push({
      description,
      cluster: dominantCluster,
      chart: buildChartFromScoredItem(item),
      magnitude: dominantMagnitude,
      dominantValence: valenceFromAspect(item?.aspect),
      code: typeof item?.code === 'string' ? item.code : undefined,
    });
  }

  const byDesc = new Map<string, Ranked>();
  for (const ka of ranked) {
    const key = ka.description ?? '';
    if (!key) continue;
    const existing = byDesc.get(key);
    if (!existing || ka.magnitude > existing.magnitude) {
      byDesc.set(key, ka);
    }
  }
  const deduped = Array.from(byDesc.values());
  deduped.sort((a, b) => b.magnitude - a.magnitude);
  return deduped.slice(0, maxCount).map(({ magnitude: _magnitude, ...rest }) => rest);
}

interface FullAnalysisSectionProps {
  colors: RelationshipTheme['colors'];
  initialOverview: string | null;
  fullAnalysis: any;
  previewAnalysis?: any;
  personAName?: string;
  personBName?: string;
  selfBirthChart?: { planets?: any[]; houses?: any[] } | null;
  partnerBirthChart?: { planets?: any[]; houses?: any[] } | null;
  relationship?: import('../../../shared/api/relationships').UserCompositeChart | null;
  onRelationshipUpdated?: (
    next: import('../../../shared/api/relationships').UserCompositeChart
  ) => void;
  /**
   * True when both parties are celebrities and the signed-in user is not
   * one of them. Hides the Horoscope tab and switches second-person copy
   * ("Between you", "your charts") to third-person ("Between partners",
   * "their charts").
   */
  isCelebPair?: boolean;
}

type TabKey = 'overview' | 'clusters' | 'keyAspects' | 'horoscope';

type LensKey = 'between' | 'relationship';

export function FullAnalysisSection({
  colors,
  initialOverview,
  fullAnalysis,
  previewAnalysis,
  personAName,
  personBName,
  selfBirthChart,
  partnerBirthChart,
  relationship,
  onRelationshipUpdated,
  isCelebPair = false,
}: FullAnalysisSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const hideHoroscope = isCelebPair;

  useEffect(() => {
    if (hideHoroscope && activeTab === 'horoscope') {
      setActiveTab('overview');
    }
  }, [activeTab, hideHoroscope]);
  const [activeCluster, setActiveCluster] = useState<ClusterName>('Harmony');
  const [activeLens, setActiveLens] = useState<LensKey>('between');
  const [chartModalOpen, setChartModalOpen] = useState(false);

  const overall = fullAnalysis?.overall ?? null;
  const tier = overall?.tier ?? null;
  const overallScore = typeof overall?.score === 'number' ? Math.round(overall.score) : null;
  const dominantCluster = overall?.dominantCluster ?? null;
  const challengeCluster = overall?.challengeCluster ?? null;
  const holisticOverview =
    fullAnalysis?.holisticOverview?.trim?.() ||
    initialOverview ||
    null;
  // Composite chart "as a whole": the entity chip/phrase + multi-paragraph summary.
  const compositeCharacter =
    previewAnalysis?.compositeCharacter ?? fullAnalysis?.compositeCharacter ?? null;
  const compositeSummary =
    fullAnalysis?.compositeSummary?.summary ??
    previewAnalysis?.compositeSummary?.summary ??
    null;

  const tensionFlow = fullAnalysis?.tensionFlowAnalysis ?? null;
  const tensionQuadrant = tensionFlow?.quadrant ?? null;
  const supportDensityPct =
    typeof tensionFlow?.supportDensity === 'number'
      ? Math.round(tensionFlow.supportDensity * 100)
      : null;
  const challengeDensityPct =
    typeof tensionFlow?.challengeDensity === 'number'
      ? Math.round(tensionFlow.challengeDensity * 100)
      : null;
  const polarityRatio =
    typeof tensionFlow?.polarityRatio === 'number'
      ? Number(tensionFlow.polarityRatio.toFixed(2))
      : null;

  const completeAnalysis = fullAnalysis?.completeAnalysis ?? null;
  const clusterMetrics = fullAnalysis?.clusterAnalysis?.clusters ?? null;

  const scoredItemsAll = Array.isArray(fullAnalysis?.scoredItems)
    ? fullAnalysis.scoredItems
    : Array.isArray(fullAnalysis?.clusterScoring?.scoredItems)
    ? fullAnalysis.clusterScoring.scoredItems
    : [];
  const codeToDescription: Record<string, string> = {};
  const codeToScoredItem: Record<string, any> = {};
  for (const item of scoredItemsAll) {
    if (typeof item?.code === 'string') {
      if (typeof item?.description === 'string') {
        codeToDescription[item.code] = item.description;
      }
      codeToScoredItem[item.code] = item;
    }
  }
  const personANameForCodes: string =
    personAName ??
    fullAnalysis?.userA?.name ??
    fullAnalysis?.userA_name ??
    fullAnalysis?.userA?.firstName ??
    'Person 1';
  const personBNameForCodes: string =
    personBName ??
    fullAnalysis?.userB?.name ??
    fullAnalysis?.userB_name ??
    fullAnalysis?.userB?.firstName ??
    'Person 2';

  // Backend descriptions for celeb-celeb relationships ship with literal
  // "Partner A" / "Partner B" placeholders since neither party owns the row.
  // Swap them with the actual first names so the keystone and breakdown copy
  // reads naturally.
  const firstWord = (value: string): string => value.trim().split(/\s+/)[0] ?? value;
  const personAFirstForCopy = firstWord(personANameForCodes);
  const personBFirstForCopy = firstWord(personBNameForCodes);
  const swapPartnerNames = (description: string): string => {
    if (!description) return description;
    let out = description;
    if (personAFirstForCopy && personAFirstForCopy !== 'Person 1') {
      out = out
        .replace(/Partner A's/g, `${personAFirstForCopy}'s`)
        .replace(/Partner A\b/g, personAFirstForCopy);
    }
    if (personBFirstForCopy && personBFirstForCopy !== 'Person 2') {
      out = out
        .replace(/Partner B's/g, `${personBFirstForCopy}'s`)
        .replace(/Partner B\b/g, personBFirstForCopy);
    }
    return out;
  };
  const codeToDescriptionForRender: Record<string, string> = Object.fromEntries(
    Object.entries(codeToDescription).map(([code, desc]) => [code, swapPartnerNames(desc)])
  );

  // Ascendant degrees per chart source so the focus charts rotate to the
  // owner's frame. Synastry charts are drawn from Person A's perspective.
  const synastryAscendant: number = (() => {
    const houses = (selfBirthChart as any)?.houses;
    if (!Array.isArray(houses)) return 0;
    const asc = houses.find((h: any) => h?.house === 1 || h?.house === '1');
    const deg = asc?.degree ?? houses[0]?.degree;
    return typeof deg === 'number' && Number.isFinite(deg) ? deg : 0;
  })();
  const compositeAscendant: number = (() => {
    const houses = fullAnalysis?.compositeChart?.houses;
    if (!Array.isArray(houses)) return 0;
    const asc = houses.find((h: any) => h?.house === 1 || h?.house === '1');
    const deg = asc?.degree ?? houses[0]?.degree;
    return typeof deg === 'number' && Number.isFinite(deg) ? deg : 0;
  })();

  // Planet lookups so placement cards (CompP-, SynP-, Pp-) get sign + degree
  // from the actual chart data rather than a fallback position.
  const compositePlanetByName: Record<string, { sign?: string; degree?: number; house?: number }> = {};
  if (Array.isArray(fullAnalysis?.compositeChart?.planets)) {
    for (const p of fullAnalysis.compositeChart.planets) {
      if (typeof p?.name === 'string') {
        compositePlanetByName[p.name] = {
          sign: typeof p?.sign === 'string' ? p.sign : undefined,
          degree:
            typeof p?.norm_degree === 'number'
              ? p.norm_degree
              : typeof p?.full_degree === 'number'
              ? p.full_degree
              : undefined,
          house: typeof p?.house === 'number' ? p.house : undefined,
        };
      }
    }
  }
  const selfPlanetByName: Record<string, { sign?: string; degree?: number; house?: number }> = {};
  if (Array.isArray((selfBirthChart as any)?.planets)) {
    for (const p of (selfBirthChart as any).planets) {
      if (typeof p?.name === 'string') {
        selfPlanetByName[p.name] = {
          sign: typeof p?.sign === 'string' ? p.sign : undefined,
          degree:
            typeof p?.norm_degree === 'number'
              ? p.norm_degree
              : typeof p?.full_degree === 'number'
              ? p.full_degree
              : undefined,
          house: typeof p?.house === 'number' ? p.house : undefined,
        };
      }
    }
  }
  const partnerPlanetByName: Record<string, { sign?: string; degree?: number; house?: number }> = {};
  if (Array.isArray((partnerBirthChart as any)?.planets)) {
    for (const p of (partnerBirthChart as any).planets) {
      if (typeof p?.name === 'string') {
        partnerPlanetByName[p.name] = {
          sign: typeof p?.sign === 'string' ? p.sign : undefined,
          degree:
            typeof p?.norm_degree === 'number'
              ? p.norm_degree
              : typeof p?.full_degree === 'number'
              ? p.full_degree
              : undefined,
          house: typeof p?.house === 'number' ? p.house : undefined,
        };
      }
    }
  }

  // Enriches a chart's two planets with sign/degree from the right chart
  // lookup based on chart source. Composite → both planets in the composite
  // chart. Synastry → planet1 is Person A's, planet2 is Person B's. Natal →
  // both come from Person A's natal chart.
  function enrichAspectChart(chart: AspectChartData): AspectChartData {
    if (!chart) return chart;
    const lookup1 =
      chart.source === 'composite'
        ? compositePlanetByName[chart.planet1.name]
        : chart.source === 'synastry'
        ? selfPlanetByName[chart.planet1.name]
        : selfPlanetByName[chart.planet1.name];
    const lookup2 =
      chart.source === 'composite'
        ? compositePlanetByName[chart.planet2.name]
        : chart.source === 'synastry'
        ? partnerPlanetByName[chart.planet2.name]
        : selfPlanetByName[chart.planet2.name];
    return {
      ...chart,
      planet1: {
        ...chart.planet1,
        sign: chart.planet1.sign ?? lookup1?.sign ?? chart.planet1.sign,
        degree:
          typeof chart.planet1.degree === 'number' ? chart.planet1.degree : lookup1?.degree,
        house: chart.planet1.house ?? lookup1?.house,
      },
      planet2: {
        ...chart.planet2,
        sign: chart.planet2.sign ?? lookup2?.sign ?? chart.planet2.sign,
        degree:
          typeof chart.planet2.degree === 'number' ? chart.planet2.degree : lookup2?.degree,
        house: chart.planet2.house ?? lookup2?.house,
      },
    };
  }

  const keystoneAnnotationByCode: Record<string, KeystoneAnnotation> =
    fullAnalysis?.clusterAnalysis?.overall?.keystoneAspectAnnotations?.byCode ?? {};

  // Prefer the backend's curated overall keystone list; fall back to the
  // magnitude-based aggregation only when the curated list is unavailable
  // (older relationships pre-keystone-curation).
  const officialKeystoneEntries: any[] =
    fullAnalysis?.clusterAnalysis?.overall?.keystoneAspects ??
    fullAnalysis?.overall?.keystoneAspects ??
    [];
  const officialKeystoneAspects: KeystoneAspect[] = Array.isArray(officialKeystoneEntries)
    ? officialKeystoneEntries
        .map((entry: any): KeystoneAspect | null => {
          const code: string | undefined =
            typeof entry?.code === 'string' ? entry.code : undefined;
          const scoredItem = code ? codeToScoredItem[code] : undefined;
          const rawDescription: string | undefined =
            (typeof entry?.description === 'string' && entry.description) ||
            (typeof scoredItem?.description === 'string' && scoredItem.description) ||
            undefined;
          if (!rawDescription) return null;
          const description = swapPartnerNames(rawDescription);
          const cluster: string | undefined =
            entry?.primaryCluster ?? entry?.cluster ?? scoredItem?.dominantCluster;
          const chart = scoredItem ? buildChartFromScoredItem(scoredItem) : undefined;
          const dominantValence = valenceFromAspect(
            scoredItem?.aspect ?? entry?.aspect
          );
          return {
            description,
            cluster,
            chart,
            dominantValence,
            code,
          };
        })
        .filter((x): x is KeystoneAspect => x !== null)
    : [];

  const keystoneAspectsRaw: KeystoneAspect[] =
    officialKeystoneAspects.length > 0
      ? officialKeystoneAspects
      : aggregateKeystoneAspects(fullAnalysis);
  const keystoneAspects: KeystoneAspect[] = keystoneAspectsRaw.map((ka) => {
    const enriched = ka.chart ? { ...ka, chart: enrichAspectChart(ka.chart) } : { ...ka };
    if (ka.description) {
      enriched.description = swapPartnerNames(ka.description);
    }
    if (ka.code && keystoneAnnotationByCode[ka.code]) {
      enriched.annotation = keystoneAnnotationByCode[ka.code];
    }
    return enriched;
  });

  const aspectMix = (() => {
    const tfTotal = typeof tensionFlow?.totalAspects === 'number' ? tensionFlow.totalAspects : null;
    const tfSupport =
      typeof tensionFlow?.supportAspects === 'number' ? tensionFlow.supportAspects : null;
    const tfChallenge =
      typeof tensionFlow?.challengeAspects === 'number' ? tensionFlow.challengeAspects : null;
    if (tfTotal !== null || tfSupport !== null || tfChallenge !== null) {
      return { total: tfTotal, support: tfSupport, challenge: tfChallenge };
    }
    // Fallback: derive from scoredItems by dominant clusterContribution valence.
    const items = Array.isArray(fullAnalysis?.scoredItems)
      ? fullAnalysis.scoredItems
      : Array.isArray(fullAnalysis?.clusterScoring?.scoredItems)
      ? fullAnalysis.clusterScoring.scoredItems
      : [];
    if (items.length === 0) return null;
    let support = 0;
    let challenge = 0;
    for (const item of items) {
      const contributions = Array.isArray(item?.clusterContributions)
        ? item.clusterContributions
        : [];
      let dominantValence: number | undefined;
      let dominantMagnitude = -Infinity;
      for (const c of contributions) {
        const score = typeof c?.score === 'number' ? c.score : 0;
        const magnitude = Math.abs(score);
        if (magnitude > dominantMagnitude) {
          dominantMagnitude = magnitude;
          dominantValence = c?.valence;
        }
      }
      if (dominantValence === 1) support += 1;
      else if (dominantValence === -1) challenge += 1;
    }
    return { total: items.length, support, challenge };
  })();

  const doubleWhammyAspects = (() => {
    const items = Array.isArray(fullAnalysis?.scoredItems)
      ? fullAnalysis.scoredItems
      : Array.isArray(fullAnalysis?.clusterScoring?.scoredItems)
      ? fullAnalysis.clusterScoring.scoredItems
      : [];
    const byDescription = new Map<string, any>();
    for (const item of items) {
      if (typeof item?.description === 'string') byDescription.set(item.description, item);
    }
    const dedup = new Map<
      string,
      {
        description?: string;
        partnerDescription?: string;
        theme?: string;
        complexity?: string;
        combinedMagnitude?: number;
        dominantValence?: number;
        chartA?: AspectChartData;
        chartB?: AspectChartData;
      }
    >();
    for (const item of items) {
      const dw = item?.doubleWhammy;
      if (!dw || dw.isDoubleWhammy !== true) continue;
      const desc: string | undefined = item?.description;
      const partnerDesc: string | undefined = dw.partnerDescription;
      const pairKey = [desc, partnerDesc]
        .filter((v): v is string => typeof v === 'string')
        .sort()
        .join(' | ');
      if (!pairKey || dedup.has(pairKey)) continue;
      const partnerItem = partnerDesc ? byDescription.get(partnerDesc) : undefined;
      dedup.set(pairKey, {
        description: desc ? swapPartnerNames(desc) : desc,
        partnerDescription: partnerDesc ? swapPartnerNames(partnerDesc) : partnerDesc,
        theme: dw.theme,
        complexity: dw.complexity,
        combinedMagnitude:
          typeof dw.combinedMagnitude === 'number' ? dw.combinedMagnitude : undefined,
        dominantValence:
          typeof dw.dominantValence === 'number' ? dw.dominantValence : undefined,
        chartA: (() => {
          const c = buildChartFromScoredItem(item);
          return c ? enrichAspectChart(c) : undefined;
        })(),
        chartB: (() => {
          if (!partnerItem) return undefined;
          const c = buildChartFromScoredItem(partnerItem);
          return c ? enrichAspectChart(c) : undefined;
        })(),
      });
    }
    return Array.from(dedup.values()).sort(
      (a, b) => (b.combinedMagnitude ?? 0) - (a.combinedMagnitude ?? 0)
    );
  })();


  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'clusters', label: 'Breakdown' },
    { key: 'keyAspects', label: 'Key Aspects' },
    ...(hideHoroscope
      ? []
      : ([{ key: 'horoscope', label: 'Horoscope' }] as { key: TabKey; label: string }[])),
  ];

  return (
    <>
      <View style={styles.unlockedPillRow}>
        <View
          style={[
            styles.unlockedPill,
            { backgroundColor: SUPPORT_BG, borderColor: SUPPORT_BORDER },
          ]}
        >
          <Text style={[styles.unlockedPillText, { color: SUPPORT_COLOR }]}>
            ✓ Full analysis unlocked
          </Text>
        </View>
      </View>

      <View style={[styles.tabBar, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.85}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabButton,
                {
                  backgroundColor: isActive ? colors.surface : 'transparent',
                  borderColor: isActive ? colors.ghostBorder : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: isActive ? colors.text : colors.textSubtle },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'overview' ? (
        <>
          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>Overall Reading</Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
              ]}
            >
              <View style={styles.badgeRow}>
                {tier || overallScore !== null ? (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: 'rgba(202, 190, 255, 0.12)',
                        borderColor: 'rgba(202, 190, 255, 0.2)',
                      },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                      {tier ?? 'Tier'}
                      {overallScore !== null ? ` · ${overallScore}/100` : ''}
                    </Text>
                  </View>
                ) : null}
                {dominantCluster ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: SUPPORT_BG, borderColor: SUPPORT_BORDER },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: SUPPORT_COLOR }]}>
                      Strongest: {dominantCluster}
                    </Text>
                  </View>
                ) : null}
                {challengeCluster ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: CHALLENGE_BG, borderColor: CHALLENGE_BORDER },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: CHALLENGE_COLOR }]}>
                      Weakest: {challengeCluster}
                    </Text>
                  </View>
                ) : null}
              </View>
              {holisticOverview ? (
                <Text style={[styles.cardBody, { color: colors.text }]}>{holisticOverview}</Text>
              ) : null}
            </View>
          </View>

          {/* Composite chart — the relationship read as its own entity. Only the
              unlocked Overview reaches this tab, so the summary is present. */}
          <CompositeChartCard composite={compositeCharacter} summary={compositeSummary} />

          {tensionQuadrant || supportDensityPct !== null || polarityRatio !== null ? (
            <View>
              <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>Tension Flow</Text>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <View style={styles.pillWrap}>
                  {tensionQuadrant ? (
                    <View
                      style={[styles.pill, { backgroundColor: 'rgba(202, 190, 255, 0.12)' }]}
                    >
                      <Text style={[styles.pillText, { color: colors.primary }]}>
                        {tensionQuadrant}
                      </Text>
                    </View>
                  ) : null}
                  {supportDensityPct !== null ? (
                    <View style={[styles.pill, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                      <Text style={[styles.pillText, { color: colors.textSubtle }]}>
                        Support {supportDensityPct}%
                      </Text>
                    </View>
                  ) : null}
                  {challengeDensityPct !== null ? (
                    <View style={[styles.pill, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                      <Text style={[styles.pillText, { color: colors.textSubtle }]}>
                        Challenge {challengeDensityPct}%
                      </Text>
                    </View>
                  ) : null}
                  {polarityRatio !== null ? (
                    <View style={[styles.pill, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                      <Text style={[styles.pillText, { color: colors.textSubtle }]}>
                        Polarity {polarityRatio}x
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}
        </>
      ) : null}

      {activeTab === 'clusters' ? (
        <ClustersTab
          colors={colors}
          completeAnalysis={completeAnalysis}
          clusterMetrics={clusterMetrics}
          activeCluster={activeCluster}
          setActiveCluster={setActiveCluster}
          activeLens={activeLens}
          setActiveLens={setActiveLens}
          codeToDescription={codeToDescriptionForRender}
          codeToScoredItem={codeToScoredItem}
          personAName={personANameForCodes}
          personBName={personBNameForCodes}
          synastryAscendant={synastryAscendant}
          compositeAscendant={compositeAscendant}
          compositePlanetByName={compositePlanetByName}
          selfPlanetByName={selfPlanetByName}
          partnerPlanetByName={partnerPlanetByName}
          isCelebPair={isCelebPair}
        />
      ) : null}

      {activeTab === 'keyAspects' ? (
        <>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setChartModalOpen(true)}
            style={[
              styles.fullChartEntry,
              { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
            ]}
          >
            <View
              style={[
                styles.fullChartPreview,
                { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: colors.ghostBorder },
              ]}
            >
              <Svg width={52} height={52} viewBox="0 0 52 52">
                <Circle cx={26} cy={26} r={22} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
                <Circle cx={26} cy={26} r={16} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
                <Circle cx={26} cy={26} r={10} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
                <SvgLine x1={18} y1={12} x2={34} y2={36} stroke={SUPPORT_COLOR} strokeWidth={0.8} opacity={0.45} />
                <SvgLine
                  x1={38}
                  y1={18}
                  x2={14}
                  y2={32}
                  stroke={CHALLENGE_COLOR}
                  strokeWidth={0.8}
                  opacity={0.45}
                  strokeDasharray="2,2"
                />
                <Circle cx={18} cy={12} r={2.5} fill={colors.primary} opacity={0.7} />
                <Circle cx={38} cy={18} r={2.5} fill={SUPPORT_COLOR} opacity={0.7} />
                <Circle cx={14} cy={32} r={2.5} fill={colors.primary} opacity={0.7} />
                <Circle cx={34} cy={36} r={2.5} fill={SUPPORT_COLOR} opacity={0.7} />
              </Svg>
            </View>
            <View style={styles.fullChartCopy}>
              <Text style={[styles.fullChartTitle, { color: colors.text }]}>View full chart</Text>
              <Text style={[styles.fullChartSubtitle, { color: colors.textMuted }]}>
                Synastry & composite wheels with all planets and aspect lines
              </Text>
            </View>
            <Text style={[styles.fullChartChevron, { color: colors.textSubtle }]}>›</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionSub, { color: colors.textSubtle }]}>
            The highest-impact planetary interactions shaping this relationship, ranked by influence.
          </Text>

          {aspectMix ? (
            <View>
              <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>
                Aspect Mix
              </Text>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
                ]}
              >
                <View style={styles.aspectMixRow}>
                  <View
                    style={[
                      styles.aspectMixCard,
                      { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
                    ]}
                  >
                    <Text style={[styles.aspectMixCount, { color: colors.text }]}>
                      {aspectMix.total ?? '—'}
                    </Text>
                    <Text style={[styles.aspectMixLabel, { color: colors.textSubtle }]}>
                      Total
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.aspectMixCard,
                      { backgroundColor: SUPPORT_BG },
                    ]}
                  >
                    <Text style={[styles.aspectMixCount, { color: SUPPORT_COLOR }]}>
                      {aspectMix.support ?? '—'}
                    </Text>
                    <Text style={[styles.aspectMixLabel, { color: colors.textSubtle }]}>
                      Support
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.aspectMixCard,
                      { backgroundColor: CHALLENGE_BG },
                    ]}
                  >
                    <Text style={[styles.aspectMixCount, { color: CHALLENGE_COLOR }]}>
                      {aspectMix.challenge ?? '—'}
                    </Text>
                    <Text style={[styles.aspectMixLabel, { color: colors.textSubtle }]}>
                      Challenge
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>
              Keystone Aspects
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textSubtle }]}>
              The strongest individual aspects driving this connection.
            </Text>
          </View>

          {keystoneAspects.length > 0 ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.ghostBorder, paddingHorizontal: 16, paddingVertical: 6 },
              ]}
            >
              {keystoneAspects.map((ka, i) => {
                const aspectLabel = ka.description ?? '';
                const accentColor =
                  ka.dominantValence === 1
                    ? SUPPORT_COLOR
                    : ka.dominantValence === -1
                    ? CHALLENGE_COLOR
                    : colors.accent;
                return (
                  <View
                    key={`${aspectLabel}-${i}`}
                    style={[
                      styles.keystoneRow,
                      i < keystoneAspects.length - 1 && styles.keystoneRowDivider,
                      i < keystoneAspects.length - 1 && {
                        borderBottomColor: 'rgba(255, 255, 255, 0.04)',
                      },
                    ]}
                  >
                    <View style={[styles.keystoneAccent, { backgroundColor: accentColor }]} />
                    <View style={styles.keystoneBody}>
                      <ColoredAspectTitle
                        description={aspectLabel || 'Keystone aspect'}
                        planet1Name={ka.chart?.planet1.name}
                        planet2Name={ka.chart?.planet2.name}
                        planet1Color={
                          ka.chart?.source === 'synastry' ? colors.primary : undefined
                        }
                        planet2Color={
                          ka.chart?.source === 'synastry' ? SUPPORT_COLOR : undefined
                        }
                        baseStyle={[styles.keystoneTitle, { color: colors.text }]}
                      />
                      {(() => {
                        const p1 = formatPlacement(ka.chart?.planet1);
                        const p2 = formatPlacement(ka.chart?.planet2);
                        if (!p1 && !p2) return null;
                        return (
                          <Text style={[styles.keystonePlacement, { color: colors.textMuted }]}>
                            {[p1, p2].filter(Boolean).join('  ·  ')}
                          </Text>
                        );
                      })()}
                      {ka.annotation?.title ? (
                        <Text style={[styles.keystoneAnnotationTitle, { color: accentColor }]}>
                          {ka.annotation.title}
                        </Text>
                      ) : null}
                      {ka.annotation?.sentence ? (
                        <Text style={[styles.keystoneAnnotationSentence, { color: colors.textMuted }]}>
                          {ka.annotation.sentence}
                        </Text>
                      ) : null}
                      {ka.cluster ? (
                        <Text style={[styles.keystoneCluster, { color: colors.textSubtle }]}>
                          {ka.cluster}
                        </Text>
                      ) : null}
                    </View>
                    {ka.chart ? (
                      <AspectFocusChart
                        source={ka.chart.source}
                        planet1={ka.chart.planet1}
                        planet2={ka.chart.planet2}
                        aspect={ka.chart.aspect}
                        size={120}
                        ascendantDegree={
                          ka.chart.source === 'composite'
                            ? compositeAscendant
                            : ka.chart.source === 'synastry'
                            ? synastryAscendant
                            : 0
                        }
                        activeSignColor={colors.text}
                        inactiveSignColor="rgba(232, 228, 240, 0.12)"
                        ringColor="rgba(255, 255, 255, 0.07)"
                        planet1Color={
                          ka.chart.source === 'synastry' ? colors.primary : colors.text
                        }
                        planet2Color={
                          ka.chart.source === 'synastry' ? SUPPORT_COLOR : colors.text
                        }
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
              ]}
            >
              <Text style={[styles.cardBody, { color: colors.textMuted }]}>
                No keystone aspects available for this relationship yet.
              </Text>
            </View>
          )}

          {doubleWhammyAspects.length > 0 ? (
            <View>
              <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>
                Double Whammy Aspects
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textSubtle }]}>
                Mirrored aspect pairs that reinforce a single theme between you.
              </Text>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.ghostBorder, paddingHorizontal: 16, paddingVertical: 6 },
                ]}
              >
                {doubleWhammyAspects.map((dw, i) => {
                  const accent =
                    dw.dominantValence === 1
                      ? SUPPORT_COLOR
                      : dw.dominantValence === -1
                      ? CHALLENGE_COLOR
                      : colors.accent;
                  return (
                    <View
                      key={`${dw.description ?? ''}-${i}`}
                      style={[
                        styles.keystoneRow,
                        i < doubleWhammyAspects.length - 1 && styles.keystoneRowDivider,
                        i < doubleWhammyAspects.length - 1 && {
                          borderBottomColor: 'rgba(255, 255, 255, 0.04)',
                        },
                      ]}
                    >
                      <View style={[styles.keystoneAccent, { backgroundColor: accent }]} />
                      <View style={styles.keystoneBody}>
                        {dw.theme ? (
                          <Text style={[styles.dwTheme, { color: colors.text }]}>{dw.theme}</Text>
                        ) : null}
                        <View style={styles.dwPairRow}>
                          <View style={styles.dwPairText}>
                            {dw.description ? (
                              <ColoredAspectTitle
                                description={dw.description}
                                planet1Name={dw.chartA?.planet1.name}
                                planet2Name={dw.chartA?.planet2.name}
                                planet1Color={
                                  dw.chartA?.source === 'synastry' ? colors.primary : undefined
                                }
                                planet2Color={
                                  dw.chartA?.source === 'synastry' ? SUPPORT_COLOR : undefined
                                }
                                baseStyle={[styles.dwAspectLine, { color: colors.textMuted }]}
                              />
                            ) : null}
                          </View>
                          {dw.chartA ? (
                            <AspectFocusChart
                              source={dw.chartA.source}
                              planet1={dw.chartA.planet1}
                              planet2={dw.chartA.planet2}
                              aspect={dw.chartA.aspect}
                              size={120}
                              ascendantDegree={
                                dw.chartA.source === 'composite'
                                  ? compositeAscendant
                                  : dw.chartA.source === 'synastry'
                                  ? synastryAscendant
                                  : 0
                              }
                              activeSignColor={colors.text}
                              inactiveSignColor="rgba(232, 228, 240, 0.12)"
                              ringColor="rgba(255, 255, 255, 0.07)"
                              planet1Color={
                                dw.chartA.source === 'synastry' ? colors.primary : colors.text
                              }
                              planet2Color={
                                dw.chartA.source === 'synastry' ? SUPPORT_COLOR : colors.text
                              }
                            />
                          ) : null}
                        </View>
                        <View style={styles.dwPairRow}>
                          <View style={styles.dwPairText}>
                            {dw.partnerDescription ? (
                              <ColoredAspectTitle
                                description={dw.partnerDescription}
                                planet1Name={dw.chartB?.planet1.name}
                                planet2Name={dw.chartB?.planet2.name}
                                planet1Color={
                                  dw.chartB?.source === 'synastry' ? colors.primary : undefined
                                }
                                planet2Color={
                                  dw.chartB?.source === 'synastry' ? SUPPORT_COLOR : undefined
                                }
                                baseStyle={[styles.dwAspectLine, { color: colors.textMuted }]}
                              />
                            ) : null}
                          </View>
                          {dw.chartB ? (
                            <AspectFocusChart
                              source={dw.chartB.source}
                              planet1={dw.chartB.planet1}
                              planet2={dw.chartB.planet2}
                              aspect={dw.chartB.aspect}
                              size={120}
                              ascendantDegree={
                                dw.chartB.source === 'composite'
                                  ? compositeAscendant
                                  : dw.chartB.source === 'synastry'
                                  ? synastryAscendant
                                  : 0
                              }
                              activeSignColor={colors.text}
                              inactiveSignColor="rgba(232, 228, 240, 0.12)"
                              ringColor="rgba(255, 255, 255, 0.07)"
                              planet1Color={
                                dw.chartB.source === 'synastry' ? colors.primary : colors.text
                              }
                              planet2Color={
                                dw.chartB.source === 'synastry' ? SUPPORT_COLOR : colors.text
                              }
                            />
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </>
      ) : null}

      {!hideHoroscope && activeTab === 'horoscope' ? (
        relationship && onRelationshipUpdated ? (
          <RelationshipHoroscopeTab
            relationship={relationship}
            partnerName={personBName ?? 'them'}
            onUpdated={onRelationshipUpdated}
          />
        ) : (
          <Text style={[styles.sectionSub, { color: colors.textSubtle }]}>
            Horoscope settings are unavailable for this connection.
          </Text>
        )
      ) : null}

      <FullChartModal
        visible={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        colors={colors}
        personAName={personANameForCodes}
        personBName={personBNameForCodes}
        personABirthChart={selfBirthChart as any}
        personBBirthChart={partnerBirthChart as any}
        compositeChart={previewAnalysis?.compositeChart ?? fullAnalysis?.compositeChart}
        synastryAspects={previewAnalysis?.synastryAspects ?? fullAnalysis?.synastryAspects}
      />
    </>
  );
}

interface ClusterKeyAspectsLensSection {
  codes?: string[];
}

interface ClusterKeyAspectsBlock {
  synastry?: ClusterKeyAspectsLensSection;
  composite?: ClusterKeyAspectsLensSection;
}

interface ClustersTabProps {
  colors: RelationshipTheme['colors'];
  completeAnalysis: Partial<Record<ClusterName, ClusterCompleteAnalysis & { keyAspects?: ClusterKeyAspectsBlock }>> | null;
  clusterMetrics: Partial<Record<ClusterName, ClusterMetrics>> | null;
  activeCluster: ClusterName;
  setActiveCluster: (name: ClusterName) => void;
  activeLens: LensKey;
  setActiveLens: (lens: LensKey) => void;
  codeToDescription: Record<string, string>;
  codeToScoredItem: Record<string, any>;
  personAName: string;
  personBName: string;
  synastryAscendant: number;
  compositeAscendant: number;
  compositePlanetByName: Record<string, { sign?: string; degree?: number; house?: number }>;
  selfPlanetByName: Record<string, { sign?: string; degree?: number; house?: number }>;
  partnerPlanetByName: Record<string, { sign?: string; degree?: number; house?: number }>;
  isCelebPair?: boolean;
}

function ClustersTab({
  colors,
  completeAnalysis,
  clusterMetrics,
  activeCluster,
  setActiveCluster,
  setActiveLens,
  codeToDescription,
  codeToScoredItem,
  personAName,
  personBName,
  synastryAscendant,
  compositeAscendant,
  compositePlanetByName,
  selfPlanetByName,
  partnerPlanetByName,
  isCelebPair = false,
}: ClustersTabProps) {
  // When the user picks a different cluster, snap the lens back to "between"
  // (matches the mock's behavior).
  useEffect(() => {
    setActiveLens('between');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCluster]);

  const ca = completeAnalysis?.[activeCluster] ?? {};
  const cm: ClusterMetrics = clusterMetrics?.[activeCluster] ?? {};
  const activeScore = typeof cm.score === 'number' ? Math.round(cm.score) : null;
  // Chemistry-only: cluster interpretations are synastry ("between") only. The composite
  // ("relationship itself") cluster panels are no longer returned by the backend, so the lens
  // toggle is removed and we always render the synastry source.
  const lensSource = ca.synastry;
  const lensKeyAspectCodes: string[] = ca.keyAspects?.synastry?.codes ?? [];
  const subtitle = isCelebPair
    ? 'How their charts interact with each other'
    : 'How your charts interact with each other';

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillScrollContent}
        style={styles.pillScroll}
      >
        {CLUSTER_ORDER.map((name) => {
          const isActive = activeCluster === name;
          const score =
            typeof clusterMetrics?.[name]?.score === 'number'
              ? Math.round(clusterMetrics[name]!.score!)
              : null;
          return (
            <TouchableOpacity
              key={name}
              activeOpacity={0.85}
              onPress={() => setActiveCluster(name)}
              style={[
                styles.clusterPill,
                {
                  backgroundColor: isActive ? colors.surface : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isActive ? colors.ghostBorder : 'rgba(255, 255, 255, 0.04)',
                },
              ]}
            >
              <Text style={styles.pillIcon}>{CLUSTER_ICONS[name]}</Text>
              <Text
                style={[
                  styles.pillName,
                  {
                    color: isActive ? colors.text : colors.textSubtle,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {name}
              </Text>
              {score !== null ? (
                <Text
                  style={[
                    styles.pillScore,
                    { color: isActive ? colors.primary : colors.textSubtle },
                  ]}
                >
                  {score}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.clusterHeaderRow}>
        <View
          style={[
            styles.clusterHeaderIcon,
            { backgroundColor: 'rgba(202, 190, 255, 0.12)' },
          ]}
        >
          <Text style={styles.clusterHeaderIconText}>{CLUSTER_ICONS[activeCluster]}</Text>
        </View>
        <View style={styles.clusterHeaderMeta}>
          <View style={styles.clusterHeaderTitleRow}>
            <Text style={[styles.clusterHeaderName, { color: colors.text }]}>{activeCluster}</Text>
            {activeScore !== null ? (
              <Text style={[styles.clusterHeaderScore, { color: colors.primary }]}>
                {activeScore}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.clusterHeaderSubtitle, { color: colors.textSubtle }]}>
            {subtitle}
          </Text>
        </View>
      </View>

      {lensSource &&
      (lensSource.supportPanel || lensSource.challengePanel || lensSource.synthesisPanel) ? (
        <>
          <ClusterPanel kind="support" text={lensSource.supportPanel} />
          <ClusterPanel kind="challenge" text={lensSource.challengePanel} />
          <ClusterPanel kind="synthesis" text={lensSource.synthesisPanel} colors={colors} />
        </>
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <Text style={[styles.cardBody, { color: colors.textMuted }]}>
            Long-form analysis isn't available for this view yet.
          </Text>
        </View>
      )}

      {lensKeyAspectCodes.length > 0 ? (
        <AspectsConsidered
          colors={colors}
          codes={lensKeyAspectCodes}
          codeToDescription={codeToDescription}
          codeToScoredItem={codeToScoredItem}
          personAName={personAName}
          personBName={personBName}
          synastryAscendant={synastryAscendant}
          compositeAscendant={compositeAscendant}
          compositePlanetByName={compositePlanetByName}
          selfPlanetByName={selfPlanetByName}
          partnerPlanetByName={partnerPlanetByName}
        />
      ) : null}
    </View>
  );
}

interface AspectsConsideredProps {
  colors: RelationshipTheme['colors'];
  codes: string[];
  codeToDescription: Record<string, string>;
  codeToScoredItem: Record<string, any>;
  personAName: string;
  personBName: string;
  synastryAscendant: number;
  compositeAscendant: number;
  compositePlanetByName: Record<string, { sign?: string; degree?: number; house?: number }>;
  selfPlanetByName: Record<string, { sign?: string; degree?: number; house?: number }>;
  partnerPlanetByName: Record<string, { sign?: string; degree?: number; house?: number }>;
}

type CarouselCard =
  | {
      kind: 'aspect';
      code: string;
      chart: AspectChartData;
      valence?: number;
    }
  | {
      kind: 'placement';
      code: string;
      planet: { name: string; sign?: string; degree?: number; house?: number; isRetro?: boolean };
      source: 'synastry' | 'composite' | 'natal';
    };

function buildPlacementCardFromScoredItem(
  item: any,
  code: string
): CarouselCard | null {
  const planetName: string | undefined = item?.planet1 ?? item?.planet;
  if (!planetName) return null;
  const sourceRaw: string | undefined = item?.source;
  const source: 'synastry' | 'composite' | 'natal' =
    sourceRaw === 'composite' ? 'composite' : sourceRaw === 'synastry' ? 'synastry' : 'natal';
  return {
    kind: 'placement',
    code,
    source,
    planet: {
      name: planetName,
      sign: typeof item?.planet1Sign === 'string' ? item.planet1Sign : item?.sign,
      degree: typeof item?.planet1Degree === 'number' ? item.planet1Degree : item?.degree,
      house: typeof item?.planet1House === 'number' ? item.planet1House : item?.house,
      isRetro: Boolean(item?.planet1IsRetro ?? item?.isRetro),
    },
  };
}

// Look up sign + degree from the chart data when the code or scored item
// didn't carry them. Aspect cards: planet1 always from "primary" chart
// (composite for composite source, self for synastry/natal); planet2 follows
// the source rule (partner for synastry, composite for composite, self for
// natal). Placement cards: single planet, source decides which chart.
function enrichCard(
  card: CarouselCard,
  compositePlanetByName: Record<string, { sign?: string; degree?: number; house?: number }>,
  selfPlanetByName: Record<string, { sign?: string; degree?: number; house?: number }>,
  partnerPlanetByName: Record<string, { sign?: string; degree?: number; house?: number }>
): CarouselCard {
  if (card.kind === 'placement') {
    if (card.planet.sign && typeof card.planet.degree === 'number') return card;
    const lookup =
      card.source === 'composite'
        ? compositePlanetByName[card.planet.name]
        : selfPlanetByName[card.planet.name];
    if (!lookup) return card;
    return {
      ...card,
      planet: {
        ...card.planet,
        sign: card.planet.sign ?? lookup.sign,
        degree:
          typeof card.planet.degree === 'number' ? card.planet.degree : lookup.degree,
      },
    };
  }
  // Aspect card
  const { chart } = card;
  const lookup1 =
    chart.source === 'composite'
      ? compositePlanetByName[chart.planet1.name]
      : selfPlanetByName[chart.planet1.name];
  const lookup2 =
    chart.source === 'composite'
      ? compositePlanetByName[chart.planet2.name]
      : chart.source === 'synastry'
      ? partnerPlanetByName[chart.planet2.name]
      : selfPlanetByName[chart.planet2.name];
  return {
    ...card,
    chart: {
      ...chart,
      planet1: {
        ...chart.planet1,
        sign: chart.planet1.sign ?? lookup1?.sign,
        degree:
          typeof chart.planet1.degree === 'number' ? chart.planet1.degree : lookup1?.degree,
        house: chart.planet1.house ?? lookup1?.house,
      },
      planet2: {
        ...chart.planet2,
        sign: chart.planet2.sign ?? lookup2?.sign,
        degree:
          typeof chart.planet2.degree === 'number' ? chart.planet2.degree : lookup2?.degree,
        house: chart.planet2.house ?? lookup2?.house,
      },
    },
  };
}

function buildCardFromCode(
  code: string,
  scoredItem: any,
  personAName: string,
  personBName: string
): CarouselCard | null {
  const isAspectCode =
    code.startsWith('SynA-') ||
    code.startsWith('A-') ||
    code.startsWith('CompA-') ||
    code.startsWith('Tr-');
  const isPlacementCode =
    code.startsWith('Pp-') || code.startsWith('SynP-') || code.startsWith('CompP-');

  if (scoredItem) {
    if (isAspectCode || scoredItem?.aspect) {
      const chart = buildChartFromScoredItem(scoredItem);
      if (chart) {
        return {
          kind: 'aspect',
          code,
          chart,
          valence: valenceFromAspect(chart.aspect),
        };
      }
    }
    if (isPlacementCode || (!scoredItem?.aspect && (scoredItem?.planet1 || scoredItem?.planet))) {
      const card = buildPlacementCardFromScoredItem(scoredItem, code);
      if (card) return card;
    }
  }

  // Fallback: decode the code itself when we don't have a scored item.
  const decoded = decodeAstroCode(code, {
    person1Name: personAName,
    person2Name: personBName,
  });
  if (!decoded) return null;
  if (decoded.type === 'aspect' || decoded.type === 'synastry') {
    return {
      kind: 'aspect',
      code,
      chart: {
        source: decoded.type === 'synastry' ? 'synastry' : 'natal',
        aspect: decoded.aspect,
        planet1: { name: decoded.p1.planet, sign: decoded.p1.sign, house: decoded.p1.house },
        planet2: { name: decoded.p2.planet, sign: decoded.p2.sign, house: decoded.p2.house },
      },
      valence: valenceFromAspect(decoded.aspect),
    };
  }
  if (decoded.type === 'placement') {
    return {
      kind: 'placement',
      code,
      source: 'natal',
      planet: { name: decoded.planet, sign: decoded.sign, house: decoded.house },
    };
  }
  if (decoded.type === 'synastryPlacement') {
    return {
      kind: 'placement',
      code,
      source: 'synastry',
      planet: { name: decoded.planet, house: decoded.house },
    };
  }
  if (decoded.type === 'compositePlacement') {
    return {
      kind: 'placement',
      code,
      source: 'composite',
      planet: { name: decoded.planet, house: decoded.house },
    };
  }
  if (decoded.type === 'compositeAspect') {
    return {
      kind: 'aspect',
      code,
      chart: {
        source: 'composite',
        aspect: decoded.aspect,
        planet1: { name: decoded.p1.planet, sign: 'Aries', house: decoded.p1.house },
        planet2: { name: decoded.p2.planet, sign: 'Aries', house: decoded.p2.house },
      },
      valence: valenceFromAspect(decoded.aspect),
    };
  }
  return null;
}

function AspectsConsidered({
  colors,
  codes,
  codeToScoredItem,
  personAName,
  personBName,
  synastryAscendant,
  compositeAscendant,
  compositePlanetByName,
  selfPlanetByName,
  partnerPlanetByName,
}: AspectsConsideredProps) {
  const cards: CarouselCard[] = [];
  for (const code of codes) {
    const built = buildCardFromCode(code, codeToScoredItem[code], personAName, personBName);
    if (!built) continue;
    cards.push(enrichCard(built, compositePlanetByName, selfPlanetByName, partnerPlanetByName));
  }

  if (cards.length === 0) return null;

  return (
    <View style={styles.aspectsConsideredWrap}>
      <View style={styles.aspectsConsideredHeaderRow}>
        <Text style={[styles.aspectsConsideredLabel, { color: colors.textSubtle }]}>
          Aspects considered · {cards.length}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={154}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContent}
        style={styles.carouselScroll}
      >
        {cards.map((card, i) => (
          <AspectCard
            key={`${card.code}-${i}`}
            card={card}
            colors={colors}
            personAName={personAName}
            personBName={personBName}
            synastryAscendant={synastryAscendant}
            compositeAscendant={compositeAscendant}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface AspectCardProps {
  card: CarouselCard;
  colors: RelationshipTheme['colors'];
  personAName: string;
  personBName: string;
  synastryAscendant: number;
  compositeAscendant: number;
}

function AspectCard({
  card,
  colors,
  personAName,
  personBName,
  synastryAscendant,
  compositeAscendant,
}: AspectCardProps) {
  const valence = card.kind === 'aspect' ? card.valence : 0;
  const sourceForRotation = card.kind === 'aspect' ? card.chart.source : card.source;
  const ascendantDegree =
    sourceForRotation === 'composite'
      ? compositeAscendant
      : sourceForRotation === 'synastry'
      ? synastryAscendant
      : 0;
  const borderColor =
    valence === 1
      ? 'rgba(130, 200, 180, 0.6)'
      : valence === -1
      ? 'rgba(232, 133, 107, 0.6)'
      : 'rgba(202, 190, 255, 0.4)';

  if (card.kind === 'aspect') {
    const { chart } = card;
    const isSyn = chart.source === 'synastry';
    const p1Color = isSyn ? colors.primary : colors.text;
    const p2Color = isSyn ? SUPPORT_COLOR : colors.text;
    const placementLine = [
      shortPlacement(chart.planet1),
      shortPlacement(chart.planet2),
    ]
      .filter(Boolean)
      .join('  ·  ');
    return (
      <View style={[styles.carouselCard, { backgroundColor: colors.surface, borderColor }]}>
        <View style={styles.carouselChart}>
          <AspectFocusChart
            source={chart.source}
            planet1={chart.planet1}
            planet2={chart.planet2}
            aspect={chart.aspect}
            size={100}
            ascendantDegree={ascendantDegree}
            activeSignColor={colors.text}
            inactiveSignColor="rgba(232, 228, 240, 0.12)"
            ringColor="rgba(255, 255, 255, 0.07)"
            planet1Color={p1Color}
            planet2Color={p2Color}
          />
        </View>
        <Text style={[styles.carouselTitle, { color: colors.text }]} numberOfLines={1}>
          <Text style={{ color: p1Color, fontWeight: '600' }}>{chart.planet1.name}</Text>
          <Text> {aspectGlyph(chart.aspect)} </Text>
          <Text style={{ color: p2Color, fontWeight: '600' }}>{chart.planet2.name}</Text>
        </Text>
        {placementLine ? (
          <Text style={[styles.carouselDegrees, { color: colors.text }]} numberOfLines={1}>
            {placementLine}
          </Text>
        ) : null}
        {isSyn ? (
          <Text style={styles.carouselOwnership} numberOfLines={1}>
            <Text style={{ color: p1Color }}>{personAName}</Text>
            <Text style={{ color: colors.text }}>  ·  </Text>
            <Text style={{ color: p2Color }}>{personBName}</Text>
          </Text>
        ) : null}
      </View>
    );
  }

  // Placement
  const planetColor = card.source === 'synastry' ? colors.primary : colors.text;
  const placementLine = shortPlacement(card.planet);
  const houseLabel =
    typeof card.planet.house === 'number' && card.planet.house > 0
      ? `${card.planet.house}${ordinalSuffix(card.planet.house)} house`
      : null;
  return (
    <View style={[styles.carouselCard, { backgroundColor: colors.surface, borderColor }]}>
      <View style={styles.carouselChart}>
        <PlacementFocusChart
          planet={card.planet}
          size={100}
          ascendantDegree={ascendantDegree}
          planetColor={planetColor}
          activeSignColor={colors.text}
          inactiveSignColor="rgba(232, 228, 240, 0.12)"
          ringColor="rgba(255, 255, 255, 0.07)"
        />
      </View>
      <Text style={[styles.carouselTitle, { color: colors.text }]} numberOfLines={1}>
        <Text style={{ color: planetColor, fontWeight: '600' }}>{card.planet.name}</Text>
      </Text>
      {placementLine || houseLabel ? (
        <Text style={[styles.carouselDegrees, { color: colors.text }]} numberOfLines={1}>
          {[placementLine, houseLabel].filter(Boolean).join('  ·  ')}
        </Text>
      ) : null}
    </View>
  );
}

function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return 'th';
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

interface ClusterPanelProps {
  kind: 'support' | 'challenge' | 'synthesis';
  text?: string | null;
  colors?: RelationshipTheme['colors'];
}

function ClusterPanel({ kind, text, colors }: ClusterPanelProps) {
  if (!text) return null;
  const styleMap = {
    support: { bg: SUPPORT_BG, border: SUPPORT_BORDER, accent: SUPPORT_COLOR, label: 'What works' },
    challenge: {
      bg: CHALLENGE_BG,
      border: CHALLENGE_BORDER,
      accent: CHALLENGE_COLOR,
      label: "What's difficult",
    },
    synthesis: {
      bg: SYNTH_BG,
      border: SYNTH_BORDER,
      accent: colors?.primary ?? '#cabeff',
      label: 'The full picture',
    },
  } as const;
  const s = styleMap[kind];
  return (
    <View style={[styles.panel, { backgroundColor: s.bg, borderColor: s.border }]}>
      <View style={styles.panelLabelRow}>
        <View style={[styles.panelDot, { backgroundColor: s.accent }]} />
        <Text style={[styles.panelLabel, { color: s.accent }]}>{s.label}</Text>
      </View>
      <Text style={styles.panelText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  unlockedPillRow: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  keystoneCluster: {
    fontSize: 10,
    marginTop: 4,
  },
  fullChartEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  fullChartPreview: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullChartCopy: {
    flex: 1,
  },
  fullChartTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  fullChartSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  fullChartChevron: {
    fontSize: 22,
    fontWeight: '500',
    marginLeft: 4,
  },
  keystonePlacement: {
    fontSize: 11,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  keystoneAnnotationTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  keystoneAnnotationSentence: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 2,
  },
  aspectMixRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aspectMixCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  aspectMixCount: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  aspectMixLabel: {
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dwTheme: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  dwAspectLine: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },
  dwPairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  dwPairText: {
    flex: 1,
  },
  unlockedPill: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  unlockedPillText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  sectionDividerLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  sectionEyebrow: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12.5,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  tinyEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cardBody: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  pillScroll: {
    marginHorizontal: -20,
    marginBottom: 14,
  },
  pillScrollContent: {
    paddingHorizontal: 20,
    gap: 6,
  },
  clusterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  pillIcon: {
    fontSize: 14,
  },
  pillName: {
    fontSize: 12.5,
  },
  pillScore: {
    fontFamily: 'Georgia',
    fontSize: 14,
    fontWeight: '700',
  },
  lensRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  lensTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  lensTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clusterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  clusterHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterHeaderIconText: {
    fontSize: 22,
  },
  clusterHeaderMeta: {
    flex: 1,
  },
  clusterHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clusterHeaderName: {
    fontSize: 18,
    fontWeight: '700',
  },
  clusterHeaderScore: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
  },
  clusterHeaderSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  aspectsConsideredWrap: {
    marginTop: 6,
  },
  aspectsConsideredHeaderRow: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  aspectsConsideredLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  carouselScroll: {
    marginHorizontal: -20,
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  carouselCard: {
    width: 144,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  carouselChart: {
    marginBottom: 8,
  },
  carouselTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  carouselOwnership: {
    fontSize: 11.5,
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  carouselDegrees: {
    fontSize: 11.5,
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  panelLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  panelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  panelLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  panelText: {
    fontFamily: 'Georgia',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    color: 'rgba(232, 228, 240, 0.78)',
  },
  keystoneRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  keystoneRowDivider: {
    borderBottomWidth: 1,
  },
  keystoneAccent: {
    width: 6,
    minHeight: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  keystoneBody: {
    flex: 1,
  },
  keystoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    marginBottom: 3,
  },
});
